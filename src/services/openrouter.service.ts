import { env } from "../config/env";

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
        "Voce resume eventos de desenvolvimento para Discord. Responda em portugues do Brasil, em 2 ou 3 frases curtas, com linguagem objetiva. Nao invente informacoes e nao use markdown complexo.",
    },
    {
      role: "user",
      content: `Resuma este evento do GitHub de forma natural para um canal de time. Tipo do evento: ${context.eventName}.\n\n${context.content}`,
    },
  ];

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
        model: env.openRouterModel,
        messages,
        temperature: 0.2,
        max_tokens: 140,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter request failed: ${response.status} ${errorText}`,
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  return content || null;
}
