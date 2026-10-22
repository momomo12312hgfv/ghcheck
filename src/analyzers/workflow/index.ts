import {
  lineOfOffset,
  mapEntries,
  nodeEnd,
  nodeOffset,
  parseYamlDocument,
  scalarText,
  seqItems,
} from "../../core/yaml";
import type { Analyzer, AnalyzerContext, Finding, RuleDefinition } from "../../core/types";
import { DANGEROUS_TRIGGERS, DEPRECATED_ACTIONS, INDIRECT_INPUTS, UNTRUSTED_INPUTS } from "./rules";

const SHA_PATTERN = /^[0-9a-f]{40}$/i;
const EXPRESSION_PATTERN = /\$\{\{([^}]*)\}\}/g;
const MAX_INJECTION_FINDINGS_PER_STEP = 3;

const RULES: RuleDefinition[] = [
  {
    id: "workflow.invalid-yaml",
    title: "Workflow file is not valid YAML",
    severity: "medium",
    description: "The workflow could not be parsed, so none of the workflow checks could run against it.",
    remediation: "Fix the YAML syntax. `actionlint` reports the exact line.",
  },
  {
    id: "workflow.script-injection",
    title: "Untrusted input is interpolated into a shell command",
    severity: "critical",
    description:
      "A `run:` step interpolates attacker-controlled text through `${{ }}`. Anyone who can open a pull request or an issue can run code in this job.",
    remediation:
      "Pass the value through an environment variable and quote it: set `env: TITLE: ${{ github.event.pull_request.title }}` and use `\"$TITLE\"` in the script.",
  },
  {
    id: "workflow.indirect-interpolation",
    title: "A value produced elsewhere is interpolated into a shell command",
    severity: "medium",
    description:
      "A step output, a matrix value or a workflow input is inserted into a shell command. The value is not attacker-controlled by itself, but if the step that produced it handled attacker data, this is code execution.",
    remediation:
      "Pass the value through an environment variable and quote it, for example `env: VALUE: ${{ steps.build.outputs.value }}` and use `\"$VALUE\"` in the script.",
  },
  {
    id: "workflow.privileged-checkout",
    title: "Privileged trigger checks out attacker-controlled code",
    severity: "critical",
    description:
      "This workflow runs on a privileged trigger and then checks out code the attacker controls, so that code executes with the job's secrets and token.",
    remediation:
      "Do not check out the pull request head in a privileged workflow, or drop the job's privileges before checking out.",
  },
  {
    id: "workflow.dangerous-trigger",
    title: "Workflow uses a privileged trigger",
    severity: "high",
    description: "This trigger runs the workflow with repository secrets and a writable GITHUB_TOKEN.",
    remediation:
      "Use `pull_request` for untrusted code, and keep `pull_request_target` for workflows that never check out the pull request head.",
  },
  {
    id: "workflow.unpinned-action",
    title: "Action is not pinned to a commit SHA",
    severity: "medium",
    description:
      "The action is referenced by tag or branch, so the code that runs can change without any commit to this repository.",
    remediation: "Pin the action to a full commit SHA and keep the version in a trailing comment.",
  },
  {
    id: "workflow.deprecated-action",
    title: "Action version is retired",
    severity: "medium",
    description: "This action version no longer runs on current GitHub infrastructure.",
    remediation: "Upgrade the action to its current major version.",
  },
  {
    id: "workflow.secrets-inherit",
    title: "Reusable workflow inherits every secret",
    severity: "high",
    description:
      "`secrets: inherit` hands the called workflow every secret of the caller, including the ones it does not need.",
    remediation: "Pass only the secrets the called workflow needs.",
  },
  {
    id: "workflow.self-hosted-runner",
    title: "Job runs on a self-hosted runner",
    severity: "medium",
    description:
      "Self-hosted runners are not ephemeral, so code from a pull request can leave files and processes behind.",
    remediation: "Use GitHub-hosted runners for untrusted workflows, or isolate the runner between jobs.",
  },
  {
    id: "workflow.docker-unpinned",
    title: "Container image is not pinned",
    severity: "low",
    description: "The container image can change between runs, so the same workflow can behave differently tomorrow.",
    remediation: "Pin the image to a digest.",
  },
];

function isWorkflowPath(file: string): boolean {
  const normalized = file.replace(/\\/g, "/");
  return /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(normalized);
}

interface TriggerInfo {
  name: string;
  offset: number;
}

function collectTriggers(onNode: unknown): TriggerInfo[] {
  const triggers: TriggerInfo[] = [];

  const single = scalarText(onNode as never);
  if (single) {
    triggers.push({ name: single, offset: nodeOffset(onNode as never) ?? 0 });
    return triggers;
  }

  for (const entry of mapEntries(onNode as never)) {
    triggers.push({ name: entry.key, offset: nodeOffset(entry.keyNode) ?? 0 });
  }

  for (const item of seqItems(onNode as never)) {
    const text = scalarText(item);
    if (text) triggers.push({ name: text, offset: nodeOffset(item) ?? 0 });
  }

  return triggers;
}

export function analyzeWorkflow(context: AnalyzerContext): Finding[] {
  const { content, file } = context;
  const findings: Finding[] = [];

  if (!isWorkflowPath(file)) return findings;

  const doc = parseYamlDocument(content);
  if (doc.errors.length > 0) {
    const first = doc.errors[0];
    findings.push({
      id: "workflow.invalid-yaml",
      analyzer: "workflow",
      severity: "medium",
      title: "Workflow file is not valid YAML",
      description: `The workflow could not be parsed, so no workflow check ran against it. ${first?.message ?? ""}`.trim(),
      location: { file, line: 1 },
      remediation: "Fix the YAML syntax. `actionlint` reports the exact line.",
    });
    return findings;
  }

  const root = doc.contents;
  const rootEntries = mapEntries(root);
  const onEntry = rootEntries.find((entry) => entry.key === "on");
  const triggers = collectTriggers(onEntry?.value);
  const triggerNames = triggers.map((trigger) => trigger.name);

  for (const trigger of triggers) {
    const info = DANGEROUS_TRIGGERS[trigger.name];
    if (!info) continue;
    findings.push({
      id: "workflow.dangerous-trigger",
      analyzer: "workflow",
      severity: info.severity,
      title: `Workflow uses the privileged trigger "${trigger.name}"`,
      description: info.note,
      location: { file, line: lineOfOffset(content, trigger.offset) },
      evidence: `on: ${trigger.name}`,
      remediation:
        "Use `pull_request` for untrusted code, and keep `pull_request_target` for workflows that never check out the pull request head.",
    });
  }

  const privileged = triggerNames.some((name) => name === "pull_request_target" || name === "workflow_run");
  const jobsEntry = rootEntries.find((entry) => entry.key === "jobs");
  const jobEntries = mapEntries(jobsEntry?.value);

  for (const job of jobEntries) {
    const jobMap = mapEntries(job.value);

    const runsOnEntry = jobMap.find((entry) => entry.key === "runs-on");
    const runsOnText = scalarText(runsOnEntry?.value) ?? "";
    const runsOnList = seqItems(runsOnEntry?.value).map((item) => scalarText(item) ?? "");
    const selfHosted = [runsOnText, ...runsOnList].some((value) => value.includes("self-hosted"));
    if (selfHosted) {
      findings.push({
        id: "workflow.self-hosted-runner",
        analyzer: "workflow",
        severity: "medium",
        title: `Job "${job.key}" runs on a self-hosted runner`,
        description:
          "Self-hosted runners are not ephemeral, so code from a pull request can leave files and processes behind.",
        location: { file, line: lineOfOffset(content, nodeOffset(runsOnEntry?.keyNode) ?? 0) },
        evidence: `runs-on: ${runsOnText || runsOnList.join(", ")}`,
        remediation: "Use GitHub-hosted runners for untrusted workflows, or isolate the runner between jobs.",
      });
    }

    const jobUsesEntry = jobMap.find((entry) => entry.key === "uses");
    const secretsEntry = jobMap.find((entry) => entry.key === "secrets");
    if (jobUsesEntry && secretsEntry) {
      const inherits =
        scalarText(secretsEntry.value) === "inherit" ||
        mapEntries(secretsEntry.value).some((entry) => entry.key === "inherit");
      if (inherits) {
        findings.push({
          id: "workflow.secrets-inherit",
          analyzer: "workflow",
          severity: "high",
          title: `Job "${job.key}" passes every secret to a reusable workflow`,
          description:
            "`secrets: inherit` hands the called workflow every secret of the caller, including the ones it does not need.",
          location: { file, line: lineOfOffset(content, nodeOffset(secretsEntry.keyNode) ?? 0) },
          evidence: "secrets: inherit",
          remediation: "Pass only the secrets the called workflow needs.",
        });
      }
    }

    const stepsEntry = jobMap.find((entry) => entry.key === "steps");
    for (const step of seqItems(stepsEntry?.value)) {
      const stepMap = mapEntries(step);
      const usesEntry = stepMap.find((entry) => entry.key === "uses");
      const runEntry = stepMap.find((entry) => entry.key === "run");
      const withEntry = stepMap.find((entry) => entry.key === "with");

      if (usesEntry) {
        const uses = scalarText(usesEntry.value) ?? "";
        const usesOffset = nodeOffset(usesEntry.value) ?? nodeOffset(usesEntry.keyNode) ?? 0;
        const usesLine = lineOfOffset(content, usesOffset);

        if (uses.startsWith("docker://")) {
          const image = uses.slice("docker://".length);
          const pinned = image.includes("@sha256:");
          if (!pinned) {
            findings.push({
              id: "workflow.docker-unpinned",
              analyzer: "workflow",
              severity: "low",
              title: "Container image is not pinned",
              description:
                "The container image can change between runs, so the same workflow can behave differently tomorrow.",
              location: { file, line: usesLine },
              evidence: uses,
              remediation: "Pin the image to a digest.",
            });
          }
        } else if (!uses.startsWith("./")) {
          const atIndex = uses.lastIndexOf("@");
          const ref = atIndex === -1 ? null : uses.slice(atIndex + 1);

          if (ref === null || !SHA_PATTERN.test(ref)) {
            findings.push({
              id: "workflow.unpinned-action",
              analyzer: "workflow",
              severity: "medium",
              title: "Action is not pinned to a commit SHA",
              description:
                "The action is referenced by tag or branch, so the code that runs can change without any commit to this repository.",
              location: { file, line: usesLine },
              evidence: uses,
              remediation: "Pin the action to a full commit SHA and keep the version in a trailing comment.",
            });
          }

          const deprecated = DEPRECATED_ACTIONS.find((entry) => entry.pattern.test(uses));
          if (deprecated) {
            findings.push({
              id: "workflow.deprecated-action",
              analyzer: "workflow",
              severity: deprecated.severity,
              title: `Action "${uses}" is retired`,
              description: deprecated.note,
              location: { file, line: usesLine },
              evidence: uses,
              remediation: "Upgrade the action to its current major version.",
            });
          }
        }
      }

      if (runEntry) {
        const start = nodeOffset(runEntry.value);
        const end = nodeEnd(runEntry.value);
        if (start !== null && end !== null) {
          const slice = content.slice(start, end);
          let reported = 0;
          EXPRESSION_PATTERN.lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = EXPRESSION_PATTERN.exec(slice)) !== null) {
            const expression = match[1] ?? "";
            const absolute = start + match.index;
            const direct = UNTRUSTED_INPUTS.find((input) => input.pattern.test(expression));
            const indirect = direct
              ? undefined
              : INDIRECT_INPUTS.find((input) => input.pattern.test(expression));

            const source = direct ?? indirect;
            if (!source) continue;

            reported += 1;
            if (reported > MAX_INJECTION_FINDINGS_PER_STEP) break;

            const isDirect = direct !== undefined;
            findings.push({
              id: isDirect ? "workflow.script-injection" : "workflow.indirect-interpolation",
              analyzer: "workflow",
              severity: source.severity,
              title: isDirect
                ? "Untrusted input is interpolated into a shell command"
                : "A value produced elsewhere is interpolated into a shell command",
              description: isDirect
                ? `The ${source.label} is attacker-controlled and is inserted into a shell command without quoting.`
                : `The ${source.label} is inserted into a shell command without quoting. It becomes code execution if the step that produced it handled attacker data.`,
              location: { file, line: lineOfOffset(content, absolute) },
              evidence: "${{ " + expression.trim() + " }}",
              remediation: isDirect
                ? "Pass the value through an environment variable and quote it: set `env: TITLE: ${{ github.event.pull_request.title }}` and use `\"$TITLE\"` in the script."
                : "Pass the value through an environment variable and quote it: set `env: VALUE: ${{ steps.build.outputs.value }}` and use `\"$VALUE\"` in the script.",
            });
          }
        }
      }

      if (privileged && usesEntry) {
        const uses = scalarText(usesEntry.value) ?? "";
        if (uses.startsWith("actions/checkout")) {
          const refEntry = mapEntries(withEntry?.value).find((entry) => entry.key === "ref");
          const ref = scalarText(refEntry?.value) ?? "";
          const attackerControlled =
            /github\.event\.pull_request\.head/.test(ref) || /github\.head_ref/.test(ref);
          if (attackerControlled) {
            findings.push({
              id: "workflow.privileged-checkout",
              analyzer: "workflow",
              severity: "critical",
              title: "Privileged trigger checks out attacker-controlled code",
              description:
                "This workflow runs on a privileged trigger and checks out the pull request head, so attacker code executes with the job's secrets and token.",
              location: {
                file,
                line: lineOfOffset(content, nodeOffset(refEntry?.value) ?? nodeOffset(usesEntry.value) ?? 0),
              },
              evidence: ref,
              remediation:
                "Do not check out the pull request head in a privileged workflow, or drop the job's privileges before checking out.",
            });
          }
        }
      }
    }
  }

  return findings;
}

export const workflowAnalyzer: Analyzer = {
  id: "workflow",
  name: "Workflow auditor",
  description:
    "Audits GitHub Actions workflows for script injection, privileged triggers, unpinned and retired actions, and secret inheritance.",
  rules: RULES,
  analyze: analyzeWorkflow,
};
