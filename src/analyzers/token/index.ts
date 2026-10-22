import { lineOfOffset, mapEntries, nodeOffset, parseYamlDocument, scalarText } from "../../core/yaml";
import type { Analyzer, AnalyzerContext, Finding, RuleDefinition, Severity } from "../../core/types";

interface PermissionCapability {
  title: string;
  severity: Severity;
  description: string;
}

/**
 * What a writable GITHUB_TOKEN permission actually buys an attacker.
 * Mirrors the capability model patscope already uses for personal tokens.
 */
export const PERMISSION_CAPABILITIES: Record<string, PermissionCapability> = {
  administration: {
    title: "change repository settings",
    severity: "critical",
    description:
      "Can rename the repository, change its visibility, delete it and manage every other setting.",
  },
  contents: {
    title: "read and write repository contents",
    severity: "high",
    description:
      "Can push commits, rewrite branches, publish releases and edit the code the workflow protects.",
  },
  workflows: {
    title: "modify CI workflows",
    severity: "high",
    description:
      "Can add or change workflow files, which is code execution on every future run of this repository.",
  },
  actions: {
    title: "manage actions, runners and workflow runs",
    severity: "high",
    description: "Can rerun or cancel runs and register new runners for the repository.",
  },
  id_token: {
    title: "mint OIDC tokens for cloud providers",
    severity: "high",
    description:
      "Can request a signed identity token that cloud providers accept as a login, which is a path to the deployment account.",
  },
  packages: {
    title: "publish and delete packages",
    severity: "medium",
    description: "Can publish packages under the repository's namespace and remove existing ones.",
  },
  security_events: {
    title: "upload code scanning results",
    severity: "medium",
    description: "Can publish code scanning results, so alerts can be silenced.",
  },
  attestations: {
    title: "write artifact attestations",
    severity: "medium",
    description: "Can sign build provenance statements for this repository.",
  },
  pages: {
    title: "publish GitHub Pages",
    severity: "medium",
    description: "Can deploy a new version of the site.",
  },
  pull_requests: {
    title: "write pull requests",
    severity: "low",
    description: "Can open and edit pull requests, including on protected branches.",
  },
  issues: {
    title: "write issues",
    severity: "low",
    description: "Can create and edit issues.",
  },
  deployments: {
    title: "create deployments",
    severity: "low",
    description: "Can create deployments and move the repository's production environment.",
  },
  repository_projects: {
    title: "write project boards",
    severity: "low",
    description: "Can edit the project boards of this repository.",
  },
};

const RULES: RuleDefinition[] = [
  {
    id: "token.write-all-permissions",
    title: "GITHUB_TOKEN is granted every permission",
    severity: "critical",
    description:
      "`permissions: write-all` gives the job a token that can change anything the repository can change.",
    remediation: "List the permissions the job actually needs instead of `write-all`.",
  },
  {
    id: "token.permissions-not-declared",
    title: "GITHUB_TOKEN permissions are not declared",
    severity: "medium",
    description:
      "The job does not declare `permissions:`, so the token gets whatever the repository default is. On older repositories that default still includes write access.",
    remediation: "Declare `permissions:` explicitly on the workflow or on every job.",
  },
  {
    id: "token.write-permission",
    title: "GITHUB_TOKEN has a write permission",
    severity: "high",
    description: "A write permission on GITHUB_TOKEN turns a compromised step into repository access.",
    remediation: "Drop the permission, or split the job so that the write step runs separately.",
  },
];

function isWorkflowPath(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized);
}

interface PermissionNode {
  kind: "none" | "write-all" | "read-all" | "map";
  entries: Array<{ name: string; access: string; offset: number }>;
  offset: number;
}

function readPermissions(node: unknown): PermissionNode {
  const text = scalarText(node as never);

  if (text === "write-all") {
    return { kind: "write-all", entries: [], offset: nodeOffset(node as never) ?? 0 };
  }
  if (text === "read-all") {
    return { kind: "read-all", entries: [], offset: nodeOffset(node as never) ?? 0 };
  }
  if (text !== null) {
    return { kind: "none", entries: [], offset: nodeOffset(node as never) ?? 0 };
  }

  const entries = mapEntries(node as never).map((entry) => ({
    name: entry.key,
    access: (scalarText(entry.value) ?? "read").toLowerCase(),
    offset: nodeOffset(entry.keyNode) ?? 0,
  }));

  return { kind: "map", entries, offset: nodeOffset(node as never) ?? 0 };
}

export function analyzeToken(context: AnalyzerContext): Finding[] {
  const { content, file } = context;
  const findings: Finding[] = [];

  if (!isWorkflowPath(file)) return findings;

  const doc = parseYamlDocument(content);
  if (doc.errors.length > 0) return findings;

  const root = doc.contents;
  const rootEntries = mapEntries(root);
  const workflowPermissionsEntry = rootEntries.find((entry) => entry.key === "permissions");
  const workflowPermissions = workflowPermissionsEntry
    ? readPermissions(workflowPermissionsEntry.value)
    : { kind: "none" as const, entries: [], offset: 0 };

  const jobsEntry = rootEntries.find((entry) => entry.key === "jobs");
  const jobEntries = mapEntries(jobsEntry?.value);

  const reportWriteAll = (offset: number, scope: string) => {
    findings.push({
      id: "token.write-all-permissions",
      analyzer: "token",
      severity: "critical",
      title: `${scope} grants GITHUB_TOKEN every permission`,
      description:
        "`permissions: write-all` gives the job a token that can change anything the repository can change.",
      location: { file, line: lineOfOffset(content, offset) },
      evidence: "permissions: write-all",
      remediation: "List the permissions the job actually needs instead of `write-all`.",
    });
  };

  const reportWritePermission = (
    name: string,
    access: string,
    offset: number,
    scope: string,
  ) => {
    const capability = PERMISSION_CAPABILITIES[name];
    if (!capability) return;

    findings.push({
      id: `token.write-permission-${name.replace(/_/g, "-")}`,
      analyzer: "token",
      severity: capability.severity,
      title: `${scope} can ${capability.title}`,
      description: capability.description,
      location: { file, line: lineOfOffset(content, offset) },
      evidence: `${name}: ${access}`,
      grantedBy: [`GITHUB_TOKEN ${name}=${access}`],
      remediation: "Drop the permission, or split the job so that the write step runs separately.",
    });
  };

  if (workflowPermissions.kind === "write-all") {
    reportWriteAll(workflowPermissions.offset, "This workflow");
  }

  for (const job of jobEntries) {
    const jobMap = mapEntries(job.value);
    const jobPermissionsEntry = jobMap.find((entry) => entry.key === "permissions");
    const jobOffset = nodeOffset(job.keyNode) ?? 0;
    const jobLabel = `Job "${job.key}"`;

    if (!jobPermissionsEntry) {
      if (workflowPermissions.kind === "none") {
        findings.push({
          id: "token.permissions-not-declared",
          analyzer: "token",
          severity: "medium",
          title: `${jobLabel} does not declare GITHUB_TOKEN permissions`,
          description:
            "The job does not declare `permissions:`, so the token gets whatever the repository default is. On older repositories that default still includes write access.",
          location: { file, line: lineOfOffset(content, jobOffset) },
          remediation: "Declare `permissions:` explicitly on the workflow or on every job.",
        });
        continue;
      }

      if (workflowPermissions.kind === "write-all") continue;

      for (const entry of workflowPermissions.entries) {
        if (entry.access !== "write") continue;
        reportWritePermission(entry.name, entry.access, entry.offset, jobLabel);
      }
      continue;
    }

    const jobPermissions = readPermissions(jobPermissionsEntry.value);
    const scope = jobLabel;

    if (jobPermissions.kind === "write-all") {
      reportWriteAll(jobPermissions.offset, scope);
      continue;
    }

    for (const entry of jobPermissions.entries) {
      if (entry.access !== "write") continue;
      reportWritePermission(entry.name, entry.access, entry.offset, scope);
    }
  }

  return findings;
}

export const tokenAnalyzer: Analyzer = {
  id: "token",
  name: "Token capability analyzer",
  description:
    "Works out what the GITHUB_TOKEN of each job can do, and reports every write permission it is granted.",
  rules: RULES,
  analyze: analyzeToken,
};
