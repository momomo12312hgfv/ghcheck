import { ANALYZER_LIST } from "../analyzers";
import type { Finding, Report, Severity } from "../core/types";
import pkg from "../../package.json";

type SarifLevel = "error" | "warning" | "note";

const DOCS_URL = "https://github.com/momomo12312hgfv/ghcheck/blob/main/docs/rules.md";

function sarifLevel(severity: Severity): SarifLevel {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "note";
}

function ruleMetadata(id: string): { title: string; description: string; remediation: string; confidence?: string } {
  for (const analyzer of ANALYZER_LIST) {
    const rule = analyzer.rules.find((candidate) => candidate.id === id);
    if (rule) {
      return {
        title: rule.title,
        description: rule.description,
        remediation: rule.remediation,
        confidence: rule.confidence,
      };
    }
  }
  return {
    title: id,
    description: id,
    remediation: "See the documentation for this rule.",
  };
}

function buildRules(report: Report) {
  const ids = [...new Set(report.findings.map((finding) => finding.id))].sort();

  return ids.map((id) => {
    const meta = ruleMetadata(id);
    const worst = report.findings
      .filter((finding) => finding.id === id)
      .reduce<Severity>(
        (acc, finding) =>
          ["low", "medium", "high", "critical"].indexOf(finding.severity) >
          ["low", "medium", "high", "critical"].indexOf(acc)
            ? finding.severity
            : acc,
        "low",
      );

    return {
      id: `ghcheck/${id}`,
      name: id.replace(/[^A-Za-z0-9]+/g, ""),
      shortDescription: { text: meta.title },
      fullDescription: { text: meta.description },
      help: { text: meta.remediation },
      helpUri: DOCS_URL,
      properties: {
        tags: ["security", "github", id.split(".")[0] ?? "ghcheck"],
        severity: worst,
        ...(meta.confidence ? { confidence: meta.confidence } : {}),
      },
    };
  });
}

function buildResult(finding: Finding, index: number) {
  const location = finding.location;
  const messageParts = [finding.title, finding.description];
  if (finding.evidence) messageParts.push(`Evidence: ${finding.evidence}`);
  if (finding.grantedBy?.length) messageParts.push(`Granted by: ${finding.grantedBy.join(", ")}`);

  return {
    ruleId: `ghcheck/${finding.id}`,
    level: sarifLevel(finding.severity),
    message: { text: messageParts.join(" ") },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: (location?.file ?? "repository").replace(/\\/g, "/") },
          region: { startLine: location?.line ?? 1, startColumn: location?.column ?? 1 },
        },
        logicalLocations: [
          {
            name: finding.analyzer,
            fullyQualifiedName: `ghcheck.${finding.id}`,
            kind: "rule",
          },
        ],
      },
    ],
    partialFingerprints: { "ghcheck/v1": `${finding.id}:${index}` },
    properties: {
      severity: finding.severity,
      analyzer: finding.analyzer,
      ...(finding.confidence ? { confidence: finding.confidence } : {}),
      ...(finding.grantedBy?.length ? { grantedBy: finding.grantedBy } : {}),
    },
  };
}

export interface SarifOptions {
  locationUri?: string;
}

export function renderSarif(report: Report, options: SarifOptions = {}): string {
  const properties: Record<string, unknown> = {
    score: report.score.value,
    level: report.score.level,
    filesScanned: report.stats.filesScanned,
  };

  if (options.locationUri) {
    properties.markdownReport = options.locationUri.replace(/\\/g, "/");
  }

  const sarif = {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "ghcheck",
            informationUri: "https://github.com/momomo12312hgfv/ghcheck",
            version: pkg.version,
            rules: buildRules(report),
          },
        },
        invocations: [
          {
            executionSuccessful: true,
            startTimeUtc: report.generatedAt,
            toolExecutionNotifications: report.warnings.map((warning) => ({
              level: "note",
              message: { text: warning },
            })),
          },
        ],
        properties,
        results: report.findings.map((finding, index) => buildResult(finding, index)),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}
