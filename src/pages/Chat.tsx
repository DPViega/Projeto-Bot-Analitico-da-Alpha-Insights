import { useState, useRef, useEffect } from "react";
import { Upload, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatMessage from "@/components/ChatMessage";
import QuickActions from "@/components/QuickActions";
import SpreadsheetSidebar from "@/components/SpreadsheetSidebar";
import { toast } from "sonner";
import alphaLogo from "@/assets/alpha-insights-logo-new.png";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SpreadsheetFile {
  id: string;
  name: string;
  content: string;
  rowCount: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "E aí! 👋 Sou o DataVox, seu analista de dados com mais de 20 anos de experiência destrinchando planilhas!\n\nCom meu estilo único e 100% de certeza nas análises, vou transformar seus dados em insights PODEROSOS! 💪\n\n**Como funciona:**\n1. 📊 Carregue suas planilhas (CSV ou Excel) - VÁRIAS de uma vez!\n2. 🎯 Faça suas perguntas sobre os dados\n3. 💡 Receba análises precisas com números EXATOS e recomendações certeiras\n\n**Meu diferencial?** Analiso TODAS as planilhas juntas, cruzo dados e SEMPRE respondo com 100% de certeza. Zero achismo! 🚀\n\nBora começar? Carregue suas planilhas que eu vou ARRASAR nessa análise! 😎",
      timestamp: new Date(),
    }
  ]);
  const [files, setFiles] = useState<SpreadsheetFile[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    
    const uploadCount = selectedFiles.length;
    toast.info(`Carregando ${uploadCount} arquivo${uploadCount > 1 ? 's' : ''}...`);

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!validTypes.includes(file.type)) {
        toast.error(`Arquivo ${file.name} não é um CSV ou Excel válido`);
        continue;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error(`Arquivo ${file.name} é muito grande (máx 10MB)`);
        continue;
      }

      try {
        const content = await readFileContent(file);
        const lines = content.split("\n").filter((line) => line.trim());
        const rowCount = lines.length - 1;
        
        const newFile: SpreadsheetFile = {
          id: crypto.randomUUID(),
          name: file.name,
          content: content,
          rowCount: rowCount,
        };
        
        setFiles((prev) => [...prev, newFile]);
      } catch (error) {
        toast.error(`Erro ao ler arquivo ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    
    // Mensagem de confirmação após todos os uploads
    setTimeout(() => {
      const totalFiles = files.length + uploadCount;
      const uploadMessage: Message = {
        role: "assistant",
        content: `🎯 Boa! Carregamos ${uploadCount} arquivo${uploadCount > 1 ? 's' : ''} com SUCESSO!\n\n${files.map(f => `📊 ${f.name}: ${f.rowCount} linhas`).join('\n')}\n\n${totalFiles > 1 ? `Total de ${totalFiles} planilhas prontas! Agora posso cruzar esses dados e entregar insights DEVASTADORES! 💪` : 'Manda suas perguntas que vou DETONAR nessa análise!'} 🚀`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, uploadMessage]);
      toast.success(`${uploadCount} arquivo${uploadCount > 1 ? 's carregados' : ' carregado'}!`);
    }, 500);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter(f => f.id !== id));
    toast.success("Planilha removida!");
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result;
          if (file.name.endsWith('.csv')) {
            resolve(data as string);
          } else {
            const XLSX = await import('xlsx');
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const csv = XLSX.utils.sheet_to_csv(firstSheet);
            resolve(csv);
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
      
      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || inputMessage;
    if (!text.trim() || isLoading) return;

    if (files.length === 0) {
      toast.error("Por favor, carregue uma planilha antes de fazer perguntas.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Adicionar mensagem de "digitando"
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", timestamp: new Date() }
    ]);

    try {
      await streamChat(text);
    } catch (error: any) {
      // Remover mensagem de digitando em caso de erro
      setMessages((prev) => prev.slice(0, -1));
      toast.error(error.message || "Erro ao processar mensagem");
      setIsLoading(false);
    }
  };

  const streamChat = async (userInput: string) => {
    const spreadsheetData = files.map(f => ({
      name: f.name,
      content: f.content,
      rowCount: f.rowCount,
    }));

    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-analytics`;
    
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages: messages
          .filter((m) => m.content !== messages[0].content)
          .map((m) => ({ role: m.role, content: m.content }))
          .concat({ role: "user", content: userInput }),
        spreadsheetData,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        toast.error("Limite de requisições excedido. Aguarde alguns instantes.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Créditos insuficientes. Adicione créditos ao workspace.");
        setIsLoading(false);
        return;
      }
      throw new Error("Erro ao processar resposta");
    }

    if (!resp.body) {
      throw new Error("Sem resposta do servidor");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    let assistantContent = "";

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [
                ...prev,
                { role: "assistant", content: assistantContent, timestamp: new Date() },
              ];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar de Planilhas */}
      <SpreadsheetSidebar 
        spreadsheets={files}
        onRemove={handleRemoveFile}
      />

      {/* Área Principal - Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center gap-3">
            <img src={alphaLogo} alt="Alpha Insights" className="h-12 w-12" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Alpha Insights
              </h1>
              <p className="text-xs text-muted-foreground">DataVox - Seu Analista de Dados</p>
            </div>
          </div>
        </header>

        {/* Chat */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
              isTyping={isLoading && message.role === "assistant" && index === messages.length - 1 && !message.content}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border/40 p-6 space-y-4">
          {files.length === 0 && (
            <div className="text-center p-6 border-2 border-dashed border-border/40 rounded-lg bg-muted/20">
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                📊 Carregue suas planilhas para começar
              </p>
              <p className="text-xs text-muted-foreground">
                Selecione múltiplos arquivos (Ctrl/Cmd + clique)! 🚀
              </p>
            </div>
          )}

          {files.length > 0 && (
            <QuickActions
              onActionClick={handleSendMessage}
              disabled={isLoading}
            />
          )}

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              <Upload className="h-5 w-5" />
            </Button>
            
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta para o DataVox..."
              disabled={isLoading || files.length === 0}
              className="min-h-[60px] max-h-[120px] resize-none"
            />
            
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              disabled={isLoading || !inputMessage.trim() || files.length === 0}
              className="bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity h-[60px] w-[60px] flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            DataVox pode cometer erros. Sempre verifique informações importantes.
          </p>
        </div>
      </div>
    </div>
  );
}
