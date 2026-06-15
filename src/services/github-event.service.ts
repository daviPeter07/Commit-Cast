import type { DiscordWebhookPayload } from "./discord.service";

type GitHubEventName = "push" | "pull_request";

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

const SUPPORTED_PR_ACTIONS = new Set([
  "opened",
  "reopened",
  "synchronize",
  "closed",
]);

export function buildDiscordPayloadFromGitHubEvent(
  eventName: string,
  payload: unknown,
): DiscordWebhookPayload | null {
  if (eventName === "push") {
    return buildPushPayload(payload as PushEventPayload);
  }

  if (eventName === "pull_request") {
    return buildPullRequestPayload(payload as PullRequestEventPayload);
  }

  return null;
}

function buildPushPayload(payload: PushEventPayload): DiscordWebhookPayload {
  const branch = payload.ref.replace("refs/heads/", "");
  const commits = payload.commits ?? [];
  const author = payload.pusher?.name || commits[0]?.author?.name || "Unknown";
  const commitLines = commits.length
    ? commits
        .slice(0, 10)
        .map((commit) => {
          const shortSha = commit.id.slice(0, 7);
          const firstLine = commit.message.split("\n")[0];
          return `- [\`${shortSha}\`](${commit.url}) ${truncate(firstLine, 180)}`;
        })
        .join("\n")
    : "No commit messages available.";

  const extraCommits =
    commits.length > 10
      ? `\n...and ${commits.length - 10} more commit(s).`
      : "";
  const compareUrl =
    payload.compare || payload.head_commit?.url || payload.repository.html_url;

  return {
    embeds: [
      {
        title: `Push em ${payload.repository.full_name}`,
        description: `${commits.length} commit(s) enviados para \`${branch}\`.`,
        url: compareUrl,
        color: 0x2ea043,
        fields: [
          {
            name: "Repositorio",
            value: payload.repository.full_name,
            inline: true,
          },
          { name: "Branch", value: branch, inline: true },
          { name: "Autor", value: author, inline: true },
          {
            name: "Quantidade de commits",
            value: String(commits.length),
            inline: true,
          },
          { name: "Compare", value: compareUrl, inline: false },
          {
            name: "Commits",
            value: truncate(`${commitLines}${extraCommits}`, 1024),
            inline: false,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function buildPullRequestPayload(
  payload: PullRequestEventPayload,
): DiscordWebhookPayload | null {
  if (!SUPPORTED_PR_ACTIONS.has(payload.action)) {
    return null;
  }

  const pr = payload.pull_request;
  const isMerged = payload.action === "closed" && pr.merged;
  const actionLabel = isMerged ? "merged" : payload.action;

  return {
    embeds: [
      {
        title: `Pull Request ${actionLabel} em ${payload.repository.full_name}`,
        description: `PR #${pr.number}: ${pr.title}`,
        url: pr.html_url,
        color: getPullRequestColor(payload.action, Boolean(pr.merged)),
        fields: [
          { name: "Acao", value: actionLabel, inline: true },
          { name: "Numero", value: `#${pr.number}`, inline: true },
          { name: "Autor", value: pr.user.login, inline: true },
          { name: "Branch origem", value: pr.head.ref, inline: true },
          { name: "Branch destino", value: pr.base.ref, inline: true },
          { name: "Link", value: pr.html_url, inline: false },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

function getPullRequestColor(action: string, merged: boolean): number {
  if (merged) {
    return 0x8250df;
  }

  if (action === "closed") {
    return 0xcf222e;
  }

  if (action === "synchronize") {
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

export type { GitHubEventName };
