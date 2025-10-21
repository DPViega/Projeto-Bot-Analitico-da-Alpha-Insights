import { TrendingUp, PieChart, BarChart3, Target } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onActionClick: (action: string) => void;
  disabled?: boolean;
}

export default function QuickActions({ onActionClick, disabled }: QuickActionsProps) {
  const actions = [
    {
      icon: TrendingUp,
      label: "Análise de Tendências",
      prompt: "Analisa as tendências dos dados de todas as planilhas e me mostra os insights mais importantes! Quero números exatos e recomendações.",
    },
    {
      icon: PieChart,
      label: "Top Produtos",
      prompt: "Me mostra quais são os produtos/itens que mais se destacam em todas as planilhas. Quero ver os campeões! 🏆",
    },
    {
      icon: BarChart3,
      label: "Comparativo",
      prompt: "Faz um comparativo detalhado entre os dados das planilhas. Quero ver diferenças, semelhanças e o que mais se destaca!",
    },
    {
      icon: Target,
      label: "Metas",
      prompt: "Analisa o desempenho geral dos dados e me dá insights sobre metas e objetivos. Como estamos indo?",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Button
          key={action.label}
          variant="outline"
          onClick={() => onActionClick(action.prompt)}
          disabled={disabled}
          className="flex flex-col items-center gap-2 h-auto py-4 hover:bg-primary/10 hover:border-primary/20 transition-colors"
        >
          <action.icon className="h-6 w-6" />
          <span className="text-sm font-medium">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}
