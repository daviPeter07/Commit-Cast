import { env } from "../config/env";

type DiscordField = {
  name: string;
  value: string;
  inline?: boolean;
};

type DiscordEmbed = {
  title: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordField[];
  timestamp?: string;
};

type DiscordWebhookPayload = {
  embeds: DiscordEmbed[];
};

export async function sendDiscordWebhook(
  payload: DiscordWebhookPayload,
): Promise<void> {
  const response = await fetch(env.discordWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Discord webhook request failed: ${response.status} ${errorText}`,
    );
  }
}

export type { DiscordWebhookPayload, DiscordEmbed, DiscordField };
