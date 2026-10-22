import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Downloads a corpus of real GitHub Actions workflows.
 *
 * The corpus is what the parity report is measured on, so it has to be real
 * workflows from real repositories, not fixtures. The files are grouped by
 * repository so that every tool sees the same layout.
 */

const CORPUS_DIR = ".parity/corpus";
const TARGET_FILES = Number(process.env.CORPUS_TARGET ?? 200);
const MIN_STARS = Number(process.env.CORPUS_MIN_STARS ?? 5000);
const REPO_POOL = Number(process.env.CORPUS_REPOS ?? 120);

function ghToken(): string {
  return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
}

const token = ghToken();
const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": "ghcheck-parity",
};

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status} for ${path}`);
  }
  return (await response.json()) as T;
}

interface SearchResult {
  items: Array<{ full_name: string; stargazers_count: number }>;
}

interface ContentEntry {
  name: string;
  path: string;
  type: string;
  download_url: string;
  size: number;
}

await rm(CORPUS_DIR, { recursive: true, force: true });
await mkdir(CORPUS_DIR, { recursive: true });

console.log(`Searching repositories with more than ${MIN_STARS} stars...`);
const search = await api<SearchResult>(
  `/search/repositories?q=stars:%3E${MIN_STARS}&per_page=${REPO_POOL}&sort=stars`,
);

console.log(`Found ${search.items.length} candidate repositories.`);

let downloaded = 0;
let repos = 0;

for (const repo of search.items) {
  if (downloaded >= TARGET_FILES) break;

  let entries: ContentEntry[];
  try {
    entries = await api<ContentEntry[]>(`/repos/${repo.full_name}/contents/.github/workflows`);
  } catch {
    continue;
  }

  const workflows = entries.filter(
    (entry) => entry.type === "file" && /\.ya?ml$/.test(entry.name) && entry.size < 200_000,
  );
  if (workflows.length === 0) continue;

  const target = join(
    CORPUS_DIR,
    repo.full_name.replace("/", "__"),
    ".github",
    "workflows",
  );
  await mkdir(target, { recursive: true });
  repos += 1;

  for (const workflow of workflows) {
    if (downloaded >= TARGET_FILES) break;

    const response = await fetch(workflow.download_url, { headers });
    if (!response.ok) continue;

    const content = await response.text();
    await writeFile(join(target, workflow.name), content, "utf8");
    downloaded += 1;
  }
}

console.log(`Downloaded ${downloaded} workflows from ${repos} repositories into ${CORPUS_DIR}.`);
