/**
 * Which files describe an AI agent.
 *
 * The classification lives in the core layer because two analyzers need to
 * agree on it: the agent analyzer reads these files, and the secret analyzer
 * defers to the agent analyzer where the two would report the same line.
 */

/** Files that describe which MCP servers an agent may talk to. */
export const MCP_CONFIG_BASENAMES = new Set([
  ".mcp.json",
  "mcp.json",
  "mcp_config.json",
  "claude_desktop_config.json",
]);

/** Files that tell an agent how to behave in this repository. */
export const INSTRUCTION_BASENAMES = new Set([
  "agents.md",
  "claude.md",
  "gemini.md",
  "conventions.md",
  ".cursorrules",
  ".windsurfrules",
  ".clinerules",
  "copilot-instructions.md",
  "opencode.md",
]);

/** Path fragments whose files are agent instructions. */
export const INSTRUCTION_PATH_MARKERS = [
  "/.claude/skills/",
  "/.claude/commands/",
  "/.claude/agents/",
];

export type AgentFileKind = "mcp-config" | "instruction" | null;

export function classifyAgentFile(file: string): AgentFileKind {
  const normalized = file.replace(/\\/g, "/");
  const base = normalized.slice(normalized.lastIndexOf("/") + 1).toLowerCase();
  const markerPath = `/${normalized}`;

  if (MCP_CONFIG_BASENAMES.has(base)) return "mcp-config";
  if (INSTRUCTION_BASENAMES.has(base)) return "instruction";
  if (base.endsWith(".skill.md")) return "instruction";
  if (markerPath.includes("/.github/copilot-instructions.md")) return "instruction";
  if (INSTRUCTION_PATH_MARKERS.some((marker) => markerPath.includes(marker))) return "instruction";

  return null;
}
