import { mergeCapabilities, resolveCapabilities, resolveCapabilitiesFromPermissions } from "./capabilities";
import { GitHubClient } from "./github";
import { PERMISSION_DEFINITIONS } from "./permissions";
import { SCOPE_DEFINITIONS } from "./scopes";
import { capabilitiesToFindings } from "./capability-findings";
import { detectTokenType, normalizeScopes, redactToken, tokenTypeLabel } from "./token";
import type { Finding, PermissionGrant, RepositoryContext, TokenType } from "../../core/types";

export interface TokenScanResult {
  findings: Finding[];
  warnings: string[];
  identity: { login: string } | null;
  tokenType: TokenType;
  tokenTypeLabel: string;
  scopes: string[];
  permissions: PermissionGrant[];
  scoreKnown: boolean;
  redacted: string;
}

function splitGrants(grants: PermissionGrant[]): { valid: PermissionGrant[]; unknown: PermissionGrant[] } {
  const valid: PermissionGrant[] = [];
  const unknown: PermissionGrant[] = [];
  for (const grant of grants) {
    if (PERMISSION_DEFINITIONS[grant.permission]) valid.push(grant);
    else unknown.push(grant);
  }
  return { valid, unknown };
}

/**
 * Works out what a token can do and turns it into findings.
 *
 * Classic OAuth scopes come from the API response headers. Fine-grained
 * permissions are not exposed by GitHub at all, so they are self-reported and
 * every report says so.
 */
export async function scanTokenContext(context: RepositoryContext): Promise<TokenScanResult> {
  const warnings: string[] = [];
  let identity: { login: string } | null = null;
  let apiScopes: string[] = [];
  let tokenType: TokenType = context.tokenType ?? "unknown";

  if (context.token) {
    const token = context.token.trim();
    tokenType = context.tokenType ?? detectTokenType(token);

    if (tokenType === "github-app-refresh") {
      throw new Error(
        "Refresh tokens cannot be scanned. Use the corresponding access token instead.",
      );
    }

    const client = new GitHubClient(token);
    const user = await client.getUser();

    if (user.status === 401) {
      throw new Error("GitHub rejected the token (401). It may be expired, revoked or mistyped.");
    }

    if (!user.ok) {
      throw new Error(user.error ?? "GitHub rejected the token.");
    }

    identity = { login: user.data?.login ?? context.login ?? "unknown" };
    apiScopes = normalizeScopes(user.headers.get("x-oauth-scopes"));

    if (tokenType === "fine-grained-pat") {
      apiScopes = [];
      warnings.push(
        "Fine-grained PAT permissions are not exposed by the GitHub API. Use --permissions to provide them; without them the score is marked unknown.",
      );
    } else if (apiScopes.length === 0) {
      warnings.push(
        "GitHub returned no OAuth scopes. The token may have no scopes, or this may be a fine-grained or app token.",
      );
    }
  }

  const suppliedScopes = context.scopes ?? [];
  const scopes = [...new Set([...apiScopes, ...suppliedScopes])].sort();

  if (suppliedScopes.length > 0 && context.token) {
    warnings.push(
      `Additional scopes were supplied with --scopes: ${suppliedScopes.join(", ")}. The report combines them with the scopes GitHub returned.`,
    );
  }

  const { valid: permissions, unknown: unknownPermissions } = splitGrants(context.permissions ?? []);

  if (unknownPermissions.length > 0) {
    warnings.push(
      `Unknown permissions were ignored: ${unknownPermissions
        .map((grant) => `${grant.permission}=${grant.access}`)
        .join(", ")}.`,
    );
  }

  const unknownScopes = scopes.filter((scope) => !SCOPE_DEFINITIONS[scope]);
  if (unknownScopes.length > 0) {
    warnings.push(`Unknown scopes were ignored: ${unknownScopes.join(", ")}.`);
  }

  if (tokenType === "fine-grained-pat" && permissions.length > 0) {
    warnings.push(
      "Fine-grained PAT permissions are self-reported via --permissions and cannot be verified through the GitHub API.",
    );
  }

  const capabilities = mergeCapabilities(
    resolveCapabilities(scopes),
    resolveCapabilitiesFromPermissions(permissions),
  );

  const scoreKnown =
    scopes.length > 0 || permissions.length > 0;

  if (!scoreKnown) {
    warnings.push(
      "No scopes or permissions were available, so no capability could be evaluated. Use --scopes or --permissions to describe the token.",
    );
  }

  return {
    findings: capabilitiesToFindings(capabilities),
    warnings,
    identity,
    tokenType,
    tokenTypeLabel: tokenTypeLabel(tokenType),
    scopes,
    permissions,
    scoreKnown,
    redacted: context.token ? redactToken(context.token) : "(not provided)",
  };
}
