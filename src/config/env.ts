import dotenv from "dotenv";

dotenv.config();

const FREE_OPENROUTER_MODELS = new Set([
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "nousresearch/hermes-3-llama-3.1-405b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "nvidia/nemotron-nano-9b-v2:free",
  "meta-llama/llama-3.2-3b-instruct:free",
]);

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseCsvEnv(name: string): string[] {
  const value = process.env[name];

  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getOpenRouterFreeModel(): string {
  const model =
    process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b:free";

  if (!FREE_OPENROUTER_MODELS.has(model)) {
    throw new Error(
      `OPENROUTER_MODEL must be one of the approved free models. Received: ${model}`,
    );
  }

  return model;
}

export const env = {
  port: Number(process.env.PORT || 3000),
  discordWebhookUrl: getRequiredEnv("DISCORD_WEBHOOK_URL"),
  githubWebhookSecret: getRequiredEnv("GITHUB_WEBHOOK_SECRET"),
  githubAllowedOrg: process.env.GITHUB_ALLOWED_ORG?.trim().toLowerCase(),
  allowedRepos: new Set(
    parseCsvEnv("ALLOWED_REPOS").map((repo) => repo.toLowerCase()),
  ),
  openRouterApiKey: process.env.OPENROUTER_API_KEY,
  openRouterModel: getOpenRouterFreeModel(),
};

export { FREE_OPENROUTER_MODELS };
