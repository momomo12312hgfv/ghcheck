import { describe, expect, test } from "bun:test";
import { isIgnored, parseGitignore } from "../src/engine/gitignore";

describe("gitignore", () => {
  test("ignores a plain name at any level", () => {
    const rules = parseGitignore("dist");
    expect(isIgnored(rules, "dist")).toBe(true);
    expect(isIgnored(rules, "packages/app/dist")).toBe(true);
    expect(isIgnored(rules, "src/index.ts")).toBe(false);
  });

  test("ignores a directory pattern", () => {
    const rules = parseGitignore("build/");
    expect(isIgnored(rules, "build")).toBe(true);
    expect(isIgnored(rules, "build/out.js")).toBe(true);
  });

  test("ignores a glob", () => {
    const rules = parseGitignore("*.log");
    expect(isIgnored(rules, "debug.log")).toBe(true);
    expect(isIgnored(rules, "logs/debug.log")).toBe(true);
    expect(isIgnored(rules, "debug.txt")).toBe(false);
  });

  test("anchors a pattern that contains a slash", () => {
    const rules = parseGitignore("/docs");
    expect(isIgnored(rules, "docs")).toBe(true);
    expect(isIgnored(rules, "src/docs")).toBe(false);
  });

  test("supports double star", () => {
    const rules = parseGitignore("**/generated");
    expect(isIgnored(rules, "generated")).toBe(true);
    expect(isIgnored(rules, "a/b/generated")).toBe(true);
  });

  test("supports negation, last match wins", () => {
    const rules = parseGitignore("*.log\n!keep.log");
    expect(isIgnored(rules, "debug.log")).toBe(true);
    expect(isIgnored(rules, "keep.log")).toBe(false);
  });

  test("ignores comments and blank lines", () => {
    const rules = parseGitignore("# a comment\n\n");
    expect(rules).toHaveLength(0);
  });
});
