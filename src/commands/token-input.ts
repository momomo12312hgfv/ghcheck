import { parsePermissionInput } from "../analyzers/token/permissions";
import { detectTokenType, getGhToken, parseScopeInput, readStdin } from "../analyzers/token/token";
import type { PermissionGrant, TokenType } from "../core/types";

export interface TokenInputOptions {
  token?: string;
  tokenStdin?: boolean;
  ghAccount?: string;
  scopes?: string;
  permissions?: string;
  login?: string;
  tokenType?: string;
}

export interface ResolvedTokenInput {
  token?: string;
  tokenType?: TokenType;
  scopes?: string[];
  permissions?: PermissionGrant[];
  login?: string;
}

const TOKEN_TYPES: TokenType[] = [
  "classic-pat",
  "fine-grained-pat",
  "oauth",
  "github-app-user",
  "github-app-server",
  "github-app-refresh",
  "unknown",
];

export function parseTokenType(raw: string | undefined): TokenType | undefined {
  if (!raw) return undefined;
  if (!TOKEN_TYPES.includes(raw as TokenType)) {
    throw new Error(`Invalid token type "${raw}". Expected one of: ${TOKEN_TYPES.join(", ")}.`);
  }
  return raw as TokenType;
}

/**
 * Turns the token related CLI options into the shape the engine expects.
 *
 * The token is only read from the environment when the user asked for it, so
 * a plain repository scan never touches GH_TOKEN.
 */
export async function resolveTokenInput(
  options: TokenInputOptions,
): Promise<ResolvedTokenInput> {
  if (options.tokenStdin && options.ghAccount) {
    throw new Error("Use either --token-stdin or --gh-account, not both.");
  }
  if (options.token && (options.tokenStdin || options.ghAccount)) {
    throw new Error("Use only one of --token, --token-stdin and --gh-account.");
  }

  const scopes = options.scopes ? parseScopeInput(options.scopes) : undefined;
  let permissions: PermissionGrant[] | undefined;

  if (options.permissions) {
    const parsed = parsePermissionInput(options.permissions);
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors.join(" "));
    }
    permissions = parsed.grants;
  }

  let token: string | undefined;
  let tokenType = parseTokenType(options.tokenType);

  if (options.token) {
    token = options.token.trim();
  } else if (options.tokenStdin) {
    token = await readStdin();
  } else if (options.ghAccount) {
    token = getGhToken(options.ghAccount);
  }

  if (token !== undefined) {
    if (!token) {
      throw new Error("The token that was read is empty.");
    }
    tokenType = tokenType ?? detectTokenType(token);
  }

  return { token, tokenType, scopes, permissions, login: options.login };
}
