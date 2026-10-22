import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(import.meta.dir, "..", "src", "cli.ts");

async function makeRepo(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "ghcheck-cli-"));
  const workflowDir = join(root, ".github", "workflows");
  await mkdir(workflowDir, { recursive: true });
  await writeFile(
    join(workflowDir, "ci.yml"),
    [
      "on:",
      "  pull_request_target:",
      "jobs:",
      "  build:",
      "    runs-on: ubuntu-latest",
      "    steps:",
      "      - run: echo ${{ github.event.pull_request.title }}",
    ].join("\n"),
    "utf8",
  );
  return root;
}

async function runCli(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const child = Bun.spawn(["bun", "run", CLI, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()]);
  const code = await child.exited;
  return { code, stdout, stderr };
}

describe("cli", () => {
  test("prints a report and exits 0 without a threshold", async () => {
    const root = await makeRepo();
    const result = await runCli(["scan", root]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("ghcheck");
    expect(result.stdout).toContain("Blast radius");
  });

  test("exits 2 when a finding reaches the threshold", async () => {
    const root = await makeRepo();
    const result = await runCli(["scan", root, "--fail-on", "high"]);

    expect(result.code).toBe(2);
    expect(result.stderr).toContain("fail-on");
  });

  test("exits 0 when nothing reaches the threshold", async () => {
    const root = await mkdtemp(join(tmpdir(), "ghcheck-cli-clean-"));
    await writeFile(join(root, "README.md"), "# clean\n", "utf8");
    const result = await runCli(["scan", root, "--fail-on", "critical"]);

    expect(result.code).toBe(0);
  });

  test("rejects an unknown analyzer", async () => {
    const root = await makeRepo();
    const result = await runCli(["scan", root, "--analyzer", "nope"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain("Unknown analyzer");
  });

  test("prints json on request", async () => {
    const root = await makeRepo();
    const result = await runCli(["scan", root, "--format", "json"]);

    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.schemaVersion).toBe(1);
    expect(Array.isArray(parsed.findings)).toBe(true);
  });

  test("lists the rules", async () => {
    const result = await runCli(["rules", "--format", "json"]);

    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.rules.length).toBeGreaterThan(10);
  });
});
