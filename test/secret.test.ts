import { describe, expect, test } from "bun:test";
import { analyzeSecretContent } from "../src/analyzers/secret";
import { looksLikePlaceholder } from "../src/analyzers/secret/rules";

function analyze(content: string) {
  return analyzeSecretContent({ file: "config.ts", content });
}

describe("secret rules", () => {
  test("finds a hardcoded classic GitHub token", () => {
    const findings = analyze('const token = "ghp_16C7e42F292c6912E7710c838347Ae178B4a";');
    expect(findings).toHaveLength(1);
    expect(findings[0]?.id).toBe("secret.github-token");
    expect(findings[0]?.severity).toBe("critical");
  });

  test("finds a hardcoded fine-grained GitHub token", () => {
    const findings = analyze('const token = "github_pat_11AQQz7Kp2Lm9Rt4Yw6Uc3Vb8Nx0Jq5Se7Gh1Z";');
    expect(findings.map((finding) => finding.id)).toEqual(["secret.github-fine-grained-token"]);
  });

  test("finds an AWS access key id", () => {
    const findings = analyze('AWS_KEY = "AKIA3XQ7PLMN2Z9JK4TB"');
    expect(findings.map((finding) => finding.id)).toContain("secret.aws-access-key-id");
  });

  test("ignores the AWS documentation example key", () => {
    const findings = analyze('AWS_KEY = "AKIAIOSFODNN7EXAMPLE"');
    expect(findings).toHaveLength(0);
  });

  test("finds a private key block", () => {
    const findings = analyze("-----BEGIN RSA PRIVATE KEY-----\nMIIEow==\n-----END RSA PRIVATE KEY-----");
    expect(findings.map((finding) => finding.id)).toContain("secret.private-key");
  });

  test("finds a database URL with an inline password", () => {
    const findings = analyze('const url = "postgres://admin:hunter2pass@db.internal:5432/app";');
    expect(findings.map((finding) => finding.id)).toContain("secret.database-url");
  });

  test("ignores obvious placeholders", () => {
    const findings = analyze('const token = "ghp_1234567890abcdefghijklmnopqrstuvwxyz";');
    expect(findings).toHaveLength(0);
  });

  test("ignores environment references", () => {
    const findings = analyze('const token = "ghp_" + process.env.TOKEN;');
    expect(findings).toHaveLength(0);
  });

  test("never returns the raw credential as evidence", () => {
    const findings = analyze('const token = "ghp_16C7e42F292c6912E7710c838347Ae178B4a";');
    const evidence = findings[0]?.evidence ?? "";
    expect(evidence).not.toContain("16C7e42F292c6912E7710c838347Ae178B4a");
    expect(evidence).toContain("redacted");
  });

  test("reports the line the credential is on", () => {
    const findings = analyze("line one\nline two\nconst token = \"ghp_16C7e42F292c6912E7710c838347Ae178B4a\";");
    expect(findings[0]?.location?.line).toBe(3);
  });

  test("does not report the same credential twice under two rules", () => {
    const findings = analyze('const token = "github_pat_11AQQz7Kp2Lm9Rt4Yw6Uc3Vb8Nx0Jq5Se7Gh1Z";');
    expect(findings).toHaveLength(1);
  });
});

describe("placeholder detection", () => {
  test("flags sequential and example values", () => {
    expect(looksLikePlaceholder("1234567890abcdef")).toBe(true);
    expect(looksLikePlaceholder("your-api-key-here")).toBe(true);
    expect(looksLikePlaceholder("xxxxxxxxxxxx")).toBe(true);
    expect(looksLikePlaceholder("test_token_value")).toBe(true);
  });

  test("keeps realistic values", () => {
    expect(looksLikePlaceholder("AKIA3XQ7PLMN2Z9JK4TB")).toBe(false);
    expect(looksLikePlaceholder("AKIAIOSFODNN7EXAMPLE")).toBe(true);
  });
});
