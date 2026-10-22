import { describe, expect, test } from "bun:test";
import {
  CAPABILITY_DEFINITIONS,
  mergeCapabilities,
  resolveCapabilities,
  resolveCapabilitiesFromPermissions,
} from "../src/analyzers/token/capabilities";
import { capabilityFindingId, capabilitiesToFindings } from "../src/analyzers/token/capability-findings";
import { parsePermissionInput } from "../src/analyzers/token/permissions";
import { SCOPE_DEFINITIONS } from "../src/analyzers/token/scopes";
import { scanTokenContext } from "../src/analyzers/token/scan";

describe("scope matrix", () => {
  test("knows the classic scopes", () => {
    expect(SCOPE_DEFINITIONS.repo).toBeDefined();
    expect(SCOPE_DEFINITIONS.delete_repo?.severity).toBe("critical");
    expect(SCOPE_DEFINITIONS.workflow?.severity).toBe("high");
  });

  test("resolves a scope into capabilities", () => {
    const capabilities = resolveCapabilities(["repo"]);
    const ids = capabilities.map((capability) => capability.id);

    expect(ids).toContain("code:write");
    expect(ids).toContain("repo:admin");
    expect(ids).toContain("secrets:manage");
  });

  test("ignores unknown scopes", () => {
    expect(resolveCapabilities(["not-a-scope"])).toHaveLength(0);
  });

  test("records which scope granted a capability", () => {
    const capabilities = resolveCapabilities(["repo"]);
    const code = capabilities.find((capability) => capability.id === "code:write");
    expect(code?.matchedScopes).toEqual(["repo"]);
  });
});

describe("permission matrix", () => {
  test("parses a permission list", () => {
    const parsed = parsePermissionInput("repo.contents=write,repo.metadata=read");
    expect(parsed.errors).toHaveLength(0);
    expect(parsed.grants).toHaveLength(2);
  });

  test("rejects an unknown permission", () => {
    const parsed = parsePermissionInput("repo.not_a_permission=write");
    expect(parsed.errors.length).toBeGreaterThan(0);
  });

  test("resolves a write permission into write capabilities", () => {
    const capabilities = resolveCapabilitiesFromPermissions([
      { permission: "repo.contents", access: "write" },
    ]);
    const ids = capabilities.map((capability) => capability.id);

    expect(ids).toContain("code:write");
    expect(ids).not.toContain("secrets:manage");
  });

  test("every capability in the matrix is reachable from some scope or permission", () => {
    for (const capability of CAPABILITY_DEFINITIONS) {
      const reachable =
        capability.scopes.length > 0 || capability.permissions.length > 0;
      expect(reachable).toBe(true);
    }
  });
});

describe("capability findings", () => {
  test("turns a capability into a finding with a stable id", () => {
    const findings = capabilitiesToFindings(resolveCapabilities(["delete_repo"]));
    const finding = findings.find((item) => item.id === "token.capability.repo.delete");

    expect(finding).toBeDefined();
    expect(finding?.severity).toBe("critical");
    expect(finding?.analyzer).toBe("token");
    expect(finding?.grantedBy).toEqual(["delete_repo"]);
  });

  test("replaces the colon in a capability id with a dot", () => {
    expect(capabilityFindingId("code:read")).toBe("token.capability.code.read");
  });

  test("merges scopes and permissions into one capability list", () => {
    const merged = mergeCapabilities(
      resolveCapabilities(["workflow"]),
      resolveCapabilitiesFromPermissions([{ permission: "repo.workflows", access: "write" }]),
    );
    const workflow = merged.find((capability) => capability.id === "workflow:write");

    expect(workflow?.matchedScopes).toContain("workflow");
    expect(workflow?.matchedScopes?.some((item) => item.includes("repo.workflows"))).toBe(true);
  });
});

describe("token scan", () => {
  test("produces findings from self reported scopes", async () => {
    const result = await scanTokenContext({ scopes: ["repo", "workflow"] });

    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.scoreKnown).toBe(true);
    expect(result.scopes).toEqual(["repo", "workflow"]);
  });

  test("warns when nothing is known about the token", async () => {
    const result = await scanTokenContext({});
    expect(result.findings).toHaveLength(0);
    expect(result.scoreKnown).toBe(false);
    expect(result.warnings.join(" ")).toContain("No scopes or permissions");
  });

  test("warns about unknown permissions", async () => {
    const result = await scanTokenContext({
      permissions: [{ permission: "repo.nope", access: "write" }],
    });
    expect(result.warnings.join(" ")).toContain("Unknown permissions");
  });

  test("warns that fine-grained permissions are self reported", async () => {
    const result = await scanTokenContext({
      tokenType: "fine-grained-pat",
      permissions: [{ permission: "repo.contents", access: "write" }],
    });
    expect(result.warnings.join(" ")).toContain("self-reported");
  });
});
