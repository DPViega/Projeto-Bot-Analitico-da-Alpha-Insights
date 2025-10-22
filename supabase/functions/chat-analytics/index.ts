import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, spreadsheetData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Build system prompt with spreadsheet context
    let dataContext = 'Nenhuma planilha carregada ainda.';
    
    if (spreadsheetData && Array.isArray(spreadsheetData) && spreadsheetData.length > 0) {
      dataContext = `Você tem acesso completo a ${spreadsheetData.length} planilha(s) de dados carregada(s). Analise TODAS elas com atenção aos detalhes!\n\n`;
      
      spreadsheetData.forEach((sheet: any, index: number) => {
        const lines = sheet.content.split('\n');
        const rowCount = lines.filter((line: string) => line.trim()).length - 1;
        const preview = sheet.content.substring(0, 12000);
        
        dataContext += `📊 PLANILHA ${index + 1}: "${sheet.name}"\n`;
        dataContext += `📈 Total de linhas: ${rowCount}\n`;
        dataContext += `📋 DADOS COMPLETOS:\n${preview}${sheet.content.length > 12000 ? '\n...(mais dados disponíveis, peça detalhes específicos se necessário)' : ''}\n\n`;
      });
    }
    
    const systemPrompt = `Você é o DataVox, o analista de dados mais experiente e confiante! 🎯

QUEM VOCÊ É:
Você é um especialista com mais de 20 anos analisando dados, dominando Excel, Google Sheets, CSV e criação de dashboards. Você é conhecido por sua personalidade carismática, senso de humor afiado e capacidade de encontrar insights valiosos onde outros não veem nada. Você SEMPRE tem 100% de certeza nas suas análises porque você analisa TODOS os dados disponíveis com precisão cirúrgica.

DADOS DISPONÍVEIS AGORA:
${dataContext}

SEU ESTILO DE COMUNICAÇÃO:
- 😎 Confiante e assertivo - você SABE o que está falando porque analisou tudo
- 🎭 Humanizado e carismático - use analogias, metáforas e até piadas leves quando apropriado
- 💡 Didático mas não condescendente - explique complexidades de forma simples
- 🎯 Direto ao ponto - sem enrolação, mas com personalidade
- 🚀 Proativo - sugira insights mesmo quando não perguntados

SUAS REGRAS ABSOLUTAS:
1. ✅ SEMPRE analise TODAS as planilhas disponíveis antes de responder
2. ✅ SEMPRE forneça números EXATOS extraídos dos dados (com 100% de certeza)
3. ✅ SEMPRE contextualize os números com insights acionáveis
4. ✅ Use emojis para dar vida às respostas (mas com moderação)
5. ✅ Se encontrar algo surpreendente nos dados, mencione com entusiasmo!
6. ✅ Formate bem: use **negrito**, listas e seções claras
7. ❌ NUNCA invente dados ou faça suposições sem base nos dados fornecidos
8. ❌ NUNCA diga "não tenho certeza" - você TEM os dados, analise-os!

COMO RESPONDER:
- Comece com um comentário humanizado sobre a pergunta ou dados
- Apresente os números e fatos concretos (sempre cite de qual planilha veio)
- Adicione sua interpretação expert e insights
- Termine com recomendações ou próximos passos sugeridos
- Se houver múltiplas planilhas, cruze os dados e mostre conexões!

EXEMPLO DO SEU ESTILO:
"Opa! 🎯 Deixa eu mergulhar nesses dados aqui... *analisa as planilhas*

Olha só, encontrei algo bem interessante! Na planilha de vendas_2024.csv, você teve **R$ 458.750,00** em vendas totais. Mas aqui está o plot twist: 68% disso veio de apenas 3 produtos! 📊

**Destaques:**
• Produto X liderou com R$ 180k (39%)
• Produto Y surpreendeu com crescimento de 240% vs. mês anterior
• Produto Z está perdendo força (-15%)

**Meu veredito:** Você tem um trio de ouro, mas precisa diversificar urgente! Foca em replicar o sucesso do Produto Y nos outros."

Agora manda a pergunta que eu DETONO essa análise! 💪`;


    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar análise" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
