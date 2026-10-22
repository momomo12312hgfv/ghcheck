import { describe, expect, test } from "bun:test";
import { analyzeToken } from "../src/analyzers/token";

const FILE = ".github/workflows/ci.yml";

function analyze(content: string) {
  return analyzeToken({ file: FILE, content });
}

describe("token analyzer", () => {
  test("reports write-all permissions as critical", () => {
    const findings = analyze(
      ["on: push", "permissions: write-all", "jobs:", "  build:", "    runs-on: ubuntu-latest"].join("\n"),
    );

    const writeAll = findings.find((finding) => finding.id === "token.write-all-permissions");
    expect(writeAll).toBeDefined();
    expect(writeAll?.severity).toBe("critical");
  });

  test("reports a write permission with the capability it grants", () => {
    const findings = analyze(
      [
        "on: push",
        "permissions:",
        "  contents: write",
        "  metadata: read",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
      ].join("\n"),
    );

    const contents = findings.find((finding) => finding.id === "token.write-permission-contents");
    expect(contents).toBeDefined();
    expect(contents?.severity).toBe("high");
    expect(contents?.grantedBy).toEqual(["GITHUB_TOKEN contents=write"]);
  });

  test("does not report read permissions", () => {
    const findings = analyze(
      [
        "on: push",
        "permissions:",
        "  contents: read",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
      ].join("\n"),
    );

    expect(findings).toHaveLength(0);
  });

  test("reports a job that declares no permissions", () => {
    const findings = analyze(
      ["on: push", "jobs:", "  build:", "    runs-on: ubuntu-latest"].join("\n"),
    );

    const missing = findings.find((finding) => finding.id === "token.permissions-not-declared");
    expect(missing).toBeDefined();
    expect(missing?.severity).toBe("medium");
  });

  test("a job level permissions block overrides the workflow level", () => {
    const findings = analyze(
      [
        "on: push",
        "permissions:",
        "  contents: write",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
        "    permissions:",
        "      contents: read",
        "  release:",
        "    runs-on: ubuntu-latest",
      ].join("\n"),
    );

    const contents = findings.find((finding) => finding.id === "token.write-permission-contents");
    expect(contents).toBeDefined();
    expect(contents?.title).toContain('Job "release"');
  });

  test("treats administration write as critical", () => {
    const findings = analyze(
      [
        "on: push",
        "permissions:",
        "  administration: write",
        "jobs:",
        "  build:",
        "    runs-on: ubuntu-latest",
      ].join("\n"),
    );

    const administration = findings.find(
      (finding) => finding.id === "token.write-permission-administration",
    );
    expect(administration?.severity).toBe("critical");
  });
});
