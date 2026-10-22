/**
 * The single shape every analyzer is allowed to produce.
 *
 * Three analyzers (token / workflow / secret) only ever speak through
 * `Finding`. Renderers, scoring, suppression and the GitHub Action know
 * nothing else. That constraint is what makes "multi-repo merge" real
 * rather than three tools wearing one hat.
 */

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;

export type Severity = (typeof SEVERITIES)[number];

export const ANALYZERS = ["token", "workflow", "secret"] as const;

export type AnalyzerId = (typeof ANALYZERS)[number];

export interface Location {
  /** Path relative to the scan root, always with forward slashes. */
  file: string;
  line: number;
  column?: number;
}

export interface Finding {
  /** Globally unique rule id, e.g. `workflow.script-injection`. */
  id: string;
  analyzer: AnalyzerId;
  severity: Severity;
  title: string;
  description: string;
  location?: Location;
  /** Already redacted. Never contains a raw credential. */
  evidence?: string;
  /** Token analyzer only: which scope or permission produced this. */
  grantedBy?: string[];
  remediation: string;
}

export interface ScoreBreakdownItem {
  id: string;
  analyzer: AnalyzerId;
  title: string;
  severity: Severity;
  weight: number;
  /** How many places the rule matched. */
  count: number;
}

export interface ScoreResult {
  value: number;
  rawValue: number;
  level: Severity;
  highestSeverity: Severity | null;
  floorApplied: boolean;
  breakdown: ScoreBreakdownItem[];
}

export interface AnalyzerSummary {
  total: number;
  bySeverity: Record<Severity, number>;
}

export interface ScanStats {
  filesScanned: number;
  bytesScanned: number;
  durationMs: number;
  skippedFiles: number;
}

export interface Report {
  schemaVersion: 1;
  generatedAt: string;
  tool: {
    name: string;
    version: string;
  };
  findings: Finding[];
  score: ScoreResult;
  summary: Record<AnalyzerId, AnalyzerSummary>;
  stats: ScanStats;
  warnings: string[];
}

export interface AnalyzerContext {
  /** Path relative to the scan root, always with forward slashes. */
  file: string;
  content: string;
}

export interface Analyzer {
  id: AnalyzerId;
  name: string;
  description: string;
  /** Rules this analyzer can emit, used by `ghcheck rules` and docs. */
  rules: RuleDefinition[];
  analyze(context: AnalyzerContext): Finding[] | Promise<Finding[]>;
}

export interface RuleDefinition {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  remediation: string;
}
