import { useState, useRef, useEffect } from "react";
import { Upload, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ChatMessage from "@/components/ChatMessage";
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
}

export default function Index() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou seu assistente de análise de dados da Alpha Insights. Tenho mais de 20 anos de experiência em análise de dados, Excel, Sheets e dashboards.\n\nPara começar, carregue uma planilha (CSV ou Excel) e faça suas perguntas sobre os dados. Posso ajudá-lo a identificar tendências, gerar insights e fornecer análises detalhadas.",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<SpreadsheetFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

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
        };
        
        setFiles((prev) => [...prev, newFile]);
        
        const uploadMessage: Message = {
          role: "assistant",
          content: `✓ Planilha "${file.name}" carregada com sucesso! Encontrei ${rowCount} linhas de dados. Agora você pode fazer perguntas sobre esses dados.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, uploadMessage]);
        
        toast.success(`Arquivo ${file.name} carregado!`);
      } catch (error) {
        toast.error(`Erro ao ler arquivo ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
            // For Excel files, we need to convert to CSV
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    if (files.length === 0) {
      toast.error("Por favor, carregue uma planilha antes de fazer perguntas.");
      return;
    }

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      await streamChat(userMessage.content);
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar mensagem");
      setIsLoading(false);
    }
  };

  const streamChat = async (userInput: string) => {
    const spreadsheetData = files.map(f => ({
      name: f.name,
      content: f.content,
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
          .filter((m) => m.content !== messages[0].content) // Remove welcome message
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
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-sm flex items-center gap-2"
                >
                  <Upload className="h-3 w-3" />
                  {file.name}
                </div>
              ))}
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
              onClick={handleSendMessage}
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
        </div>
      </main>
    </div>
  );
}
