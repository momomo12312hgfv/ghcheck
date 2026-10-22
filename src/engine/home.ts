import { readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * User level agent configuration.
 *
 * These files live outside the repository, but they decide what the agent on
 * this machine may do: which MCP servers it can reach, with which
 * credentials. Scanning them is opt in, because a report that reaches into
 * the home directory is a different promise than one that stays in the
 * repository.
 */
export interface ExternalFile {
  /** Display path, kept short so the report stays readable. */
  relativePath: string;
  content: string;
  bytes: number;
}

interface Candidate {
  absolute: string;
  relativePath: string;
}

function candidates(): Candidate[] {
  const home = homedir();
  const list: Candidate[] = [
    { absolute: join(home, ".claude.json"), relativePath: "~/.claude.json" },
    { absolute: join(home, ".cursor", "mcp.json"), relativePath: "~/.cursor/mcp.json" },
    { absolute: join(home, ".codeium", "mcp.json"), relativePath: "~/.codeium/mcp.json" },
    {
      absolute: join(home, "Library", "Application Support", "Claude", "claude_desktop_config.json"),
      relativePath: "~/Library/Application Support/Claude/claude_desktop_config.json",
    },
    {
      absolute: join(home, ".config", "Claude", "claude_desktop_config.json"),
      relativePath: "~/.config/Claude/claude_desktop_config.json",
    },
  ];

  const appData = process.env.APPDATA;
  if (appData) {
    list.push({
      absolute: join(appData, "Claude", "claude_desktop_config.json"),
      relativePath: "%APPDATA%/Claude/claude_desktop_config.json",
    });
  }

  return list;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024;

export async function collectAgentHomeFiles(): Promise<ExternalFile[]> {
  const files: ExternalFile[] = [];

  for (const candidate of candidates()) {
    try {
      const info = await stat(candidate.absolute);
      if (!info.isFile() || info.size > MAX_FILE_SIZE) continue;

      const content = await readFile(candidate.absolute, "utf8");
      files.push({ relativePath: candidate.relativePath, content, bytes: info.size });
    } catch {
      continue;
    }
  }

  return files;
}
