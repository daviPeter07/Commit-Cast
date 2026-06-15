type GitHubWebhookPayload = {
  repository?: {
    full_name?: string;
  };
  organization?: {
    login?: string;
  };
};

type AllowDecision = {
  allowed: boolean;
  reason?: string;
};

export function isAllowedGitHubWebhookPayload(
  payload: unknown,
  allowedOrg: string | undefined,
  allowedRepos: Set<string>,
): AllowDecision {
  if (!allowedOrg && allowedRepos.size === 0) {
    return { allowed: true };
  }

  const parsedPayload = payload as GitHubWebhookPayload;
  const repositoryFullName = parsedPayload.repository?.full_name?.toLowerCase();
  const repositoryOwner = repositoryFullName?.split("/")[0];
  const organizationLogin = parsedPayload.organization?.login?.toLowerCase();

  if (allowedOrg) {
    const payloadOrg = organizationLogin || repositoryOwner;

    if (!payloadOrg || payloadOrg !== allowedOrg) {
      return {
        allowed: false,
        reason: `Ignored event outside allowed organization: ${payloadOrg || "unknown"}`,
      };
    }
  }

  if (allowedRepos.size > 0) {
    if (!repositoryFullName) {
      return {
        allowed: false,
        reason: "Ignored event without repository context.",
      };
    }

    if (!allowedRepos.has(repositoryFullName)) {
      return {
        allowed: false,
        reason: `Ignored repository: ${repositoryFullName}`,
      };
    }
  }

  return { allowed: true };
}
