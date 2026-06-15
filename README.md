# GitHub Discord Notifier

Backend simples em Node.js com TypeScript e Express para receber webhooks do GitHub e enviar notificacoes para um canal do Discord usando Discord Webhook.

## Requisitos

- Node.js 18 ou superior
- Um webhook do Discord
- Um repositorio GitHub com permissao para configurar webhooks

## Stack

- Node.js
- TypeScript
- Express
- dotenv
- crypto nativo do Node
- fetch nativo do Node

## Estrutura

```text
src/
  config/
    env.ts
  routes/
    github-webhook.route.ts
  services/
    discord.service.ts
    github-event.service.ts
  utils/
    verify-github-signature.ts
  server.ts
```

## Instalacao

```bash
npm install
```

## Variaveis de ambiente

Crie um arquivo `.env` com base no `.env.example`:

```env
PORT=3000
DISCORD_WEBHOOK_URL=
GITHUB_WEBHOOK_SECRET=
```

## Rodando localmente

Modo desenvolvimento:

```bash
npm run dev
```

Build de producao:

```bash
npm run build
npm start
```

## Endpoint disponivel

- `POST /webhooks/github`
- `GET /health`

Resposta de health check:

```json
{
  "status": "ok",
  "service": "github-discord-notifier"
}
```

## Como configurar o Discord Webhook

1. Abra o servidor do Discord.
2. Entre no canal onde quer receber notificacoes.
3. Acesse `Editar canal > Integracoes > Webhooks`.
4. Crie um novo webhook.
5. Copie a URL gerada.
6. Defina essa URL na variavel `DISCORD_WEBHOOK_URL`.

## Como configurar o GitHub Webhook

1. No repositorio GitHub, abra `Settings > Webhooks`.
2. Clique em `Add webhook`.
3. Em `Payload URL`, informe a URL publica do seu backend seguida de `/webhooks/github`.
4. Em `Content type`, escolha `application/json`.
5. Em `Secret`, informe o mesmo valor usado em `GITHUB_WEBHOOK_SECRET`.
6. Em `Which events would you like to trigger this webhook?`, selecione `Let me select individual events`.
7. Marque os eventos:
   - `Pushes`
   - `Pull requests`
8. Salve o webhook.

## Eventos suportados

### push

Envia embed com:

- nome do repositorio
- branch
- autor
- quantidade de commits
- mensagens dos commits
- link de compare ou commit

### pull_request

Suporta as acoes:

- `opened`
- `reopened`
- `synchronize`
- `closed`

Envia embed com:

- acao
- numero do PR
- titulo
- autor
- branch origem
- branch destino
- link do PR

Eventos nao suportados sao ignorados com resposta HTTP 200.

## Teste local com ngrok

1. Inicie a aplicacao localmente em `http://localhost:3000`.
2. Exponha a porta com ngrok:

```bash
ngrok http 3000
```

3. Copie a URL HTTPS gerada pelo ngrok.
4. Configure no GitHub a `Payload URL` como:

```text
https://SUA-URL.ngrok-free.app/webhooks/github
```

5. Faca um push ou abra/sincronize/feche um PR para validar o fluxo.

Se preferir, pode usar qualquer outra URL publica, como Cloudflare Tunnel ou a URL do proprio deploy.

## Deploy no Render

1. Suba o projeto para um repositorio Git.
2. No Render, crie um novo `Web Service` apontando para esse repositorio.
3. Configure:
   - Runtime: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Adicione as variaveis de ambiente:
   - `PORT` = `3000`
   - `DISCORD_WEBHOOK_URL` = sua URL do webhook do Discord
   - `GITHUB_WEBHOOK_SECRET` = seu segredo do webhook GitHub
5. Conclua o deploy.
6. Use a URL publica gerada pelo Render para cadastrar o webhook do GitHub.

## Observacoes

- O projeto nao usa banco de dados.
- O projeto nao usa ORM.
- O projeto nao usa fila.
- O projeto nao usa bot do Discord.
- Os segredos ficam somente em variaveis de ambiente.
