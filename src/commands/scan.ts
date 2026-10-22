import { Command } from "commander";
import { isAnalyzerId } from "../analyzers";
import { isReportFormat } from "../report";
import { severityAtLeast } from "../core/severity";
import { redactSecrets } from "../core/redact";
import { SEVERITIES, type AnalyzerId, type Severity } from "../core/types";
import { runScan } from "../engine/run";
import { renderReport } from "../report";

interface ScanCliOptions {
  format: string;
  failOn?: string;
  exclude?: string[];
  ignore?: string[];
  analyzer?: string[];
  sarifLocation?: string;
  color: boolean;
  quiet?: boolean;
}

function parseSeverity(raw: string | undefined): Severity | undefined {
  if (!raw) return undefined;
  if (!SEVERITIES.includes(raw as Severity)) {
    throw new Error(`Invalid severity "${raw}". Expected one of: ${SEVERITIES.join(", ")}.`);
  }
  return raw as Severity;
}

function parseAnalyzers(raw: string[] | undefined): AnalyzerId[] | undefined {
  if (!raw || raw.length === 0) return undefined;

  const ids: AnalyzerId[] = [];
  for (const entry of raw) {
    for (const part of entry.split(/[\s,]+/)) {
      const id = part.trim();
      if (!id) continue;
      if (!isAnalyzerId(id)) {
        throw new Error(`Unknown analyzer "${id}". Expected one of: token, workflow, secret.`);
      }
      ids.push(id);
    }
  }
  return ids.length > 0 ? ids : undefined;
}

export function registerScan(program: Command): void {
  program
    .command("scan")
    .description("Scan a repository for token blast radius, workflow holes and leaked secrets")
    .argument("[path]", "path to scan", ".")
    .option("--format <format>", "output format: terminal, markdown, json or sarif", "terminal")
    .option("--fail-on <severity>", "exit with code 2 when a finding is at or above this severity")
    .option("--exclude <pattern>", "skip paths containing this text (repeatable)", collect, [])
    .option("--ignore <rule-id>", "ignore this rule everywhere (repeatable)", collect, [])
    .option("--analyzer <ids>", "only run these analyzers: token, workflow, secret (repeatable)", collect, [])
    .option("--sarif-location <path>", "path recorded for the SARIF report location")
    .option("--no-color", "disable ANSI colors")
    .option("--quiet", "do not print the report to stdout")
    .action(async (path: string, options: ScanCliOptions) => {
      if (!isReportFormat(options.format)) {
        throw new Error(`Invalid format "${options.format}". Expected terminal, markdown, json or sarif.`);
      }

      const failOn = parseSeverity(options.failOn);
      const analyzers = parseAnalyzers(options.analyzer);

      const report = await runScan({
        root: path,
        analyzers,
        excludes: options.exclude ?? [],
        ignore: options.ignore ?? [],
      });

      const color =
        options.color !== false &&
        options.format === "terminal" &&
        Boolean(process.stdout.isTTY);

      if (!options.quiet) {
        process.stdout.write(
          `${renderReport(report, options.format, color, { sarifLocation: options.sarifLocation })}\n`,
        );
      }

      if (failOn && severityAtLeast(report.score.level, failOn)) {
        process.stderr.write(
          `ghcheck: highest severity ${report.score.level} meets or exceeds fail-on=${failOn}\n`,
        );
        process.exitCode = 2;
      }
    })
    .addHelpText(
      "after",
      `
Examples:
  $ ghcheck scan
  $ ghcheck scan ../my-repo --format markdown > report.md
  $ ghcheck scan --format sarif > ghcheck.sarif
  $ ghcheck scan --fail-on high
  $ ghcheck scan --analyzer workflow --ignore workflow.unpinned-action
  $ ghcheck scan --exclude node_modules --exclude dist
`,
    );
}

function collect(value: string, previous: string[]): string[] {
  return previous.concat([value]);
}

export function formatError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return redactSecrets(message);
}
