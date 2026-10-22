import { SEVERITIES, type AnalyzerId, type Finding, type Severity } from "./types";

const ORDER: readonly Severity[] = ["low", "medium", "high", "critical"];

export function isSeverity(value: string): value is Severity {
  return (SEVERITIES as readonly string[]).includes(value);
}

export function severityRank(severity: Severity): number {
  return ORDER.indexOf(severity);
}

export function severityAtLeast(value: Severity, threshold: Severity): boolean {
  return severityRank(value) >= severityRank(threshold);
}

export function highestSeverity(findings: readonly Finding[]): Severity | null {
  let highest: Severity | null = null;
  for (const finding of findings) {
    if (highest === null || severityRank(finding.severity) > severityRank(highest)) {
      highest = finding.severity;
    }
  }
  return highest;
}

export function emptySummary(): Record<AnalyzerId, { total: number; bySeverity: Record<Severity, number> }> {
  const bySeverity = {} as Record<Severity, number>;
  for (const severity of SEVERITIES) bySeverity[severity] = 0;

  return {
    token: { total: 0, bySeverity: { ...bySeverity } },
    workflow: { total: 0, bySeverity: { ...bySeverity } },
    secret: { total: 0, bySeverity: { ...bySeverity } },
    agent: { total: 0, bySeverity: { ...bySeverity } },
  };
}
