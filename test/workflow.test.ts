import { describe, expect, test } from "bun:test";
import { analyzeWorkflow } from "../src/analyzers/workflow";

const FILE = ".github/workflows/ci.yml";

function analyze(content: string) {
  return analyzeWorkflow({ file: FILE, content });
}

describe("workflow rules", () => {
  test("reports an untrusted value interpolated into a shell command", () => {
    const findings = analyze(
      [
        "on: pull_request",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: echo ${{ github.event.pull_request.title }}",
      ].join("\n"),
    );

    const injection = findings.find((finding) => finding.id === "workflow.script-injection");
    expect(injection).toBeDefined();
    expect(injection?.severity).toBe("critical");
  });

  test("does not report a trusted expression", () => {
    const findings = analyze(
      [
        "on: push",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - run: echo ${{ github.sha }}",
      ].join("\n"),
    );

    expect(findings.find((finding) => finding.id === "workflow.script-injection")).toBeUndefined();
  });

  test("reports a privileged trigger", () => {
    const findings = analyze(
      ["on:", "  pull_request_target:", "jobs:", "  build:", "    runs-on: ubuntu-latest"].join("\n"),
    );

    const trigger = findings.find((finding) => finding.id === "workflow.dangerous-trigger");
    expect(trigger).toBeDefined();
    expect(trigger?.severity).toBe("high");
  });

  test("reports an action that is not pinned to a SHA", () => {
    const findings = analyze(
      [
        "on: push",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
      ].join("\n"),
    );

    const unpinned = findings.find((finding) => finding.id === "workflow.unpinned-action");
    expect(unpinned).toBeDefined();
    expect(unpinned?.location?.line).toBe(6);
  });

  test("accepts an action pinned to a full commit SHA", () => {
    const findings = analyze(
      [
        "on: push",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8",
      ].join("\n"),
    );

    expect(findings.find((finding) => finding.id === "workflow.unpinned-action")).toBeUndefined();
  });

  test("reports a retired action version", () => {
    const findings = analyze(
      [
        "on: push",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/set-output@v1",
      ].join("\n"),
    );

    const deprecated = findings.find((finding) => finding.id === "workflow.deprecated-action");
    expect(deprecated).toBeDefined();
    expect(deprecated?.severity).toBe("high");
  });

  test("reports a privileged trigger that checks out the pull request head", () => {
    const findings = analyze(
      [
        "on:",
        "  pull_request_target:",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    steps:",
        "      - uses: actions/checkout@v4",
        "        with:",
        "          ref: ${{ github.event.pull_request.head.sha }}",
      ].join("\n"),
    );

    const privileged = findings.find((finding) => finding.id === "workflow.privileged-checkout");
    expect(privileged).toBeDefined();
    expect(privileged?.severity).toBe("critical");
  });

  test("reports secrets inherit on a reusable workflow call", () => {
    const findings = analyze(
      [
        "on: push",
        "jobs:",
        "  call:",
        "    uses: org/repo/.github/workflows/build.yml",
        "    secrets: inherit",
      ].join("\n"),
    );

    expect(findings.find((finding) => finding.id === "workflow.secrets-inherit")).toBeDefined();
  });

  test("reports a self-hosted runner", () => {
    const findings = analyze(
      ["on: push", "jobs:", "  build:", "    runs-on: self-hosted"].join("\n"),
    );

    expect(findings.find((finding) => finding.id === "workflow.self-hosted-runner")).toBeDefined();
  });

  test("ignores files that are not workflows", () => {
    const findings = analyzeWorkflow({
      file: "src/config.yml",
      content: "on:\n  pull_request_target:\njobs:\n  build:\n    runs-on: self-hosted\n",
    });
    expect(findings).toHaveLength(0);
  });

  test("reports invalid YAML instead of throwing", () => {
    const findings = analyze("on: push\njobs:\n  - broken: [unclosed\n");
    expect(findings.map((finding) => finding.id)).toEqual(["workflow.invalid-yaml"]);
  });
});
