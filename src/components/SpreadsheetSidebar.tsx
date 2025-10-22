import { FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SpreadsheetFile {
  id: string;
  name: string;
  rowCount: number;
}

interface SpreadsheetSidebarProps {
  spreadsheets: SpreadsheetFile[];
  onRemove: (id: string) => void;
}

export default function SpreadsheetSidebar({ spreadsheets, onRemove }: SpreadsheetSidebarProps) {
  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-sidebar-primary" />
          Planilhas
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {spreadsheets.length} {spreadsheets.length === 1 ? 'planilha carregada' : 'planilhas carregadas'}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {spreadsheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Nenhuma planilha carregada
            </div>
          ) : (
            spreadsheets.map((file) => (
              <div
                key={file.id}
                className="bg-sidebar-accent rounded-lg p-3 group hover:bg-sidebar-accent/80 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {file.rowCount} linhas
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
