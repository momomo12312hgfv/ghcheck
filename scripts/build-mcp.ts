import { copyFile, mkdir, writeFile } from "node:fs/promises";
import pkg from "../package.json";

/**
 * Builds the npm package for the MCP server.
 *
 * The package is a single bundled file with no dependencies, so `npx` works
 * without an install step and the registry can point at a package that
 * cannot drift from the code in this repository.
 */

const OUT_DIR = "npm/dist";

await mkdir(OUT_DIR, { recursive: true });

const child = Bun.spawn(
  [
    "bun",
    "build",
    "./src/mcp-entry.ts",
    "--target=node",
    "--format=esm",
    "--minify",
    "--outfile",
    `${OUT_DIR}/ghcheck-mcp.js`,
  ],
  { stdout: "inherit", stderr: "inherit" },
);

const code = await child.exited;
if (code !== 0) {
  process.exit(code);
}

const npmPackage = {
  name: "@momomo12312hgfv/ghcheck-mcp",
  version: pkg.version,
  description:
    "MCP server for ghcheck: scan a repository for token blast radius, workflow holes, leaked secrets and agent configuration.",
  type: "module",
  bin: {
    "ghcheck-mcp": "dist/ghcheck-mcp.js",
  },
  mcpName: "io.github.momomo12312hgfv/ghcheck",
  repository: {
    type: "git",
    url: "git+https://github.com/momomo12312hgfv/ghcheck.git",
  },
  homepage: "https://github.com/momomo12312hgfv/ghcheck#readme",
  bugs: {
    url: "https://github.com/momomo12312hgfv/ghcheck/issues",
  },
  keywords: ["mcp", "modelcontextprotocol", "github", "security", "workflow", "agent"],
  license: "MIT",
  files: ["dist", "README.md", "LICENSE"],
  engines: {
    node: ">=20",
  },
  publishConfig: {
    access: "public",
  },
};

await writeFile("npm/package.json", `${JSON.stringify(npmPackage, null, 2)}\n`, "utf8");
await copyFile("LICENSE", "npm/LICENSE");

/**
 * The manifest the official MCP Registry reads. The version and the package
 * identifier are generated from the same place as the npm package, so the
 * two can never drift apart.
 */
const serverManifest = {
  $schema: "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  name: npmPackage.mcpName,
  title: "ghcheck",
  description:
    "Scan a repository for token blast radius, workflow holes, leaked secrets and agent configuration.",
  websiteUrl: "https://github.com/momomo12312hgfv/ghcheck#readme",
  repository: {
    url: "https://github.com/momomo12312hgfv/ghcheck",
    source: "github",
  },
  version: npmPackage.version,
  packages: [
    {
      registryType: "npm",
      registryBaseUrl: "https://registry.npmjs.org",
      identifier: npmPackage.name,
      version: npmPackage.version,
      runtimeHint: "npx",
      transport: {
        type: "stdio",
      },
    },
  ],
};

await writeFile("server.json", `${JSON.stringify(serverManifest, null, 2)}\n`, "utf8");

await writeFile(
  "npm/README.md",
  `# ghcheck MCP server

The Model Context Protocol server for [ghcheck](https://github.com/momomo12312hgfv/ghcheck).

It exposes four tools:

| Tool | What it does |
|---|---|
| \`scan_repository\` | Scan a repository for token blast radius, workflow holes, leaked secrets and agent configuration |
| \`list_rules\` | List every rule ghcheck can report |
| \`explain_rule\` | Explain one rule: what it means and how to fix it |
| \`blast_radius\` | Work out what a GitHub token can reach |

## Install

\`\`\`bash
npx -y @momomo12312hgfv/ghcheck-mcp
\`\`\`

## Use it with an MCP client

\`\`\`bash
claude mcp add ghcheck -- npx -y @momomo12312hgfv/ghcheck-mcp
\`\`\`

\`\`\`json
{
  "mcpServers": {
    "ghcheck": {
      "command": "npx",
      "args": ["-y", "@momomo12312hgfv/ghcheck-mcp"]
    }
  }
}
\`\`\`

The server reads files and nothing else: no network, no writes, no telemetry.
`,
  "utf8",
);

console.log(`Built npm/package.json (${npmPackage.name}@${npmPackage.version})`);
