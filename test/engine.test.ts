import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runScan } from "../src/engine/run";
import { renderReport } from "../src/report";

async function makeRepo(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "ghcheck-test-"));
  for (const [relative, content] of Object.entries(files)) {
    const absolute = join(root, relative);
    await mkdir(join(absolute, ".."), { recursive: true });
    await writeFile(absolute, content, "utf8");
  }
  return root;
}

const VULNERABLE_WORKFLOW = [
  "on:",
  "  pull_request_target:",
  "jobs:",
  "  build:",
  "    runs-on: ubuntu-latest",
  "    steps:",
  "      - uses: actions/checkout@v4",
  "      - run: echo ${{ github.event.pull_request.title }}",
].join("\n");

describe("engine", () => {
  test("folds three analyzers into one report", async () => {
    const root = await makeRepo({
      ".github/workflows/ci.yml": VULNERABLE_WORKFLOW,
      "config.ts": 'const key = "AKIA3XQ7PLMN2Z9JK4TB";',
    });

    const report = await runScan({ root });

    expect(report.findings.length).toBeGreaterThan(0);
    expect(report.summary.workflow.total).toBeGreaterThan(0);
    expect(report.summary.secret.total).toBeGreaterThan(0);
    expect(report.schemaVersion).toBe(1);
    expect(report.stats.filesScanned).toBe(2);
  });

  test("honours the analyzer selection", async () => {
    const root = await makeRepo({ ".github/workflows/ci.yml": VULNERABLE_WORKFLOW });

    const report = await runScan({ root, analyzers: ["secret"] });
    expect(report.findings).toHaveLength(0);
  });

  test("ignores a rule everywhere when it is in the ignore list", async () => {
    const root = await makeRepo({ ".github/workflows/ci.yml": VULNERABLE_WORKFLOW });

    const report = await runScan({ root, ignore: ["workflow.script-injection"] });
    expect(report.findings.find((finding) => finding.id === "workflow.script-injection")).toBeUndefined();
  });

  test("honours a suppression comment in the file", async () => {
    const root = await makeRepo({
      ".github/workflows/ci.yml": VULNERABLE_WORKFLOW.replace(
        "      - run: echo ${{ github.event.pull_request.title }}",
        "      - run: echo ${{ github.event.pull_request.title }} # ghcheck: ignore workflow.script-injection",
      ),
    });

    const report = await runScan({ root });
    expect(report.findings.find((finding) => finding.id === "workflow.script-injection")).toBeUndefined();
  });

  test("never leaks a raw credential into the report", async () => {
    const root = await makeRepo({
      "config.ts": 'const token = "ghp_16C7e42F292c6912E7710c838347Ae178B4a";',
    });

    const report = await runScan({ root });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain("16C7e42F292c6912E7710c838347Ae178B4a");
  });
});

describe("report renderers", () => {
  test("renders markdown", async () => {
    const root = await makeRepo({ ".github/workflows/ci.yml": VULNERABLE_WORKFLOW });
    const report = await runScan({ root });
    const markdown = renderReport(report, "markdown", false);

    expect(markdown).toContain("# ghcheck report");
    expect(markdown).toContain("workflow.script-injection");
  });

  test("renders json that round trips", async () => {
    const root = await makeRepo({ ".github/workflows/ci.yml": VULNERABLE_WORKFLOW });
    const report = await runScan({ root });
    const parsed = JSON.parse(renderReport(report, "json", false));

    expect(parsed.findings.length).toBe(report.findings.length);
    expect(parsed.score.value).toBe(report.score.value);
  });

  test("renders sarif with a rule and a result per finding", async () => {
    const root = await makeRepo({ ".github/workflows/ci.yml": VULNERABLE_WORKFLOW });
    const report = await runScan({ root });
    const sarif = JSON.parse(renderReport(report, "sarif", false));

    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0].results.length).toBe(report.findings.length);
    expect(sarif.runs[0].results[0].ruleId).toMatch(/^ghcheck\//);
    expect(sarif.runs[0].results[0].locations[0].physicalLocation.artifactLocation.uri).toContain(
      ".github/workflows/ci.yml",
    );
  });

  test("renders the terminal report", async () => {
    const root = await makeRepo({ ".github/workflows/ci.yml": VULNERABLE_WORKFLOW });
    const report = await runScan({ root });
    const terminal = renderReport(report, "terminal", false);

    expect(terminal).toContain("ghcheck");
    expect(terminal).toContain("Blast radius");
  });
});
