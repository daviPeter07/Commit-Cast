import path from 'path';

import express from 'express';

import { env } from './config/env';
import { githubWebhookRouter } from './routes/github-webhook.route';

const app = express();
const publicDir = path.resolve(process.cwd(), 'public');

app.use(express.static(publicDir));

app.get('/health', (_request, response) => {
  response
    .status(200)
    .json({ status: 'ok', service: 'github-discord-notifier' });
});

app.get('/', (_request, response) => {
  response.sendFile(path.join(publicDir, 'index.html'));
});

app.use('/webhooks/github', githubWebhookRouter);

app.listen(env.port, () => {
  console.log(`github-discord-notifier running on port ${env.port}`);
});
