import pc from "picocolors";
import pkg from "../../package.json";
import type { AnalyzerId, Finding, Report, Severity } from "../core/types";

type Colors = ReturnType<typeof pc.createColors>;

const ANALYZER_LABELS: Record<AnalyzerId, string> = {
  token: "token",
  workflow: "workflow",
  secret: "secret",
};

function severityColor(colors: Colors, severity: Severity, text: string): string {
  switch (severity) {
    case "critical":
      return colors.red(colors.bold(text));
    case "high":
      return colors.magenta(text);
    case "medium":
      return colors.yellow(text);
    case "low":
      return colors.blue(text);
  }
}

function severityLabel(severity: Severity): string {
  return severity.toUpperCase();
}

function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  return `${value.slice(0, Math.max(0, length - 3))}...`;
}

const SEVERITY_ORDER: Severity[] = ["low", "medium", "high", "critical"];

function bySeverity(a: Finding, b: Finding): number {
  return SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity);
}

function scoreBar(value: number): string {
  const filled = Math.max(0, Math.min(20, Math.round(value / 5)));
  return `${"█".repeat(filled)}${"░".repeat(20 - filled)}`;
}

function countBySeverity(report: Report): string {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const finding of report.findings) counts[finding.severity] += 1;
  const parts: string[] = [];
  if (counts.critical > 0) parts.push(`${counts.critical} critical`);
  if (counts.high > 0) parts.push(`${counts.high} high`);
  if (counts.medium > 0) parts.push(`${counts.medium} medium`);
  if (counts.low > 0) parts.push(`${counts.low} low`);
  return parts.length > 0 ? parts.join(", ") : "none";
}

function locationOf(finding: Finding): string {
  const location = finding.location;
  if (!location) return "";
  return `${location.file}:${location.line}`;
}

export function renderTerminal(report: Report, color: boolean): string {
  const c = pc.createColors(color);
  const lines: string[] = [];
  const label = (value: string) => c.dim(value.padEnd(10));

  lines.push(`${c.bold("ghcheck")} ${pkg.version}`);
  if (report.token) {
    const token = report.token;
    lines.push(`${label("identity")} ${token.identity ?? "(unavailable)"}`);
    lines.push(`${label("token")} ${token.redacted} ${c.dim(`(${token.typeLabel})`)}`);
    lines.push(`${label("scopes")} ${token.scopes.length > 0 ? token.scopes.join(", ") : "none"}`);
    if (token.permissions.length > 0) {
      lines.push(
        `${label("permissions")} ${token.permissions.length} ${c.dim("(self-reported)")}`,
      );
    }
  }
  lines.push(`${label("findings")} ${report.findings.length} ${c.dim(`(${countBySeverity(report)})`)}`);
  lines.push(
    `${label("files")} ${report.stats.filesScanned} scanned${report.stats.skippedFiles > 0 ? c.dim(`, ${report.stats.skippedFiles} skipped`) : ""}`,
  );
  lines.push(`${label("took")} ${report.stats.durationMs}ms`);

  lines.push("");

  if (report.findings.length === 0) {
    lines.push(c.green("No findings. The known rule sets did not match this repository."));
  } else {
    const level = severityLabel(report.score.level);
    const badge = severityColor(c, report.score.level, level.padEnd(8));
    const raw =
      report.score.rawValue !== report.score.value ? c.dim(` (raw ${report.score.rawValue})`) : "";
    lines.push(`${c.bold("Blast radius")}  ${badge} ${scoreBar(report.score.value)} ${report.score.value}/100${raw}`);
  }

  if (report.findings.length > 0) {
    lines.push("");
    lines.push(c.bold("Top risks"));
    const top = [...report.findings].sort(bySeverity).slice(0, 5);
    for (const finding of top) {
      lines.push(
        `  ${severityColor(c, finding.severity, "!")} ${c.bold(finding.title)} ${c.dim(`[${finding.id}]`)}`,
      );
      const where = locationOf(finding);
      if (where) {
        lines.push(`    ${c.dim(where)}`);
      } else if (finding.grantedBy?.length) {
        lines.push(`    ${c.dim("granted by")} ${finding.grantedBy.join(", ")}`);
      }
      lines.push(`    ${c.dim(truncate(finding.description, 110))}`);
      if (finding.evidence) {
        lines.push(`    ${c.dim("evidence")} ${c.dim(finding.evidence)}`);
      }
      lines.push(`    ${c.dim("fix")} ${c.dim(truncate(finding.remediation, 110))}`);
    }

    lines.push("");
    lines.push(c.bold("Findings"));
    lines.push(
      `  ${c.dim("SEVERITY".padEnd(9))}${c.dim("RULE".padEnd(38))}${c.dim("LOCATION")}`,
    );
    for (const finding of report.findings) {
      lines.push(
        `  ${severityColor(c, finding.severity, severityLabel(finding.severity).padEnd(9))}${truncate(finding.id, 37).padEnd(38)}${locationOf(finding)}`,
      );
    }

    lines.push("");
    lines.push(c.bold("By analyzer"));
    for (const [analyzer, bucket] of Object.entries(report.summary)) {
      const label2 = ANALYZER_LABELS[analyzer as AnalyzerId];
      const parts: string[] = [];
      for (const severity of ["critical", "high", "medium", "low"] as Severity[]) {
        const count = bucket.bySeverity[severity];
        if (count > 0) parts.push(`${count} ${severity}`);
      }
      lines.push(
        `  ${c.dim(label2.padEnd(10))} ${String(bucket.total).padEnd(4)} ${c.dim(parts.join(", ") || "none")}`,
      );
    }
  }

  if (report.warnings.length > 0) {
    lines.push("");
    lines.push(c.bold("Warnings"));
    for (const warning of report.warnings) {
      lines.push(`  ${c.yellow("!")} ${warning}`);
    }
  }

  lines.push("");
  lines.push(c.dim("Local-only scan. No network requests were made and no file was modified."));

  return lines.join("\n");
}
