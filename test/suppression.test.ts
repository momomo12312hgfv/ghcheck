import { describe, expect, test } from "bun:test";
import { collectSuppressions, isSuppressed } from "../src/core/suppression";

describe("suppression", () => {
  test("suppresses a rule on the line the comment sits on", () => {
    const suppression = collectSuppressions(
      'run: echo "${{ github.event.pull_request.title }}" # ghcheck: ignore workflow.script-injection',
    );

    expect(isSuppressed(suppression, "workflow.script-injection", 1)).toBe(true);
    expect(isSuppressed(suppression, "workflow.unpinned-action", 1)).toBe(false);
    expect(isSuppressed(suppression, "workflow.script-injection", 2)).toBe(false);
  });

  test("suppresses several rules at once", () => {
    const suppression = collectSuppressions(
      "# ghcheck: ignore workflow.script-injection, workflow.unpinned-action",
    );

    expect(isSuppressed(suppression, "workflow.script-injection", 1)).toBe(true);
    expect(isSuppressed(suppression, "workflow.unpinned-action", 1)).toBe(true);
    expect(isSuppressed(suppression, "workflow.deprecated-action", 1)).toBe(false);
  });

  test("suppresses every rule on a line with ignore-all", () => {
    const suppression = collectSuppressions("# ghcheck: ignore-all");
    expect(isSuppressed(suppression, "anything", 1)).toBe(true);
  });

  test("suppresses the whole file with ignore-file", () => {
    const suppression = collectSuppressions("# ghcheck: ignore-file");
    expect(isSuppressed(suppression, "anything", 1)).toBe(true);
    expect(isSuppressed(suppression, "anything", 99)).toBe(true);
    expect(isSuppressed(suppression, "anything", undefined)).toBe(true);
  });

  test("does not suppress when there is no comment", () => {
    const suppression = collectSuppressions("run: echo hello");
    expect(isSuppressed(suppression, "workflow.script-injection", 1)).toBe(false);
  });

  test("accepts the comment marker of every dialect", () => {
    for (const marker of ["#", "//", "/*", "--"]) {
      const suppression = collectSuppressions(`${marker} ghcheck: ignore workflow.script-injection`);
      expect(isSuppressed(suppression, "workflow.script-injection", 1)).toBe(true);
    }
  });

  test("accepts a suppression in a TypeScript line comment", () => {
    const suppression = collectSuppressions(
      'const token = "ghp_example"; // ghcheck: ignore secret.github-token',
    );
    expect(isSuppressed(suppression, "secret.github-token", 1)).toBe(true);
    expect(isSuppressed(suppression, "secret.aws-access-key-id", 1)).toBe(false);
  });
});
