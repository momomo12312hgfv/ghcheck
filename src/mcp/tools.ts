import { ANALYZER_LIST, isAnalyzerId } from "../analyzers";
import { parsePermissionInput } from "../analyzers/token/permissions";
import { detectTokenType, getGhToken } from "../analyzers/token/token";
import { parseScopeInput } from "../analyzers/token/token";
import { severityAtLeast, isSeverity } from "../core/severity";
import type { AnalyzerId, Finding, PermissionGrant, Report, Severity } from "../core/types";
import { runScan } from "../engine/run";

/**
 * The tools the MCP server exposes.
 *
 * Every tool returns the same thing: a small JSON document. An agent pays
 * for every token it reads, so the shape is deliberately narrow. A finding is
 * an id, a severity, a place and a fix, not a paragraph.
 */

export interface ToolFinding {
  id: string;
  severity: Severity;
  confidence?: string;
  title: string;
  file?: string;
  line?: number;
  remediation: string;
}

export interface ScanToolResult {
  score: number;
  level: Severity;
  summary: Record<string, number>;
  findings: ToolFinding[];
}

export interface RuleToolResult {
  id: string;
  analyzer: string;
  severity: Severity;
  confidence?: string;
  title: string;
  description: string;
  remediation: string;
}

export interface BlastRadiusResult {
  identity: string | null;
  type: string;
  redacted: string;
  scopes: string[];
  permissions: Array<{ permission: string; access: string }>;
  scoreKnown: boolean;
  findings: ToolFinding[];
  warnings: string[];
}

function toToolFinding(finding: Finding): ToolFinding {
  const entry: ToolFinding = {
    id: finding.id,
    severity: finding.severity,
    title: finding.title,
    remediation: finding.remediation,
  };
  if (finding.confidence) entry.confidence = finding.confidence;
  if (finding.location) {
    entry.file = finding.location.file;
    entry.line = finding.location.line;
  }
  return entry;
}

function toSummary(report: Report): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const [analyzer, bucket] of Object.entries(report.summary)) {
    if (bucket.total > 0) summary[analyzer] = bucket.total;
  }
  return summary;
}

export interface ScanToolInput {
  path?: string;
  analyzers?: string[];
  /** Only findings at or above this severity are returned. */
  severity?: string;
}

export async function scanRepository(input: ScanToolInput): Promise<ScanToolResult> {
  const analyzers: AnalyzerId[] = [];

  for (const raw of input.analyzers ?? []) {
    for (const part of raw.split(/[\s,]+/)) {
      const id = part.trim();
      if (!id) continue;
      if (!isAnalyzerId(id)) {
        throw new Error(
          `Unknown analyzer "${id}". Expected one of: ${ANALYZER_LIST.map((a) => a.id).join(", ")}.`,
        );
      }
      analyzers.push(id);
    }
  }

  const report = await runScan({
    root: input.path ?? ".",
    analyzers: analyzers.length > 0 ? analyzers : undefined,
  });

  const threshold = input.severity && isSeverity(input.severity) ? input.severity : undefined;
  const findings = report.findings
    .filter((finding) => !threshold || severityAtLeast(finding.severity, threshold))
    .map(toToolFinding);

  return {
    score: report.score.value,
    level: report.score.level,
    summary: toSummary(report),
    findings,
  };
}

export function listRules(input: { analyzer?: string; severity?: string }): RuleToolResult[] {
  const rules: RuleToolResult[] = [];

  for (const analyzer of ANALYZER_LIST) {
    if (input.analyzer && analyzer.id !== input.analyzer) continue;

    for (const rule of analyzer.rules) {
      if (input.severity && rule.severity !== input.severity) continue;

      const entry: RuleToolResult = {
        id: rule.id,
        analyzer: analyzer.id,
        severity: rule.severity,
        title: rule.title,
        description: rule.description,
        remediation: rule.remediation,
      };
      if (rule.confidence) entry.confidence = rule.confidence;
      rules.push(entry);
    }
  }

  return rules;
}

export function explainRule(ruleId: string): RuleToolResult {
  const normalized = ruleId.trim().toLowerCase();

  for (const analyzer of ANALYZER_LIST) {
    const rule = analyzer.rules.find((candidate) => candidate.id === normalized);
    if (!rule) continue;

    const entry: RuleToolResult = {
      id: rule.id,
      analyzer: analyzer.id,
      severity: rule.severity,
      title: rule.title,
      description: rule.description,
      remediation: rule.remediation,
    };
    if (rule.confidence) entry.confidence = rule.confidence;
    return entry;
  }

  const known = ANALYZER_LIST.flatMap((analyzer) => analyzer.rules.map((rule) => rule.id));
  const close = known.filter((id) => id.includes(normalized.split(".").pop() ?? normalized));

  throw new Error(
    `Unknown rule "${ruleId}". ${close.length > 0 ? `Did you mean: ${close.slice(0, 5).join(", ")}?` : "Run list_rules to see every rule."}`,
  );
}

export interface BlastRadiusInput {
  token?: string;
  ghAccount?: string;
  scopes?: string[];
  permissions?: string[];
  login?: string;
}

export async function blastRadius(input: BlastRadiusInput): Promise<BlastRadiusResult> {
  let token = input.token?.trim();
  let tokenType = token ? detectTokenType(token) : undefined;

  if (!token && input.ghAccount) {
    token = getGhToken(input.ghAccount);
    if (!token) {
      throw new Error(`No token found in the gh keyring for "${input.ghAccount}".`);
    }
    tokenType = detectTokenType(token);
  }

  const scopes = input.scopes?.length ? parseScopeInput(input.scopes.join(",")) : undefined;

  let permissions: PermissionGrant[] | undefined;
  if (input.permissions?.length) {
    const parsed = parsePermissionInput(input.permissions.join(","));
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors.join(" "));
    }
    permissions = parsed.grants;
  }

  if (!token && !scopes?.length && !permissions?.length) {
    throw new Error(
      "Nothing to analyse. Pass a token, a gh_account, or describe the token with scopes or permissions.",
    );
  }

  const report = await runScan({
    root: ".",
    filesOnly: true,
    token,
    tokenType,
    scopes,
    permissions,
    login: input.login,
  });

  const info = report.token;

  return {
    identity: info?.identity ?? null,
    type: info?.typeLabel ?? "unknown",
    redacted: info?.redacted ?? "****...redacted",
    scopes: info?.scopes ?? [],
    permissions: (info?.permissions ?? []).map((grant) => ({
      permission: grant.permission,
      access: grant.access,
    })),
    scoreKnown: info?.scoreKnown ?? false,
    findings: report.findings.map(toToolFinding),
    warnings: report.warnings,
  };
}
