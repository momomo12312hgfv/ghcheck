/**
 * Redaction is a core-layer guarantee, not a renderer concern. Renderers have
 * no way to leak because they never see raw credentials.
 */

const TOKEN_PREFIXES = ["github_pat_", "ghp_", "gho_", "ghu_", "ghs_", "ghr_"] as const;

export function redactTokenValue(value: string): string {
  const prefix = TOKEN_PREFIXES.find((candidate) => value.startsWith(candidate));
  if (prefix) return `${prefix}****...redacted`;
  return `****...redacted (${value.length} chars)`;
}

/** Strips a matched credential down to something safe to print. */
export function redactMatch(match: string): string {
  const trimmed = match.trim();
  const prefix = TOKEN_PREFIXES.find((candidate) => trimmed.startsWith(candidate));
  if (prefix) return `${prefix}****...redacted`;

  if (trimmed.startsWith("-----BEGIN")) {
    const kind = trimmed.split("\n")[0]?.replace("-----BEGIN ", "").replace("-----", "").trim();
    return `-----BEGIN ${kind ?? "PRIVATE KEY"}-----****...redacted`;
  }

  return `****...redacted (${trimmed.length} chars)`;
}

const GITHUB_TOKEN_PATTERN = /\b(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,})\b/g;

const AWS_SECRET_PATTERN = /\b(?:aws_secret_access_key|aws_secret_key)["'\s]*[:=]["'\s]*([A-Za-z0-9/+=]{40})\b/gi;

/**
 * Last-resort safety net. Applied to every piece of evidence before it
 * leaves an analyzer, so a rule that forgets to redact still cannot leak.
 */
export function redactSecrets(text: string): string {
  let output = text.replace(GITHUB_TOKEN_PATTERN, (match) => redactMatch(match));
  output = output.replace(AWS_SECRET_PATTERN, (match) => {
    const key = match.match(/([A-Za-z0-9/+=]{40})/)?.[1];
    return key ? match.replace(key, redactMatch(key)) : match;
  });
  return output;
}

/** Keeps the first few characters so a reader can tell what kind of value it was. */
export function maskValue(value: string): string {
  if (value.length <= 8) return "****";
  return `${value.slice(0, 4)}${"*".repeat(8)}`;
}
