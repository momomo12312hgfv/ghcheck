import { Command } from "commander";
import { isReportFormat } from "../report";
import { severityAtLeast } from "../core/severity";
import { redactSecrets } from "../core/redact";
import { SEVERITIES, type Severity } from "../core/types";
import { runScan } from "../engine/run";
import { renderReport } from "../report";
import { resolveTokenInput, type TokenInputOptions } from "./token-input";

interface TokenCliOptions extends TokenInputOptions {
  format: string;
  failOn?: string;
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

export function registerToken(program: Command): void {
  program
    .command("token")
    .description("Show the blast radius of a GitHub token")
    .option("--token <token>", "the token to scan (prefer --token-stdin or --gh-account)")
    .option("--token-stdin", "read the token from stdin")
    .option("--gh-account <name>", "read the token from the gh CLI keyring for this account")
    .option("--scopes <scopes>", "comma-separated classic scopes, for an offline scan")
    .option("--permissions <permissions>", "fine-grained permissions, e.g. contents=write,metadata=read")
    .option("--login <login>", "login name to display")
    .option("--token-type <type>", "override token type detection")
    .option("--format <format>", "output format: terminal, markdown, json or sarif", "terminal")
    .option("--fail-on <severity>", "exit with code 2 when a finding is at or above this severity")
    .option("--no-color", "disable ANSI colors")
    .option("--quiet", "do not print the report to stdout")
    .action(async (options: TokenCliOptions) => {
      if (!isReportFormat(options.format)) {
        throw new Error(`Invalid format "${options.format}". Expected terminal, markdown, json or sarif.`);
      }

      const failOn = parseSeverity(options.failOn);
      const input = await resolveTokenInput(options);

      if (!input.token && !input.scopes?.length && !input.permissions?.length) {
        throw new Error(
          "No token found. Use --token-stdin, --gh-account, --token, or describe the token with --scopes or --permissions.",
        );
      }

      const report = await runScan({
        root: ".",
        filesOnly: true,
        token: input.token,
        tokenType: input.tokenType,
        scopes: input.scopes,
        permissions: input.permissions,
        login: input.login,
      });

      const color =
        options.color !== false &&
        options.format === "terminal" &&
        Boolean(process.stdout.isTTY);

      if (!options.quiet) {
        process.stdout.write(`${renderReport(report, options.format, color)}\n`);
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
  $ gh token --gh-account momomo12312hgfv
  $ cat token.txt | ghcheck token --token-stdin
  $ ghcheck token --scopes repo,workflow,delete_repo
  $ ghcheck token --permissions repo.contents=write,repo.workflows=write
  $ ghcheck token --token-stdin --format json
`,
    );
}
