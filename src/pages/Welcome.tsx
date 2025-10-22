import { ArrowRight, Sparkles, TrendingUp, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import alphaLogo from "@/assets/alpha-insights-logo-new.png";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="text-center space-y-10 px-4 relative z-10 animate-fade-in">
        {/* Logo with glow effect */}
        <div className="flex justify-center mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-2xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
            <img 
              src={alphaLogo} 
              alt="Alpha Insights" 
              className="h-40 w-40 relative z-10 drop-shadow-2xl transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
            />
          </div>
        </div>
        
        {/* Title with gradient */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-fade-in">
              Alpha Insights
            </span>
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-xl animate-fade-in">
            <Brain className="h-5 w-5 text-primary animate-pulse" />
            <p>Inteligência Analítica Avançada</p>
            <TrendingUp className="h-5 w-5 text-accent animate-pulse" />
          </div>
        </div>

        {/* Features cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto my-8 animate-fade-in">
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Análise Inteligente</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-secondary/50 transition-all hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-1">
            <TrendingUp className="h-8 w-8 text-secondary mx-auto mb-2" />
            <p className="text-sm font-medium">Insights Precisos</p>
          </div>
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4 hover:border-accent/50 transition-all hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-1">
            <Brain className="h-8 w-8 text-accent mx-auto mb-2" />
            <p className="text-sm font-medium">DataVox AI</p>
          </div>
        </div>

        {/* CTA Button with enhanced effects */}
        <div className="relative inline-block animate-fade-in">
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse" />
          <Button
            onClick={() => navigate("/chat")}
            className="relative bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-all text-white px-10 py-7 text-lg font-semibold shadow-2xl hover:shadow-primary/50 hover:scale-105 transform duration-300"
            size="lg"
          >
            Acessar Painel
            <ArrowRight className="ml-2 h-6 w-6 animate-pulse" />
          </Button>
        </div>

        <p className="text-muted-foreground text-sm mt-8 animate-fade-in flex items-center justify-center gap-2">
          <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse" />
          Análise de dados com tecnologia de ponta
          <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse" />
        </p>
      </div>
    </div>
  );
}
