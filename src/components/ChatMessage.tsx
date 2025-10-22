import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import datavoxAvatar from "@/assets/datavox-avatar.png";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  isTyping?: boolean;
}

const ChatMessage = ({ role, content, timestamp, isTyping }: ChatMessageProps) => {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 p-4 rounded-lg animate-fade-in",
        isAssistant ? "bg-card" : "bg-muted/50"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden",
          isAssistant
            ? "bg-gradient-to-br from-primary via-secondary to-accent"
            : "bg-muted"
        )}
      >
        {isAssistant ? (
          <img src={datavoxAvatar} alt="DataVox" className="w-full h-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-foreground" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isAssistant ? "DataVox" : "Você"}
          </span>
          {timestamp && (
            <span className="text-xs text-muted-foreground">
              {timestamp.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        {isTyping ? (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="text-sm">Digitando</span>
            <span className="flex gap-1">
              <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1 h-1 bg-secondary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1 h-1 bg-accent rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
            </span>
          </div>
        ) : (
          <div className="text-sm text-foreground whitespace-pre-wrap">
            {content}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
