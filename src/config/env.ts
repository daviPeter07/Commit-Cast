import dotenv from 'dotenv';

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
  discordWebhookUrl: getRequiredEnv('DISCORD_WEBHOOK_URL'),
  githubWebhookSecret: getRequiredEnv('GITHUB_WEBHOOK_SECRET')
};
