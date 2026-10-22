import { appendFileSync } from "node:fs";
import { appendFile, writeFile } from "node:fs/promises";
import { isAnalyzerId } from "./analyzers";
import { redactSecrets } from "./core/redact";
import { severityAtLeast } from "./core/severity";
import { SEVERITIES, type AnalyzerId, type Severity } from "./core/types";
import { runScan } from "./engine/run";
import { isReportFormat, renderReport, type ReportFormat } from "./report";

function input(name: string, fallback = ""): string {
  return (process.env[`INPUT_${name.toUpperCase()}`] ?? fallback).trim();
}

function parseSeverity(raw: string): Severity {
  const value = raw.trim().toLowerCase();
  if (!SEVERITIES.includes(value as Severity)) {
    throw new Error(`Invalid fail-on value "${raw}". Expected one of: ${SEVERITIES.join(", ")}.`);
  }
  return value as Severity;
}

function parseActionFormat(raw: string): ReportFormat {
  const value = raw.trim().toLowerCase();
  if (!isReportFormat(value) || value === "terminal") {
    throw new Error(`Invalid format "${raw}". Expected markdown, json or sarif.`);
  }
  return value;
}

function splitList(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function setOutput(name: string, value: string): void {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  appendFileSync(outputFile, `${name}=${value}\n`, "utf8");
}

async function appendSummary(markdown: string): Promise<void> {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;
  await appendFile(summaryFile, `${markdown}\n`, "utf8");
}

export interface RunActionOptions {
  silent?: boolean;
}

export async function runAction(options: RunActionOptions = {}): Promise<void> {
  const path = input("path", ".");
  const failOn = parseSeverity(input("fail-on", "high"));
  const format = parseActionFormat(input("format", "markdown"));
  const outputFile =
    input("output-file") || (format === "sarif" ? "ghcheck-report.sarif" : "ghcheck-report.md");

  const analyzers: AnalyzerId[] = [];
  for (const id of splitList(input("analyzer"))) {
    if (!isAnalyzerId(id)) {
      throw new Error(`Unknown analyzer "${id}". Expected one of: token, workflow, secret.`);
    }
    analyzers.push(id);
  }

  try {
    const report = await runScan({
      root: path,
      analyzers: analyzers.length > 0 ? analyzers : undefined,
      excludes: splitList(input("exclude")),
      ignore: splitList(input("ignore")),
    });

    const markdown = renderReport(report, "markdown", false);
    let output: string;

    if (format === "sarif") {
      const markdownPath = /\.sarif$/i.test(outputFile)
        ? outputFile.replace(/\.sarif$/i, ".md")
        : `${outputFile}.md`;
      await writeFile(markdownPath, `${markdown}\n`, "utf8");
      output = renderReport(report, "sarif", false, { sarifLocation: markdownPath });
    } else {
      output = renderReport(report, format, false);
    }

    await writeFile(outputFile, `${output}\n`, "utf8");
    await appendSummary(markdown);

    if (!options.silent) {
      process.stdout.write(`${markdown}\n`);
    }

    setOutput("score", String(report.score.value));
    setOutput("level", report.score.level);
    setOutput("report", outputFile);
    setOutput("findings", String(report.findings.length));

    if (severityAtLeast(report.score.level, failOn)) {
      if (!options.silent) {
        process.stderr.write(
          `ghcheck: highest severity ${report.score.level} meets or exceeds fail-on=${failOn}\n`,
        );
      }
      process.exitCode = 1;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(redactSecrets(message));
  }
}
