import type { Severity } from "../../core/types";

export interface SecretRule {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  remediation: string;
  /** Global regex. Group 1 is the credential when the rule has one. */
  pattern: RegExp;
  /** Return true to drop the match as a false positive. */
  isFalsePositive?: (credential: string, line: string) => boolean;
}

const PLACEHOLDER_MARKERS = [
  "example",
  "your-",
  "your_",
  "yours",
  "placeholder",
  "changeme",
  "change_me",
  "change-me",
  "dummy",
  "sample",
  "fake",
  "xxxx",
  "todo",
  "redacted",
  "notreal",
  "insert",
  "replace",
  "somepassword",
  "some_secret",
  "mypassword",
  "hunter2",
  "abcdefgh",
  "12345678",
];

const ENVIRONMENT_MARKERS = [
  "process.env",
  "os.environ",
  "getenv(",
  "doppler",
  "vault:",
  "secrets.",
  "${{",
  "{{",
  "<%",
  "os::",
];

/** Character runs that never occur in a real credential. */
const SEQUENCES = [
  "0123456789",
  "abcdefghijklmnopqrstuvwxyz",
  "qwertyuiop",
  "asdfghjkl",
  "zyxwvutsrq",
];

function hasSequentialRun(value: string, minRun = 6): boolean {
  const lowered = value.toLowerCase();
  for (const sequence of SEQUENCES) {
    for (let index = 0; index + minRun <= sequence.length; index += 1) {
      if (lowered.includes(sequence.slice(index, index + minRun))) return true;
    }
  }
  return false;
}

export function looksLikePlaceholder(value: string): boolean {
  const lowered = value.toLowerCase();
  if (value.length < 8) return true;
  if (PLACEHOLDER_MARKERS.some((marker) => lowered.includes(marker))) return true;
  if (/(^|[^a-z])test([^a-z]|$)/i.test(value)) return true;
  if (/^([*.\-_xX#])\1+$/.test(value)) return true;
  if (/^<.*>$/.test(value)) return true;
  if (/^\$\{.*\}$/.test(value)) return true;
  if (hasSequentialRun(value)) return true;
  return false;
}

export function looksLikeEnvironmentReference(line: string): boolean {
  return ENVIRONMENT_MARKERS.some((marker) => line.includes(marker));
}

export function shannonEntropy(value: string): number {
  if (value.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const char of value) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }
  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }
  return entropy;
}

/**
 * A match is dropped when this returns true.
 *
 * Placeholders and environment references are the two big sources of noise,
 * so both are filtered before a rule ever produces a finding.
 */
function isNoise(credential: string, line: string): boolean {
  return looksLikePlaceholder(credential) || looksLikeEnvironmentReference(line);
}

export const SECRET_RULES: SecretRule[] = [
  {
    id: "secret.github-fine-grained-token",
    title: "Hardcoded fine-grained GitHub token",
    severity: "critical",
    description:
      "A fine-grained personal access token is committed in this file. Anyone who can read the repository can act as its owner until it is revoked.",
    remediation:
      "Revoke the token in GitHub Settings > Developer settings, then read it from the environment or a secret store instead.",
    pattern: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.github-token",
    title: "Hardcoded GitHub token",
    severity: "critical",
    description:
      "A classic PAT, OAuth or GitHub App token is committed in this file. Its blast radius depends on the scopes it carries.",
    remediation:
      "Revoke the token, then read it from the environment or a secret store instead.",
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.aws-access-key-id",
    title: "Hardcoded AWS access key id",
    severity: "critical",
    description:
      "An AWS access key id is committed in this file. Paired with a secret key it grants full access to the account.",
    remediation:
      "Deactivate the key in the AWS console, then read it from the environment or a secret store instead.",
    pattern: /\b(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.aws-secret-access-key",
    title: "Hardcoded AWS secret access key",
    severity: "critical",
    description:
      "An AWS secret access key is committed in this file. It is enough to sign requests as the owning IAM user.",
    remediation:
      "Rotate the key in the AWS console, then read it from the environment or a secret store instead.",
    pattern: /\baws_secret_access_key\b\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})/gi,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.private-key",
    title: "Private key committed",
    severity: "critical",
    description:
      "A private key block is committed in this file. It may grant access to a server, a code-signing identity or a certificate.",
    remediation:
      "Remove the key from the repository, rotate it, and use a secret store or an encrypted vault instead.",
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY-----/g,
  },
  {
    id: "secret.slack-token",
    title: "Hardcoded Slack token",
    severity: "high",
    description: "A Slack API token is committed in this file.",
    remediation: "Revoke the token in the Slack app admin page, then load it from the environment.",
    pattern: /\bxox[abporsu]-[A-Za-z0-9-]{10,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.slack-webhook",
    title: "Hardcoded Slack webhook URL",
    severity: "high",
    description:
      "A Slack incoming webhook URL is committed in this file. Anyone holding it can post into the channel.",
    remediation: "Recreate the webhook in the Slack app admin page, then load it from the environment.",
    pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9+/]{20,}/g,
  },
  {
    id: "secret.stripe-key",
    title: "Hardcoded Stripe secret key",
    severity: "high",
    description:
      "A Stripe live or test secret key is committed in this file. Live keys can move money and read customer data.",
    remediation: "Roll the key in the Stripe dashboard, then load it from the environment.",
    pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.anthropic-key",
    title: "Hardcoded Anthropic API key",
    severity: "high",
    description: "An Anthropic API key is committed in this file.",
    remediation: "Revoke the key in the Anthropic console, then load it from the environment.",
    pattern: /\bsk-ant-[A-Za-z0-9_-]{24,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.openai-key",
    title: "Hardcoded OpenAI API key",
    severity: "high",
    description: "An OpenAI API key is committed in this file.",
    remediation: "Revoke the key in the OpenAI dashboard, then load it from the environment.",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.google-api-key",
    title: "Hardcoded Google API key",
    severity: "high",
    description: "A Google API key is committed in this file.",
    remediation: "Delete the key in the Google Cloud console, then load it from the environment.",
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "secret.npm-token",
    title: "Hardcoded npm access token",
    severity: "high",
    description:
      "An npm access token is committed in this file. It can publish packages under your account.",
    remediation: "Revoke the token in npm settings, then load it from the environment.",
    pattern: /\bnpm_[A-Za-z0-9]{36}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.pypi-token",
    title: "Hardcoded PyPI upload token",
    severity: "high",
    description: "A PyPI API token is committed in this file. It can publish packages to your account.",
    remediation: "Revoke the token in PyPI settings, then load it from the environment.",
    pattern: /\bpypi-AgEIcHlwaS5vcmc[A-Za-z0-9_-]{50,}\b/g,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.database-url",
    title: "Hardcoded database connection string",
    severity: "high",
    description:
      "A database URL with an inline password is committed in this file. It usually points straight at production.",
    remediation: "Rotate the database password, then read the URL from the environment.",
    pattern: /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|amqp|mssql):\/\/[^\s:@/]+:[^\s:@/]+@/g,
  },
  {
    id: "secret.basic-auth-url",
    title: "Credentials embedded in a URL",
    severity: "medium",
    description:
      "A URL carries an inline user:password pair. It leaks through logs, referrers and shell history.",
    remediation: "Move the credentials into a secret store and reference them from the environment.",
    pattern: /https?:\/\/[^\s:/@]+:[^\s:/@]+@[^\s"']+/g,
  },
  {
    id: "secret.generic-credential",
    title: "Hardcoded credential assignment",
    severity: "medium",
    description:
      "A value assigned to a password, secret or token-looking name is committed in this file.",
    remediation:
      "Move the value into a secret store and read it from the environment.",
    pattern:
      /\b(?:password|passwd|pwd|secret|api[_-]?key|apikey|access[_-]?token|auth[_-]?token|client[_-]?secret|private[_-]?key)\b\s*[:=]\s*["']([^"'\s]{10,})["']/gi,
    isFalsePositive: isNoise,
  },
  {
    id: "secret.high-entropy-value",
    title: "High-entropy value assigned in source",
    severity: "low",
    description:
      "A long, high-entropy string is assigned to a variable. It is not proof of a secret, but it is the shape of one.",
    remediation: "Confirm the value is not a credential; if it is, move it into a secret store.",
    pattern:
      /\b[A-Za-z_][A-Za-z0-9_]{3,}\s*[:=]\s*["']([A-Za-z0-9+/=_\-]{32,})["']/g,
    isFalsePositive: (credential, line) => {
      if (isNoise(credential, line)) return true;
      return shannonEntropy(credential) < 4.2;
    },
  },
];
