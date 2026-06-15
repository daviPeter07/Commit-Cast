import type { DiscordWebhookPayload } from './discord.service';

import { generateNaturalSummary } from './openrouter.service';

type GitHubEventName = 'push' | 'pull_request';

type PushEventPayload = {
  ref: string;
  compare: string;
  head_commit?: {
    url?: string;
  };
  repository: {
    full_name: string;
    html_url: string;
  };
  pusher: {
    name: string;
  };
  commits: Array<{
    id: string;
    message: string;
    url: string;
    author: {
      name: string;
    };
    added?: string[];
    removed?: string[];
    modified?: string[];
  }>;
};

type PullRequestEventPayload = {
  action: string;
  repository: {
    full_name: string;
    html_url: string;
  };
  pull_request: {
    number: number;
    title: string;
    body?: string | null;
    html_url: string;
    user: {
      login: string;
    };
    head: {
      ref: string;
    };
    base: {
      ref: string;
    };
    merged?: boolean;
  };
};

const SUPPORTED_PR_ACTIONS = new Set(['opened', 'reopened', 'synchronize', 'closed']);

export async function buildDiscordPayloadFromGitHubEvent(
  eventName: string,
  payload: unknown
): Promise<DiscordWebhookPayload | null> {
  if (eventName === 'push') {
    return buildPushPayload(payload as PushEventPayload);
  }

  if (eventName === 'pull_request') {
    return buildPullRequestPayload(payload as PullRequestEventPayload);
  }

  return null;
}

async function buildPushPayload(payload: PushEventPayload): Promise<DiscordWebhookPayload> {
  const branch = payload.ref.replace('refs/heads/', '');
  const commits = payload.commits ?? [];
  const author = payload.pusher?.name || commits[0]?.author?.name || 'Unknown';
  const changedFiles = summarizePushFiles(commits);
  const changedFileList = listChangedFiles(commits);
  const commitLines = commits.length
    ? commits
        .slice(0, 10)
        .map((commit) => {
          const shortSha = commit.id.slice(0, 7);
          const firstLine = commit.message.split('\n')[0];
          return `- [\`${shortSha}\`](${commit.url}) ${truncate(firstLine, 180)}`;
        })
        .join('\n')
    : 'No commit messages available.';

  const extraCommits = commits.length > 10 ? `\n...and ${commits.length - 10} more commit(s).` : '';
  const compareUrl = payload.compare || payload.head_commit?.url || payload.repository.html_url;
  const aiSummary = await safeGenerateSummary(
    'push',
    buildPushSummaryPrompt(payload, branch, author, changedFiles, changedFileList)
  );
  const fields = [
    { name: 'Repositorio', value: payload.repository.full_name, inline: true },
    { name: 'Branch', value: branch, inline: true },
    { name: 'Autor', value: author, inline: true },
    { name: 'Quantidade de commits', value: String(commits.length), inline: true },
    { name: 'Arquivos alterados', value: changedFiles, inline: true },
    { name: 'Compare', value: compareUrl, inline: false },
    { name: 'Commits', value: truncate(`${commitLines}${extraCommits}`, 1024), inline: false }
  ];

  if (aiSummary) {
    fields.splice(5, 0, { name: 'Resumo', value: truncate(aiSummary, 1024), inline: false });
  }

  return {
    embeds: [
      {
        title: `Push em ${payload.repository.full_name}`,
        description: `${commits.length} commit(s) enviados para \`${branch}\`.`,
        url: compareUrl,
        color: 0x2ea043,
        fields,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

async function buildPullRequestPayload(
  payload: PullRequestEventPayload
): Promise<DiscordWebhookPayload | null> {
  if (!SUPPORTED_PR_ACTIONS.has(payload.action)) {
    return null;
  }

  const pr = payload.pull_request;
  const isMerged = payload.action === 'closed' && pr.merged;
  const actionLabel = isMerged ? 'merged' : payload.action;
  const aiSummary = await safeGenerateSummary(
    'pull_request',
    buildPullRequestSummaryPrompt(payload, actionLabel)
  );
  const fields = [
    { name: 'Acao', value: actionLabel, inline: true },
    { name: 'Numero', value: `#${pr.number}`, inline: true },
    { name: 'Autor', value: pr.user.login, inline: true },
    { name: 'Branch origem', value: pr.head.ref, inline: true },
    { name: 'Branch destino', value: pr.base.ref, inline: true },
    { name: 'Link', value: pr.html_url, inline: false }
  ];

  if (aiSummary) {
    fields.splice(5, 0, { name: 'Resumo', value: truncate(aiSummary, 1024), inline: false });
  }

  return {
    embeds: [
      {
        title: `Pull Request ${actionLabel} em ${payload.repository.full_name}`,
        description: `PR #${pr.number}: ${pr.title}`,
        url: pr.html_url,
        color: getPullRequestColor(payload.action, Boolean(pr.merged)),
        fields,
        timestamp: new Date().toISOString()
      }
    ]
  };
}

function getPullRequestColor(action: string, merged: boolean): number {
  if (merged) {
    return 0x8250df;
  }

  if (action === 'closed') {
    return 0xcf222e;
  }

  if (action === 'synchronize') {
    return 0xfb8500;
  }

  return 0x1f6feb;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function summarizePushFiles(commits: PushEventPayload['commits']): string {
  const added = new Set<string>();
  const removed = new Set<string>();
  const modified = new Set<string>();

  for (const commit of commits) {
    for (const file of commit.added ?? []) {
      added.add(file);
    }

    for (const file of commit.removed ?? []) {
      removed.add(file);
    }

    for (const file of commit.modified ?? []) {
      modified.add(file);
    }
  }

  return `${added.size} added, ${modified.size} modified, ${removed.size} removed`;
}

function buildPushSummaryPrompt(
  payload: PushEventPayload,
  branch: string,
  author: string,
  changedFiles: string,
  changedFileList: string
): string {
  const commitMessages = (payload.commits ?? [])
    .slice(0, 10)
    .map((commit, index) => `${index + 1}. ${commit.message.split('\n')[0]}`)
    .join('\n');

  return [
    `Repositorio: ${payload.repository.full_name}`,
    `Branch: ${branch}`,
    `Autor: ${author}`,
    `Quantidade de commits: ${payload.commits.length}`,
    `Arquivos alterados: ${changedFiles}`,
    'Arquivos envolvidos:',
    changedFileList,
    'Mensagens dos commits:',
    commitMessages || 'Nenhuma mensagem disponivel.'
  ].join('\n');
}

function listChangedFiles(commits: PushEventPayload['commits']): string {
  const added = new Set<string>();
  const modified = new Set<string>();
  const removed = new Set<string>();

  for (const commit of commits) {
    for (const file of commit.added ?? []) {
      added.add(`added: ${file}`);
    }

    for (const file of commit.modified ?? []) {
      modified.add(`modified: ${file}`);
    }

    for (const file of commit.removed ?? []) {
      removed.add(`removed: ${file}`);
    }
  }

  const lines = [...added, ...modified, ...removed].slice(0, 20);

  if (lines.length === 0) {
    return 'Nenhum arquivo listado no payload.';
  }

  return lines.join('\n');
}

function buildPullRequestSummaryPrompt(
  payload: PullRequestEventPayload,
  actionLabel: string
): string {
  const pr = payload.pull_request;

  return [
    `Repositorio: ${payload.repository.full_name}`,
    `Acao: ${actionLabel}`,
    `Numero do PR: ${pr.number}`,
    `Titulo: ${pr.title}`,
    `Autor: ${pr.user.login}`,
    `Branch origem: ${pr.head.ref}`,
    `Branch destino: ${pr.base.ref}`,
    `Descricao do PR: ${pr.body || 'Sem descricao.'}`
  ].join('\n');
}

async function safeGenerateSummary(
  eventName: 'push' | 'pull_request',
  content: string
): Promise<string | null> {
  try {
    return await generateNaturalSummary({ eventName, content });
  } catch (error) {
    console.warn('Failed to generate AI summary:', error);
    return null;
  }
}

export type { GitHubEventName };
