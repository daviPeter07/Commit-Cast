import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  discordWebhookUrl: getRequiredEnv("DISCORD_WEBHOOK_URL"),
  githubWebhookSecret: getRequiredEnv("GITHUB_WEBHOOK_SECRET"),
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel:
    process.env.OPENROUTER_MODEL || "google/gemini-3.1-flash-lite",
};
