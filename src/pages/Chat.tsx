import { useState, useRef, useEffect } from "react";
import { Upload, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatMessage from "@/components/ChatMessage";
import QuickActions from "@/components/QuickActions";
import { toast } from "sonner";
import alphaLogo from "@/assets/alpha-insights-logo.png";

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
      content: "E aí! 👋 Sou o Alpha, seu analista de dados favorito da Alpha Insights!\n\nCom mais de 20 anos destrinchando planilhas, Excel e dashboards, eu sou ESPECIALISTA em transformar números em insights que realmente importam. E o melhor: eu faço isso com estilo! 😎\n\n**Como funciona:**\n1. 📊 Carregue suas planilhas (CSV ou Excel) - pode selecionar várias de uma vez!\n2. 🎯 Faça suas perguntas sobre os dados\n3. 💡 Receba análises precisas, insights acionáveis e recomendações certeiras\n\n**Meu diferencial?** Eu analiso TODAS as planilhas que você enviar, cruzo os dados e sempre respondo com 100% de certeza nos números. Nada de achismos por aqui!\n\nBora começar? Selecione suas planilhas de uma vez que eu vou DETONAR essa análise! 🚀",
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
        content: `🎯 Show! Carregamos ${uploadCount} arquivo${uploadCount > 1 ? 's' : ''} com sucesso!\n\n${totalFiles > 1 ? `Agora temos ${totalFiles} planilhas no total. Vou conseguir cruzar esses dados e encontrar insights ainda mais poderosos! 💪` : 'Manda suas perguntas que vou arrasar nessa análise!'} 🚀`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, uploadMessage]);
      toast.success(`${uploadCount} arquivo${uploadCount > 1 ? 's carregados' : ' carregado'}!`);
    }, 500);
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

    try {
      await streamChat(text);
    } catch (error: any) {
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
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={alphaLogo} alt="Alpha Insights" className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Alpha Insights
              </h1>
              <p className="text-xs text-muted-foreground">Bot Analítico de Dados</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 flex flex-col max-w-4xl">
        <div className="flex-1 overflow-y-auto space-y-4 mb-6">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="space-y-4 border-t border-border/40 pt-4">
          {files.length === 0 && (
            <div className="text-center mb-4 p-6 border-2 border-dashed border-border/40 rounded-lg bg-muted/20">
              <Upload className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">
                📊 Selecione várias planilhas de uma vez para começar a análise
              </p>
              <p className="text-xs text-muted-foreground">
                Use Ctrl/Cmd + clique para selecionar múltiplos arquivos! 🚀
              </p>
            </div>
          )}

          {files.length > 0 && messages.length <= 1 && (
            <QuickActions
              onActionClick={handleSendMessage}
              disabled={isLoading}
            />
          )}

          {files.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>📊 {files.length} planilha{files.length > 1 ? 's' : ''} carregada{files.length > 1 ? 's' : ''}</span>
                <span className="text-primary">O Alpha está analisando todas!</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm flex items-center gap-2"
                  >
                    <Upload className="h-3 w-3" />
                    <span className="font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">({file.rowCount} linhas)</span>
                  </div>
                ))}
              </div>
            </div>
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
              title="Selecione múltiplos arquivos de uma vez (Ctrl/Cmd + clique)"
            >
              <Upload className="h-5 w-5" />
            </Button>
            
            <Textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua pergunta sobre os dados..."
              disabled={isLoading}
              className="min-h-[60px] max-h-[120px] resize-none"
            />
            
            <Button
              onClick={() => handleSendMessage()}
              size="icon"
              disabled={isLoading || !inputMessage.trim()}
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
            Alpha Insights pode cometer erros. Sempre verifique informações importantes.
          </p>
        </div>
      </main>
    </div>
  );
}
