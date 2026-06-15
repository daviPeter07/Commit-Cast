import express, { type Request, type Response } from "express";

import { env } from "../config/env";
import { sendDiscordWebhook } from "../services/discord.service";
import { buildDiscordPayloadFromGitHubEvent } from "../services/github-event.service";
import { verifyGitHubSignature } from "../utils/verify-github-signature";

const githubWebhookRouter = express.Router();

githubWebhookRouter.post(
  "/",
  express.raw({ type: "application/json" }),
  async (request: Request, response: Response) => {
    try {
      const signatureHeader = request.header("x-hub-signature-256");
      const eventName = request.header("x-github-event");
      const rawBody = request.body as Buffer;

      if (!Buffer.isBuffer(rawBody)) {
        return response.status(400).json({ error: "Invalid request body." });
      }

      const isValidSignature = verifyGitHubSignature(
        rawBody,
        signatureHeader,
        env.githubWebhookSecret,
      );

      if (!isValidSignature) {
        return response
          .status(401)
          .json({ error: "Invalid GitHub signature." });
      }

      if (!eventName) {
        return response
          .status(400)
          .json({ error: "Missing x-github-event header." });
      }

      const payload = JSON.parse(rawBody.toString("utf8"));
      const discordPayload = await buildDiscordPayloadFromGitHubEvent(
        eventName,
        payload,
      );

      if (!discordPayload) {
        return response
          .status(200)
          .json({ message: `Ignored event: ${eventName}` });
      }

      await sendDiscordWebhook(discordPayload);

      return response
        .status(200)
        .json({ message: "Webhook processed successfully." });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return response.status(400).json({ error: "Invalid JSON payload." });
      }

      console.error("Failed to process GitHub webhook:", error);
      return response.status(500).json({ error: "Internal server error." });
    }
  },
);

export { githubWebhookRouter };
