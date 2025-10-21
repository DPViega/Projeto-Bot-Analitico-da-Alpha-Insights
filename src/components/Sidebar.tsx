import { MessageSquare, Plus, FileSpreadsheet, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  date: string;
}

interface SpreadsheetFile {
  id: string;
  name: string;
  rowCount: number;
  date: string;
}

interface SidebarProps {
  conversations: Conversation[];
  spreadsheets: SpreadsheetFile[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onUpdateData: () => void;
  onClearHistory: () => void;
}

export default function Sidebar({
  conversations,
  spreadsheets,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onUpdateData,
  onClearHistory,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-card/50 backdrop-blur-sm border-r border-border/40 transition-all duration-300 z-40",
          isOpen ? "w-64" : "w-0 md:w-16",
          isMobile && !isOpen && "hidden"
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className={cn("font-semibold", !isOpen && "md:hidden")}>
                Conversas
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="hidden md:flex"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
            
            {isOpen && (
              <Button
                onClick={onNewConversation}
                className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova Conversa
              </Button>
            )}
          </div>

          {isOpen && (
            <>
              <ScrollArea className="flex-1 mb-6">
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => onSelectConversation(conv.id)}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                        currentConversationId === conv.id
                          ? "bg-primary/10 border border-primary/20"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">{conv.title}</p>
                          <p className="text-xs text-muted-foreground">{conv.date}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Planilhas Carregadas</h3>
                  <ScrollArea className="max-h-32">
                    <div className="space-y-2">
                      {spreadsheets.map((file) => (
                        <div
                          key={file.id}
                          className="px-3 py-2 bg-muted/50 rounded-md text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1 overflow-hidden">
                              <p className="truncate font-medium">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {file.rowCount} linhas • {file.date}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-2 border-t border-border/40 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onUpdateData}
                    className="w-full"
                  >
                    Atualizar Dados
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClearHistory}
                    className="w-full"
                  >
                    Limpar Histórico
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
