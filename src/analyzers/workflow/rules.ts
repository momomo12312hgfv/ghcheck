import type { Severity } from "../../core/types";

export interface UntrustedInput {
  pattern: RegExp;
  label: string;
  severity: Severity;
}

/**
 * Contexts an attacker can control and that end up inside a shell command.
 *
 * These are the sources that turn `${{ }}` into remote code execution, so
 * they are the ones worth a critical finding when they land in a `run:`.
 */
export const UNTRUSTED_INPUTS: UntrustedInput[] = [
  { pattern: /github\.event\.pull_request\.title/, label: "pull request title", severity: "critical" },
  { pattern: /github\.event\.pull_request\.body/, label: "pull request body", severity: "critical" },
  { pattern: /github\.event\.pull_request\.head\.ref/, label: "pull request head branch", severity: "critical" },
  { pattern: /github\.event\.pull_request\.head\.label/, label: "pull request head label", severity: "critical" },
  { pattern: /github\.event\.pull_request\.head\.repo\./, label: "pull request head repository", severity: "high" },
  { pattern: /github\.event\.issue\.title/, label: "issue title", severity: "critical" },
  { pattern: /github\.event\.issue\.body/, label: "issue body", severity: "critical" },
  { pattern: /github\.event\.comment\.body/, label: "comment body", severity: "critical" },
  { pattern: /github\.event\.review\.body/, label: "review body", severity: "critical" },
  { pattern: /github\.event\.review_comment\.body/, label: "review comment body", severity: "critical" },
  { pattern: /github\.event\.discussion\.(title|body)/, label: "discussion text", severity: "critical" },
  { pattern: /github\.event\.pages\..*page_name/, label: "Pages page name", severity: "high" },
  { pattern: /github\.event\.head_commit\.(message|author\.email|author\.name)/, label: "head commit text", severity: "critical" },
  { pattern: /github\.event\.commits\..*\.(message|author\.email|author\.name)/, label: "commit text", severity: "critical" },
  { pattern: /github\.event\.workflow_run\.(head_branch|head_commit\.message)/, label: "triggering workflow text", severity: "critical" },
  { pattern: /github\.head_ref/, label: "head branch name", severity: "critical" },
  { pattern: /github\.event\.inputs\./, label: "workflow input", severity: "medium" },
];

export interface DeprecatedAction {
  pattern: RegExp;
  severity: Severity;
  note: string;
}

export const DEPRECATED_ACTIONS: DeprecatedAction[] = [
  {
    pattern: /^actions\/set-output@v[12]$/,
    severity: "high",
    note: "set-output was removed by GitHub and was also a known command injection vector.",
  },
  {
    pattern: /^actions\/save-state@v[12]$/,
    severity: "high",
    note: "save-state was removed by GitHub.",
  },
  {
    pattern: /^actions\/(?:upload|download)-artifact@v[123]$/,
    severity: "medium",
    note: "artifact v1 to v3 are shut down; v4 or newer is required.",
  },
  {
    pattern: /^actions\/checkout@v[123]$/,
    severity: "medium",
    note: "checkout v1 to v3 run on end-of-life Node versions.",
  },
  {
    pattern: /^actions\/cache@v[123]$/,
    severity: "low",
    note: "cache v1 to v3 run on end-of-life Node versions.",
  },
  {
    pattern: /^actions\/setup-node@v[123]$/,
    severity: "low",
    note: "setup-node v1 to v3 run on end-of-life Node versions.",
  },
  {
    pattern: /^actions\/upload-pages-artifact@v1$/,
    severity: "medium",
    note: "upload-pages-artifact v1 is retired; v2 or newer is required.",
  },
  {
    pattern: /^github\/codeql-action@v[12]$/,
    severity: "medium",
    note: "codeql-action v1 and v2 are retired.",
  },
];

/** Triggers that run with repository secrets and a writable token. */
export const DANGEROUS_TRIGGERS: Record<string, { severity: Severity; note: string }> = {
  pull_request_target: {
    severity: "high",
    note: "Runs in the base repository context with access to secrets and a writable GITHUB_TOKEN.",
  },
  workflow_run: {
    severity: "high",
    note: "Runs after another workflow finished and inherits its secrets and a writable GITHUB_TOKEN.",
  },
  issue_comment: {
    severity: "medium",
    note: "Runs in the base repository context with access to secrets when triggered by a comment.",
  },
};
