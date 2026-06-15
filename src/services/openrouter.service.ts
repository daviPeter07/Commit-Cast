import { env, FREE_OPENROUTER_MODELS } from "../config/env";

type OpenRouterMessage = {
  role: "system" | "user";
  content: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function getModelFallbackList(): string[] {
  const freeModels = Array.from(FREE_OPENROUTER_MODELS);

  return [env.openRouterModel, ...freeModels.filter((model) => model !== env.openRouterModel)];
}

export async function generateNaturalSummary(context: {
  eventName: "push" | "pull_request";
  content: string;
}): Promise<string | null> {
  if (!env.openRouterApiKey) {
    return null;
  }

  const messages: OpenRouterMessage[] = [
    {
      role: "system",
      content:
        "Voce resume eventos de desenvolvimento para Discord. Responda em portugues do Brasil, em 2 ou 3 frases curtas, com linguagem natural e objetiva. Priorize explicar o que mudou no projeto, citando funcionalidades, paginas, integracoes, rotas, arquivos ou configuracoes quando isso estiver claro pelo contexto. Evite apenas repetir que alguem fez push ou abriu PR. Se o contexto for insuficiente, descreva a intencao tecnica mais provavel com cautela. Nao invente detalhes que nao estejam sustentados pelo contexto e nao use markdown complexo.",
    },
    {
      role: "user",
      content:
        `Resuma este evento do GitHub para um canal de time. ` +
        `Foque em dizer o que foi implementado, alterado ou organizado no codigo. ` +
        `Se houver nomes de arquivos, use-os para inferir melhor a mudanca. ` +
        `Evite frases vagas como \"foi feito um push\" ou \"houve alteracoes\" sem explicar o conteudo. ` +
        `Tipo do evento: ${context.eventName}.\n\n${context.content}`,
    },
  ];

  const modelsToTry = getModelFallbackList();
  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.openRouterApiKey}`,
          "Content-Type": "application/json",
          "X-OpenRouter-Title": "github-discord-notifier",
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.2,
          max_tokens: 140,
        }),
      },
    );

    if (response.ok) {
      const data = (await response.json()) as OpenRouterResponse;
      const content = data.choices?.[0]?.message?.content?.trim();

      return content || null;
    }

    const errorText = await response.text();

    if (response.status === 429 || response.status >= 500) {
      lastError = new Error(
        `OpenRouter request failed for ${model}: ${response.status} ${errorText}`,
      );
      continue;
    }

    throw new Error(`OpenRouter request failed: ${response.status} ${errorText}`);
  }

  if (lastError) {
    throw lastError;
  }

  return null;
}
