import express from "express";

import { env } from "./config/env";
import { githubWebhookRouter } from "./routes/github-webhook.route";

const app = express();

app.get("/health", (_request, response) => {
  response
    .status(200)
    .json({ status: "ok", service: "github-discord-notifier" });
});

app.use("/webhooks/github", githubWebhookRouter);

app.listen(env.port, () => {
  console.log(`github-discord-notifier running on port ${env.port}`);
});
