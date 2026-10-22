import { spawn } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { runScan } from "../src/engine/run";

/**
 * Compares ghcheck against zizmor, actionlint and secretlint on a corpus of
 * real GitHub Actions workflows.
 *
 * The point is not to claim that ghcheck finds more. The point is to be
 * precise about what it covers, what it does not, and where it is weaker.
 */

const CORPUS_DIR = resolve(process.env.GHCHECK_CORPUS ?? ".parity/corpus");
const ZIZMOR = process.env.GHCHECK_ZIZMOR ?? "zizmor";
const ACTIONLINT = process.env.GHCHECK_ACTIONLINT ?? "actionlint";
const SECRETLINT = process.env.GHCHECK_SECRETLINT ?? "secretlint";
/** Working directory of the secretlint install, where its rule modules live. */
const SECRETLINT_CWD = process.env.GHCHECK_SECRETLINT_CWD ?? process.cwd();
const SECRETLINT_RC = process.env.GHCHECK_SECRETLINT_RC ?? "secretlintrc.json";
const OUT = "docs/parity.md";

interface ZizmorFinding {
  ident: string;
  desc: string;
  determinations: { confidence: string; severity: string; persona: string };
  locations: Array<{ concrete?: { location?: { start_point?: { row?: number } } } }>;
  ignored: boolean;
}

interface ActionlintProblem {
  file: string;
  line: number;
  column: number;
  message: string;
  check: string;
}

interface SecretlintMessage {
  message: string;
  ruleId: string;
}

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else if (/\.ya?ml$/.test(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function run(
  command: string,
  args: string[],
  cwd?: string,
): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolvePromise) => {
    const child = spawn(command, args, { cwd, shell: false });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += String(chunk)));
    child.stderr.on("data", (chunk) => (stderr += String(chunk)));
    child.on("error", (error) => {
      stderr += String(error);
      resolvePromise({ code: -1, stdout, stderr });
    });
    child.on("close", (code) => resolvePromise({ code: code ?? -1, stdout, stderr }));
  });
}

/**
 * Which upstream check each ghcheck rule corresponds to.
 *
 * `null` means ghcheck has no counterpart there, which is information the
 * report should show rather than hide.
 */
const PARITY: Array<{
  ghcheck: string;
  zizmor: string | null;
  actionlint: string | null;
  secretlint: string | null;
  note: string;
}> = [
  {
    ghcheck: "workflow.script-injection",
    zizmor: "template-injection",
    actionlint: null,
    secretlint: null,
    note: "zizmor resolves the expression and checks the sink; ghcheck matches the source and the sink separately",
  },
  {
    ghcheck: "workflow.indirect-interpolation",
    zizmor: "template-injection",
    actionlint: null,
    secretlint: null,
    note: "the same audit, split by how much is known about the source of the value",
  },
  {
    ghcheck: "workflow.privileged-checkout",
    zizmor: "artipacked",
    actionlint: null,
    secretlint: null,
    note: "zizmor also reports credential persistence, ghcheck only reports the privileged checkout",
  },
  {
    ghcheck: "workflow.dangerous-trigger",
    zizmor: "dangerous-triggers",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "workflow.unpinned-action",
    zizmor: "unpinned-uses",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "workflow.deprecated-action",
    zizmor: "known-vulnerable-actions",
    actionlint: null,
    secretlint: null,
    note: "zizmor checks this online against the advisory database, ghcheck uses a local table",
  },
  {
    ghcheck: "workflow.secrets-inherit",
    zizmor: "secrets-inherit",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "workflow.self-hosted-runner",
    zizmor: "self-hosted-runner",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "workflow.docker-unpinned",
    zizmor: "unpinned-images",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "workflow.invalid-yaml",
    zizmor: null,
    actionlint: "syntax-check",
    secretlint: null,
    note: "actionlint is the tool that reports workflow syntax errors",
  },
  {
    ghcheck: "token.write-all-permissions",
    zizmor: "excessive-permissions",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "token.write-permission-*",
    zizmor: "excessive-permissions",
    actionlint: null,
    secretlint: null,
    note: "ghcheck names the permission, zizmor reports the workflow",
  },
  {
    ghcheck: "token.permissions-not-declared",
    zizmor: "excessive-permissions",
    actionlint: null,
    secretlint: null,
    note: "",
  },
  {
    ghcheck: "secret.*",
    zizmor: null,
    actionlint: null,
    secretlint: "all provider rules",
    note: "ghcheck has its own provider rules, the overlap is partial",
  },
];

console.log(`Corpus: ${CORPUS_DIR}`);
const files = await walk(CORPUS_DIR);
console.log(`Workflow files: ${files.length}`);

console.log("Running ghcheck...");
const report = await runScan({ root: CORPUS_DIR, analyzers: ["workflow", "token", "secret"] });
const ghcheckByRule = new Map<string, number>();
for (const finding of report.findings) {
  ghcheckByRule.set(finding.id, (ghcheckByRule.get(finding.id) ?? 0) + 1);
}
console.log(`  ghcheck: ${report.findings.length} findings`);

console.log("Running zizmor...");
const zizmorRun = await run(ZIZMOR, ["--format", "json", CORPUS_DIR]);
let zizmor: ZizmorFinding[] = [];
try {
  zizmor = JSON.parse(zizmorRun.stdout) as ZizmorFinding[];
} catch (error) {
  console.error(`  could not parse zizmor output: ${String(error)}`);
  console.error(zizmorRun.stderr.slice(0, 500));
}
const zizmorByAudit = new Map<string, number>();
for (const finding of zizmor) {
  zizmorByAudit.set(finding.ident, (zizmorByAudit.get(finding.ident) ?? 0) + 1);
}
console.log(`  zizmor: ${zizmor.length} findings`);

console.log("Running actionlint...");
const actionlint: ActionlintProblem[] = [];
/**
 * actionlint takes file paths and does not walk directories, so the corpus is
 * handed to it in batches. Windows caps the command line at 32k characters.
 */
const BATCH = 30;
for (let index = 0; index < files.length; index += BATCH) {
  const batch = files.slice(index, index + BATCH);
  const actionlintRun = await run(ACTIONLINT, ["-oneline", ...batch]);
  for (const line of actionlintRun.stdout.split(/\r?\n/)) {
    const match = line.match(/^(.*?):(\d+):(\d+): (.*?) \[([a-z0-9-]+)\]$/);
    if (match) {
      actionlint.push({
        file: match[1] ?? "",
        line: Number(match[2]),
        column: Number(match[3]),
        message: match[4] ?? "",
        check: match[5] ?? "",
      });
    }
  }
}
const actionlintByCheck = new Map<string, number>();
for (const problem of actionlint) {
  actionlintByCheck.set(problem.check, (actionlintByCheck.get(problem.check) ?? 0) + 1);
}
console.log(`  actionlint: ${actionlint.length} problems`);

console.log("Running secretlint...");
const secretlintGlob = `${CORPUS_DIR.replace(/\\/g, "/")}/**/*.yml`;
const secretlintRun = await run(
  SECRETLINT,
  ["--secretlintrc", SECRETLINT_RC, "--format", "json", secretlintGlob],
  SECRETLINT_CWD,
);
let secretlint: Array<{ filePath: string; messages: SecretlintMessage[] }> = [];
try {
  secretlint = JSON.parse(secretlintRun.stdout) as Array<{
    filePath: string;
    messages: SecretlintMessage[];
  }>;
} catch (error) {
  console.error(`  could not parse secretlint output: ${String(error)}`);
  console.error(secretlintRun.stderr.slice(0, 500));
}
const secretlintByRule = new Map<string, number>();
for (const file of secretlint) {
  for (const message of file.messages ?? []) {
    const key = message.ruleId ?? "unknown";
    secretlintByRule.set(key, (secretlintByRule.get(key) ?? 0) + 1);
  }
}
const secretlintTotal = [...secretlintByRule.values()].reduce((sum, value) => sum + value, 0);
console.log(`  secretlint: ${secretlintTotal} findings`);

const lines: string[] = [];
lines.push("# Parity report");
lines.push("");
lines.push(
  "How ghcheck compares with [zizmor](https://github.com/zizmorcore/zizmor), [actionlint](https://github.com/rhysd/actionlint) and [secretlint](https://github.com/secretlint/secretlint) on a corpus of real GitHub Actions workflows.",
);
lines.push("");
lines.push(
  "Regenerate with `bun run scripts/fetch-corpus.ts` followed by `bun run scripts/parity.ts`.",
);
lines.push("");

lines.push("## Corpus");
lines.push("");
lines.push("| | |");
lines.push("| --- | --- |");
lines.push(`| Workflow files | ${files.length} |`);
lines.push(`| Repositories | ${new Set(files.map((file) => relative(CORPUS_DIR, file).split(/[\\/]/)[0])).size} |`);
lines.push("| Source | public repositories with more than 5,000 stars |");
lines.push("");

lines.push("## Results");
lines.push("");
lines.push("| Tool | Version | Findings |");
lines.push("| --- | --- | --- |");
lines.push(`| ghcheck | 0.1.0 | ${report.findings.length} |`);
lines.push(`| zizmor | ${zizmorRun.stdout.match(/zizmor v[0-9.]+/)?.[0]?.replace("zizmor ", "") ?? "1.31.1"} | ${zizmor.length} |`);
lines.push(`| actionlint | 1.7.12 | ${actionlint.length} |`);
lines.push(`| secretlint | 13.0.7 | ${secretlintTotal} (${secretlint.length} files scanned) |`);
lines.push("");

lines.push("## Rule coverage");
lines.push("");
lines.push("| ghcheck rule | zizmor | actionlint | secretlint | note |");
lines.push("| --- | --- | --- | --- | --- |");
for (const entry of PARITY) {
  lines.push(
    `| \`${entry.ghcheck}\` | ${entry.zizmor ? `\`${entry.zizmor}\`` : "—"} | ${entry.actionlint ? `\`${entry.actionlint}\`` : "—"} | ${entry.secretlint ? `\`${entry.secretlint}\`` : "—"} | ${entry.note} |`,
  );
}
lines.push("");

lines.push("## ghcheck findings per rule");
lines.push("");
lines.push("| Rule | Findings |");
lines.push("| --- | --- |");
for (const [rule, count] of [...ghcheckByRule.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`| \`${rule}\` | ${count} |`);
}
lines.push("");

lines.push("## zizmor findings per audit");
lines.push("");
lines.push("| Audit | Findings |");
lines.push("| --- | --- |");
for (const [audit, count] of [...zizmorByAudit.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`| \`${audit}\` | ${count} |`);
}
lines.push("");

lines.push("## actionlint findings per check");
lines.push("");
lines.push("| Check | Findings |");
lines.push("| --- | --- |");
for (const [check, count] of [...actionlintByCheck.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`| \`${check}\` | ${count} |`);
}
lines.push("");

lines.push("## secretlint findings per rule");
lines.push("");
lines.push("| Rule | Findings |");
lines.push("| --- | --- |");
for (const [rule, count] of [...secretlintByRule.entries()].sort((a, b) => b[1] - a[1])) {
  lines.push(`| \`${rule}\` | ${count} |`);
}
lines.push("");

lines.push("## What ghcheck does not cover");
lines.push("");
lines.push(
  "These zizmor audits had findings on this corpus and ghcheck has no rule for them. They are the honest gap list.",
);
lines.push("");
const covered = new Set(PARITY.map((entry) => entry.zizmor).filter(Boolean) as string[]);
const gaps = [...zizmorByAudit.entries()]
  .filter(([audit]) => !covered.has(audit))
  .sort((a, b) => b[1] - a[1]);
if (gaps.length === 0) {
  lines.push("None on this corpus.");
} else {
  lines.push("| zizmor audit | Findings |");
  lines.push("| --- | --- |");
  for (const [audit, count] of gaps) {
    lines.push(`| \`${audit}\` | ${count} |`);
  }
}
lines.push("");

lines.push("## What ghcheck covers that the others do not");
lines.push("");
lines.push(
  "- `ghcheck token` turns a personal access token into a capability map, which none of the three tools do.",
  "- `ghcheck scan` reports the GITHUB_TOKEN permissions of every job by name, zizmor reports the workflow that has too much permission.",
  "- One suppression syntax for all rules, one report, one score.",
);
lines.push("");

await writeFile(OUT, `${lines.join("\n")}\n`, "utf8");
console.log(`Wrote ${OUT}`);
console.log(
  `ghcheck ${report.findings.length} / zizmor ${zizmor.length} / actionlint ${actionlint.length} / secretlint ${secretlintTotal}`,
);
