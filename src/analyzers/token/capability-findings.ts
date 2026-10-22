import type { Finding } from "../../core/types";
import type { Capability } from "./types";

/**
 * Capability ids use a colon (`code:read`). Finding ids use dots, so the
 * colon becomes a dot: `token.capability.code.read`.
 */
export function capabilityFindingId(capabilityId: string): string {
  return `token.capability.${capabilityId.replace(/[:.]/g, ".")}`;
}

const REMEDIATION: Record<string, string> = {
  repository:
    "Drop the scope or permission that grants this and use a token that only covers the repositories you work on.",
  actions:
    "Drop the scope or permission that grants this. Workflow and runner access turns a leaked token into code execution.",
  organization:
    "Drop the scope or permission that grants this. Organization access reaches repositories you cannot see from this repository.",
  enterprise:
    "Drop the scope or permission that grants this. Enterprise access reaches every organization in the enterprise.",
  packages:
    "Drop the scope or permission that grants this. Package write access is a supply chain risk.",
  identity:
    "Drop the scope or permission that grants this. Key and token management is persistent access.",
  hooks:
    "Drop the scope or permission that grants this. Webhooks can exfiltrate repository events to an external endpoint.",
  account: "Drop the scope or permission that grants this. It is not needed for most day to day work.",
  projects: "Drop the scope or permission that grants this.",
  codespaces: "Drop the scope or permission that grants this. Codespaces can contain repository credentials.",
  copilot: "Drop the scope or permission that grants this.",
};

export function capabilitiesToFindings(capabilities: Capability[]): Finding[] {
  return capabilities.map((capability) => ({
    id: capabilityFindingId(capability.id),
    analyzer: "token",
    severity: capability.severity,
    title: capability.title,
    description: capability.description,
    grantedBy: capability.matchedScopes,
    remediation:
      REMEDIATION[capability.category] ??
      "Drop the scope or permission that grants this capability.",
  }));
}
