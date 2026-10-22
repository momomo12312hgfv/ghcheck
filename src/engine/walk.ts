import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { isIgnored, parseGitignore, type GitignoreRule } from "./gitignore";

const EXCLUDED_DIRECTORIES = new Set([
  ".git",
  ".hg",
  ".svn",
  "node_modules",
  "dist",
  "build",
  "out",
  "coverage",
  ".next",
  ".nuxt",
  ".svelte-kit",
  ".turbo",
  "vendor",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  ".idea",
  ".vscode",
  ".cache",
  ".bun-cache",
  ".gradle",
  ".terraform",
  "site-packages",
]);

const EXCLUDED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".bmp", ".tiff",
  ".pdf", ".zip", ".gz", ".tar", ".tgz", ".7z", ".rar",
  ".woff", ".woff2", ".ttf", ".otf", ".eot",
  ".mp3", ".mp4", ".mov", ".avi", ".webm", ".wav",
  ".bin", ".exe", ".dll", ".so", ".dylib", ".class", ".jar", ".wasm",
  ".sqlite", ".sqlite3", ".db", ".pyc", ".pyd", ".o", ".a",
]);

const EXCLUDED_FILENAMES = new Set(["bun.lockb", "package-lock.json", "yarn.lock", "pnpm-lock.yaml"]);

const DEFAULT_MAX_FILE_SIZE = 2 * 1024 * 1024;

export interface WalkOptions {
  root: string;
  /** Case-insensitive substrings matched against the relative path. */
  excludes: string[];
  maxFileSize?: number;
  /** Honour the .gitignore of the scan root. On by default. */
  respectGitignore?: boolean;
}

export interface ScannedFile {
  relativePath: string;
  content: string;
  bytes: number;
}

export interface WalkResult {
  files: ScannedFile[];
  skipped: number;
  warnings: string[];
}

function toPosix(value: string): string {
  return value.split(sep).join("/");
}

function isExcluded(relativePath: string, excludes: readonly string[]): boolean {
  const lowered = relativePath.toLowerCase();
  return excludes.some((exclude) => lowered.includes(exclude.toLowerCase()));
}

function looksBinary(buffer: Uint8Array): boolean {
  const limit = Math.min(buffer.length, 8000);
  for (let index = 0; index < limit; index += 1) {
    if (buffer[index] === 0) return true;
  }
  return false;
}

export async function collectFiles(options: WalkOptions): Promise<WalkResult> {
  const maxFileSize = options.maxFileSize ?? DEFAULT_MAX_FILE_SIZE;
  const files: ScannedFile[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  const rootStat = await stat(options.root);
  if (!rootStat.isDirectory()) {
    throw new Error(`Scan path is not a directory: ${options.root}`);
  }

  let gitignoreRules: GitignoreRule[] = [];
  if (options.respectGitignore !== false) {
    try {
      gitignoreRules = parseGitignore(await readFile(join(options.root, ".gitignore"), "utf8"));
    } catch {
      gitignoreRules = [];
    }
  }

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolute = join(directory, entry.name);
      const relativePath = toPosix(relative(options.root, absolute));

      if (entry.isSymbolicLink()) {
        skipped += 1;
        continue;
      }

      if (entry.isDirectory()) {
        if (EXCLUDED_DIRECTORIES.has(entry.name)) continue;
        if (isExcluded(relativePath, options.excludes)) continue;
        if (isIgnored(gitignoreRules, relativePath)) {
          skipped += 1;
          continue;
        }
        await walk(absolute);
        continue;
      }

      if (!entry.isFile()) continue;

      const extension = entry.name.includes(".")
        ? `.${entry.name.slice(entry.name.lastIndexOf(".") + 1).toLowerCase()}`
        : "";

      if (EXCLUDED_EXTENSIONS.has(extension) || EXCLUDED_FILENAMES.has(entry.name)) {
        skipped += 1;
        continue;
      }

      if (isExcluded(relativePath, options.excludes)) {
        skipped += 1;
        continue;
      }

      if (isIgnored(gitignoreRules, relativePath)) {
        skipped += 1;
        continue;
      }

      const fileStat = await stat(absolute);
      if (fileStat.size > maxFileSize) {
        skipped += 1;
        continue;
      }

      const buffer = await readFile(absolute);
      if (looksBinary(buffer)) {
        skipped += 1;
        continue;
      }

      files.push({
        relativePath,
        content: buffer.toString("utf8"),
        bytes: fileStat.size,
      });
    }
  }

  await walk(options.root);

  return { files, skipped, warnings };
}
