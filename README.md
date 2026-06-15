# GitHub Discord Notifier

Backend simples em Node.js com TypeScript e Express para receber webhooks do GitHub e enviar notificacoes para um canal do Discord usando Discord Webhook.

## Requisitos

- Node.js 18 ou superior
- Um webhook do Discord
- Um repositorio GitHub com permissao para configurar webhooks
- Chave do OpenRouter, se quiser resumo natural por IA

## Stack

- Node.js
- TypeScript
- Express
- dotenv
- crypto nativo do Node
- fetch nativo do Node

## Estrutura

```text
public/
  index.html
  styles.css
  app.js
  favicon.svg

src/
  config/
    env.ts
  routes/
    github-webhook.route.ts
  services/
    discord.service.ts
    github-event.service.ts
    openrouter.service.ts
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
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-3.1-flash-lite
```

### Onde colocar a chave do OpenRouter

Coloque a chave no arquivo `.env`, neste campo:

```env
OPENROUTER_API_KEY=sk-or-v1-...
```

Exemplo completo:

```env
PORT=3000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
GITHUB_WEBHOOK_SECRET=meu-segredo
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_MODEL=google/gemini-3.1-flash-lite
```

Se `OPENROUTER_API_KEY` nao for definido, o projeto continua funcionando normalmente, apenas sem resumo por IA.

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

- `GET /`
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
7. Marque `Pushes`.
8. Marque `Pull requests`.
9. Salve o webhook.

## Eventos suportados

### push

Envia embed com:

- nome do repositorio
- branch
- autor
- quantidade de commits
- mensagens dos commits
- link de compare ou commit
- resumo natural por IA, quando configurado

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
- resumo natural por IA, quando configurado

Eventos nao suportados sao ignorados com resposta HTTP 200.

## Resumo natural com IA

Quando `OPENROUTER_API_KEY` estiver definido, o backend chama a API do OpenRouter em:

```text
POST https://openrouter.ai/api/v1/chat/completions
```

Usando `fetch` nativo e um modelo configuravel em `OPENROUTER_MODEL`.

Se a chamada da IA falhar, o webhook nao quebra. A notificacao continua sendo enviada ao Discord sem o campo de resumo.

### Modelo padrao configurado

- `google/gemini-3.1-flash-lite`

Esse modelo foi escolhido por ser leve e adequado para resumos curtos.

### Modelos que apareceram disponiveis na listagem atual do OpenRouter

- `google/gemini-3.1-flash-lite`
- `google/gemini-3.5-flash`
- `qwen/qwen3.6-flash`
- `qwen/qwen3.7-plus`
- `ibm-granite/granite-4.1-8b`
- `~openai/gpt-mini-latest`
- `~google/gemini-flash-latest`
- `~anthropic/claude-haiku-latest`

Voce pode trocar o modelo alterando apenas `OPENROUTER_MODEL` no `.env`.

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
3. Configure `Runtime` como `Node`.
4. Configure `Build Command` como `npm install && npm run build`.
5. Configure `Start Command` como `npm start`.
6. Adicione `PORT=3000`.
7. Adicione `DISCORD_WEBHOOK_URL` com sua URL do webhook do Discord.
8. Adicione `GITHUB_WEBHOOK_SECRET` com seu segredo do webhook GitHub.
9. Adicione `OPENROUTER_API_KEY` com sua chave do OpenRouter, se quiser resumo IA.
10. Adicione `OPENROUTER_MODEL` com o modelo do OpenRouter, opcional.
11. Conclua o deploy.
12. Use a URL publica gerada pelo Render para cadastrar o webhook do GitHub.

## Observacoes

- O projeto nao usa banco de dados.
- O projeto nao usa ORM.
- O projeto nao usa fila.
- O projeto nao usa bot do Discord.
- Os segredos ficam somente em variaveis de ambiente.
