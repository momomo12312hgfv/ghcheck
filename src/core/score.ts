import { highestSeverity } from "./severity";
import type { Finding, ScoreBreakdownItem, ScoreResult, Severity } from "./types";

/**
 * Same weights and floors patscope uses. Keeping them identical means a
 * score means the same thing across the whole tool family.
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 50,
  high: 20,
  medium: 8,
  low: 2,
};

export const SEVERITY_FLOORS: Record<Severity, number> = {
  critical: 70,
  high: 45,
  medium: 20,
  low: 0,
};

const LEVEL_THRESHOLDS: Array<{ minimum: number; level: Severity }> = [
  { minimum: 70, level: "critical" },
  { minimum: 45, level: "high" },
  { minimum: 20, level: "medium" },
  { minimum: 0, level: "low" },
];

export function scoreLevel(value: number): Severity {
  return LEVEL_THRESHOLDS.find((threshold) => value >= threshold.minimum)?.level ?? "low";
}

/**
 * A rule that fires in twenty places is still one problem, so findings are
 * collapsed by rule id before scoring. The highest severity wins.
 */
export function collapseByRule(findings: readonly Finding[]): Map<string, Finding[]> {
  const grouped = new Map<string, Finding[]>();
  for (const finding of findings) {
    const bucket = grouped.get(finding.id);
    if (bucket) {
      bucket.push(finding);
    } else {
      grouped.set(finding.id, [finding]);
    }
  }
  return grouped;
}

export function evaluateFindings(findings: readonly Finding[]): ScoreResult {
  const grouped = collapseByRule(findings);

  const breakdown: ScoreBreakdownItem[] = [];
  for (const [id, bucket] of grouped) {
    const first = bucket[0];
    if (!first) continue;
    const severity = bucket.reduce<Severity>(
      (acc, item) => (severityRankOf(item.severity) > severityRankOf(acc) ? item.severity : acc),
      "low",
    );
    breakdown.push({
      id,
      analyzer: first.analyzer,
      title: first.title,
      severity,
      weight: SEVERITY_WEIGHTS[severity],
      count: bucket.length,
    });
  }

  breakdown.sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id));

  const rawValue = breakdown.reduce((sum, item) => sum + item.weight, 0);
  const highest = highestSeverity(findings);
  const floor = highest ? SEVERITY_FLOORS[highest] : 0;
  const value = Math.min(100, Math.max(rawValue, floor));
  const floorApplied = floor > rawValue;

  return {
    value,
    rawValue,
    level: scoreLevel(value),
    highestSeverity: highest,
    floorApplied,
    breakdown,
  };
}

function severityRankOf(severity: Severity): number {
  return ["low", "medium", "high", "critical"].indexOf(severity);
}
