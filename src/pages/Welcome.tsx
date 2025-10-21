import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import alphaLogo from "@/assets/alpha-insights-logo.png";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-8 px-4">
        <div className="flex justify-center mb-8">
          <img 
            src={alphaLogo} 
            alt="Alpha Insights" 
            className="h-32 w-32 animate-pulse"
          />
        </div>
        
        <div>
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
              Alpha
            </span>{" "}
            <span className="bg-gradient-to-r from-[#8B5CF6] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
              Insights
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Inteligência Analítica Avançada
          </p>
        </div>

        <Button
          onClick={() => navigate("/chat")}
          className="bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#EC4899] hover:opacity-90 transition-opacity text-white px-8 py-6 text-lg"
          size="lg"
        >
          Acessar Painel
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <p className="text-muted-foreground text-sm mt-8">
          Análise de dados com tecnologia de ponta
        </p>
      </div>
    </div>
  );
}
