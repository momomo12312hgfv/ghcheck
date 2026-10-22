import { classifyAgentFile } from "../../core/agent-files";
import { buildLineOffsets, lineAt } from "../../core/lines";
import { parseJsonc } from "../../core/jsonc";
import { redactMatch } from "../../core/redact";
import type { Analyzer, AnalyzerContext, Finding } from "../../core/types";
import { SECRET_RULES, looksLikePlaceholder } from "../secret/rules";
import { AGENT_RULES } from "./rules";

export { classifyAgentFile } from "../../core/agent-files";
export type { AgentFileKind } from "../../core/agent-files";

/**
 * Finds the line of a literal inside the raw file.
 *
 * The MCP configuration is parsed for its structure, but the structure is
 * thrown away afterwards: what a report needs is the line a human has to
 * open. Every rule keeps its own locator so the same text can be reported by
 * two different rules at the same line, while one rule never reports the same
 * occurrence twice.
 */
class Locator {
  private readonly offsets: number[];
  private readonly claimed: Array<{ start: number; end: number }> = [];

  constructor(private readonly content: string) {
    this.offsets = buildLineOffsets(content);
  }

  /**
   * Finds the line a literal sits on.
   *
   * The quoted form is tried first: a bare `/` appears in every path in the
   * file, while `"/"` appears only where the value really is. The raw form is
   * the fallback for files that are not JSON.
   */
  lineOf(needle: string): number | null {
    if (!needle) return null;

    const quoted = this.find(`"${needle}"`);
    if (quoted !== null) return quoted;
    return this.find(needle);
  }

  private find(needle: string): number | null {
    let from = 0;
    while (from <= this.content.length) {
      const index = this.content.indexOf(needle, from);
      if (index === -1) return null;

      const end = index + needle.length;
      if (!this.claimed.some((claim) => index < claim.end && end > claim.start)) {
        this.claimed.push({ start: index, end });
        return lineAt(this.offsets, index);
      }
      from = index + 1;
    }

    return null;
  }
}

interface McpServer {
  name: string;
  command?: string;
  args: string[];
  env: Array<[string, string]>;
  headers: Array<[string, string]>;
  url?: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asEntries(value: unknown): Array<[string, string]> {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([key, entry]) => [key, asString(entry) ?? ""] as [string, string])
    .filter(([, entry]) => entry.length > 0);
}

function asArgs(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => (typeof entry === "string" ? entry : ""));
}

function normalizeServer(name: string, raw: Record<string, unknown>): McpServer {
  return {
    name,
    command: asString(raw.command),
    args: asArgs(raw.args),
    env: asEntries(raw.env),
    headers: asEntries(raw.headers),
    url: asString(raw.url),
  };
}

/** Reads the server map out of the several shapes editors write. */
export function extractServers(value: unknown): McpServer[] {
  if (!value || typeof value !== "object") return [];

  const root = value as Record<string, unknown>;
  const servers: McpServer[] = [];

  for (const section of ["mcpServers", "servers", "mcp"]) {
    const entries = root[section];
    if (!entries || typeof entries !== "object") continue;

    for (const [name, entry] of Object.entries(entries as Record<string, unknown>)) {
      if (!entry || typeof entry !== "object") continue;
      servers.push(normalizeServer(name, entry as Record<string, unknown>));
    }
  }

  return servers;
}

const RUNNER_COMMANDS = new Set(["npx", "bunx", "uvx", "pnpx"]);
const SHELL_COMMANDS = new Set([
  "sh",
  "bash",
  "zsh",
  "dash",
  "cmd",
  "cmd.exe",
  "powershell",
  "pwsh",
]);

const BYPASS_FLAGS = [
  "--dangerously-skip-permissions",
  "--yolo",
  "--allow-all",
  "--no-sandbox",
  "--unsafe-permissions",
  "--full-auto",
];

const SECRET_NAME_PATTERN = /(TOKEN|SECRET|PASSWORD|PASSWD|API_?KEY|PRIVATE_?KEY|CREDENTIAL|ACCESS_?KEY|AUTH)/i;

const URL_USERINFO_PATTERN = /^[a-z][a-z0-9+.-]*:\/\/([^/\s:@]+):([^/\s@]+)@/i;
const URL_SECRET_QUERY_PATTERN = /[?&](token|access_token|api_key|apikey|key|secret|password|pwd)=([^&\s]+)/i;

const BROAD_PATHS = new Set(["/", "~", "$HOME", "${HOME}", "%USERPROFILE%", "$USERPROFILE"]);

/** True when the secret analyzer would already report this value. */
function alreadyReportedAsSecret(value: string): boolean {
  for (const rule of SECRET_RULES) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.replace("g", ""));
    const match = pattern.exec(value);
    if (match && !rule.isFalsePositive?.(match[1] ?? match[0], value)) return true;
  }
  return false;
}

function isEnvironmentReference(value: string): boolean {
  return (
    value.startsWith("${") ||
    value.startsWith("$") ||
    value.startsWith("env:") ||
    value.startsWith("%") ||
    value === ""
  );
}

interface RuleContext {
  file: string;
  content: string;
  locator: (ruleId: string) => Locator;
  push: (finding: Finding) => void;
}

function findRule(id: string): (typeof AGENT_RULES)[number] {
  const rule = AGENT_RULES.find((candidate) => candidate.id === id);
  if (!rule) throw new Error(`Unknown agent rule: ${id}`);
  return rule;
}

function report(
  context: RuleContext,
  ruleId: string,
  options: { line: number | null; evidence?: string; description?: string },
): void {
  const rule = findRule(ruleId);
  const finding: Finding = {
    id: rule.id,
    analyzer: "agent",
    severity: rule.severity,
    title: rule.title,
    description: options.description ?? rule.description,
    location: { file: context.file, line: options.line ?? 1 },
    remediation: rule.remediation,
  };

  if (options.evidence) finding.evidence = options.evidence;
  if (rule.confidence) finding.confidence = rule.confidence;

  context.push(finding);
}

/** The package spec a runner would install, when the runner installs one. */
export function runnerPackage(command: string | undefined, args: string[]): { spec: string; pinned: boolean } | null {
  if (!command) return null;

  const base = command.toLowerCase();

  if (RUNNER_COMMANDS.has(base)) {
    const spec = args.find((arg) => !arg.startsWith("-"));
    if (!spec) return null;
    const ecosystem = base === "uvx" ? "uv" : "npm";
    return { spec, pinned: isPinnedSpec(spec, ecosystem) };
  }

  if (base === "pnpm" && args[0] === "dlx") {
    const spec = args.slice(1).find((arg) => !arg.startsWith("-"));
    if (!spec) return null;
    return { spec, pinned: isPinnedSpec(spec, "npm") };
  }

  if (base === "pipx" && args[0] === "run") {
    const spec = args.slice(1).find((arg) => !arg.startsWith("-"));
    if (!spec) return null;
    return { spec, pinned: isPinnedSpec(spec, "pip") };
  }

  if (base === "docker" && args[0] === "run") {
    const spec = args.slice(1).find((arg) => !arg.startsWith("-"));
    if (!spec) return null;
    return { spec, pinned: isPinnedImage(spec) };
  }

  return null;
}

function isPinnedSpec(spec: string, ecosystem: "npm" | "pip" | "uv"): boolean {
  if (spec.startsWith(".") || spec.startsWith("/") || spec.startsWith("file:")) return true;
  if (spec.includes("git+") || spec.startsWith("http")) return true;

  if (ecosystem === "pip") {
    if (spec.includes("==")) return true;
    return spec.includes("@");
  }

  if (ecosystem === "uv") {
    if (spec.includes("==")) return true;
    return isPinnedSpec(spec, "npm");
  }

  const at = spec.lastIndexOf("@");
  if (at <= 0) return false;

  const version = spec.slice(at + 1);
  if (!version || version === "latest" || version === "next" || version === "master") return false;
  return /^\d/.test(version);
}

function isPinnedImage(spec: string): boolean {
  if (spec.includes("@sha256:")) return true;
  const withoutName = spec.split("/").pop() ?? spec;
  const colon = withoutName.lastIndexOf(":");
  if (colon === -1) return false;
  const tag = withoutName.slice(colon + 1);
  return Boolean(tag) && tag !== "latest";
}

function redactUrl(url: string): string {
  return url.replace(URL_USERINFO_PATTERN, (_match, user) => `${user}:****...redacted@`);
}

function analyzeMcpConfig(context: AnalyzerContext, sink: RuleContext): void {
  const parsed = parseJsonc(context.content);

  if (parsed.error) {
    report(sink, "agent.mcp-invalid-json", { line: null });
    return;
  }

  for (const server of extractServers(parsed.value)) {
    analyzeServer(server, context, sink);
  }
}

function analyzeServer(server: McpServer, context: AnalyzerContext, sink: RuleContext): void {
  const label = `mcp server "${server.name}"`;

  if (server.url) {
    const url = server.url;

    if (URL_USERINFO_PATTERN.test(url)) {
      const match = url.match(URL_USERINFO_PATTERN);
      const user = match?.[1] ?? "";
      report(sink, "agent.mcp-embedded-credential", {
        line: sink.locator("agent.mcp-embedded-credential").lineOf(url),
        evidence: `${label} ${redactUrl(url)}`,
        description: `${label} embeds a password in its endpoint URL. The value sits in the configuration file, in git history and in every log that prints it.`,
      });
      void user;
    } else if (URL_SECRET_QUERY_PATTERN.test(url)) {
      report(sink, "agent.mcp-embedded-credential", {
        line: sink.locator("agent.mcp-embedded-credential").lineOf(url),
        evidence: `${label} ${redactUrl(url)}`,
        description: `${label} passes a credential in the endpoint query string, where it lands in access logs and proxies.`,
      });
    }

    if (/^http:\/\//i.test(url)) {
      report(sink, "agent.mcp-insecure-endpoint", {
        line: sink.locator("agent.mcp-insecure-endpoint").lineOf(url),
        evidence: `${label} ${url}`,
      });
    }
  }

  for (const [header, value] of server.headers) {
    if (!looksLikeCredentialValue(value)) continue;
    report(sink, "agent.mcp-embedded-credential", {
      line: sink.locator("agent.mcp-embedded-credential").lineOf(value),
      evidence: `${label} header ${header}: ${redactMatch(value)}`,
      description: `${label} sends a credential in the "${header}" header. The value is stored in plain text in the configuration file.`,
    });
  }

  for (const [name, value] of server.env) {
    if (!SECRET_NAME_PATTERN.test(name)) continue;
    if (isEnvironmentReference(value)) continue;
    if (looksLikePlaceholder(value)) continue;
    if (alreadyReportedAsSecret(value)) continue;

    report(sink, "agent.mcp-secret-in-env", {
      line: sink.locator("agent.mcp-secret-in-env").lineOf(value),
      evidence: `${label} env ${name}: ${redactMatch(value)}`,
    });
  }

  const runner = runnerPackage(server.command, server.args);
  if (runner && !runner.pinned) {
    report(sink, "agent.mcp-unpinned-runner", {
      line: sink.locator("agent.mcp-unpinned-runner").lineOf(runner.spec),
      evidence: `${label} ${runner.spec}`,
      description: `${label} resolves "${runner.spec}" at install time, so whoever controls that package decides what runs on the machine next.`,
    });
  }

  for (const flag of BYPASS_FLAGS) {
    if (!server.args.includes(flag)) continue;
    report(sink, "agent.mcp-permission-bypass", {
      line: sink.locator("agent.mcp-permission-bypass").lineOf(flag),
      evidence: `${label} ${flag}`,
    });
  }

  const command = server.command?.toLowerCase();
  if (command && SHELL_COMMANDS.has(command)) {
    report(sink, "agent.mcp-shell-command", {
      line: sink.locator("agent.mcp-shell-command").lineOf(server.command ?? command),
      evidence: `${label} ${server.command}`,
    });
  }

  const filesystemServer =
    runner && /filesystem|(^|[-_/])fs([-_@]|$)/i.test(runner.spec);
  if (filesystemServer) {
    for (const arg of server.args) {
      if (!BROAD_PATHS.has(arg)) continue;
      report(sink, "agent.mcp-broad-filesystem", {
        line: sink.locator("agent.mcp-broad-filesystem").lineOf(arg),
        evidence: `${label} ${arg}`,
      });
    }
  }
}

function looksLikeCredentialValue(value: string): boolean {
  if (value.length < 12) return false;
  if (/^(bearer|basic)\s+\S+/i.test(value)) return true;
  return /(?:^|[^A-Za-z0-9])(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9]{16,}|AKIA[A-Z0-9]{16})/.test(
    value,
  );
}

const UNSAFE_COMMAND_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  {
    pattern: /(?:curl|wget)\s+[^\n|]*\|\s*(?:sudo\s+)?(?:ba|z|k)?sh\b/i,
    description: "downloads a script from the network and pipes it straight into a shell",
  },
  {
    pattern: /\bchmod\s+(?:-R\s+)?777\b/i,
    description: "makes a file world writable",
  },
  {
    pattern: /\brm\s+-[rRf]{1,2}\s+(?:\/|~|\$HOME)\b/i,
    description: "deletes the home directory or the filesystem root",
  },
  {
    pattern: /\b(?:iex|Invoke-Expression)\s*\(/i,
    description: "runs a string as code",
  },
];

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above|earlier|preceding)\s+(?:instructions?|rules?|prompts?|messages?|directions?)/i,
  /disregard\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|above|earlier)\s+(?:instructions?|rules?|prompts?)/i,
  /forget\s+(?:everything|all)\s+(?:you\s+)?(?:were\s+)?(?:told|above|before)/i,
  /忽略(?:掉)?(?:所有)?(?:以上|之前|先前|上面|上述)(?:的)?(?:所有)?(?:指令|规则|提示|要求)/,
  /(?:bypass|disable|turn\s+off)\s+(?:your\s+|the\s+)?(?:safety|guardrails?|security\s+(?:rules?|checks?))/i,
];

const EXFILTRATION_VERBS =
  /(?:upload|post|send|exfiltrat\w*|publish|push)\s+(?:the\s+|your\s+|this\s+|it\s+|these\s+|those\s+)?(?:code|source|repo(?:sitory)?|data|file|files|token|secret|password|key|diff|patch)/i;
const EXFILTRATION_VERBS_ZH = /(?:上传|发送|推送|上报|回传|提交)(?:代码|源码|仓库|数据|文件|令牌|密钥|密码|补丁)/;

const CREDENTIAL_REQUEST_PATTERNS: RegExp[] = [
  /(?:print|show|output|reveal|display|dump|echo|cat|type)\s+[^\n]{0,40}(?:\.env\b|id_rsa|id_ed25519|credential|api[ _-]?key|access[ _-]?token|password|secret)/i,
  /\benv\s*\|\s*grep\b/i,
  /(?:读取|输出|打印|显示|回显|导出)[^\n]{0,20}(?:\.env\b|密钥|凭据|令牌|密码|私钥)/,
];

function analyzeInstructionFile(context: AnalyzerContext, sink: RuleContext): void {
  const lines = context.content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const lineNumber = index + 1;

    for (const entry of UNSAFE_COMMAND_PATTERNS) {
      if (!entry.pattern.test(line)) continue;
      report(sink, "agent.instruction-unsafe-command", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120),
        description: `The instruction file asks the agent to run a command that ${entry.description}.`,
      });
    }

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (!pattern.test(line)) continue;
      report(sink, "agent.instruction-prompt-injection", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120),
      });
    }

    const hasUrl = /https?:\/\//i.test(line);
    if (hasUrl && (EXFILTRATION_VERBS.test(line) || EXFILTRATION_VERBS_ZH.test(line))) {
      report(sink, "agent.instruction-exfiltration", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120),
      });
    }

    for (const pattern of CREDENTIAL_REQUEST_PATTERNS) {
      if (!pattern.test(line)) continue;
      report(sink, "agent.instruction-credential-request", {
        line: lineNumber,
        evidence: line.trim().slice(0, 120),
      });
    }
  }
}

export function analyzeAgentContent(context: AnalyzerContext): Finding[] {
  const kind = classifyAgentFile(context.file);
  if (!kind) return [];

  const findings: Finding[] = [];
  const locators = new Map<string, Locator>();

  const sink: RuleContext = {
    file: context.file,
    content: context.content,
    locator: (ruleId: string) => {
      let locator = locators.get(ruleId);
      if (!locator) {
        locator = new Locator(context.content);
        locators.set(ruleId, locator);
      }
      return locator;
    },
    push: (finding: Finding) => findings.push(finding),
  };

  if (kind === "mcp-config") {
    analyzeMcpConfig(context, sink);
  } else {
    analyzeInstructionFile(context, sink);
  }

  return findings;
}

export const agentAnalyzer: Analyzer = {
  id: "agent",
  name: "Agent",
  description:
    "What the repository declares about its AI agents: MCP servers, the packages they pull and the instruction files that steer them.",
  rules: AGENT_RULES,
  acceptsExternalFiles: true,
  analyze: analyzeAgentContent,
};
