# ghcheck MCP server

The Model Context Protocol server for [ghcheck](https://github.com/momomo12312hgfv/ghcheck).

It exposes four tools:

| Tool | What it does |
|---|---|
| `scan_repository` | Scan a repository for token blast radius, workflow holes, leaked secrets and agent configuration |
| `list_rules` | List every rule ghcheck can report |
| `explain_rule` | Explain one rule: what it means and how to fix it |
| `blast_radius` | Work out what a GitHub token can reach |

## Install

```bash
npx -y @momomo12312hgfv/ghcheck-mcp
```

## Use it with an MCP client

```bash
claude mcp add ghcheck -- npx -y @momomo12312hgfv/ghcheck-mcp
```

```json
{
  "mcpServers": {
    "ghcheck": {
      "command": "npx",
      "args": ["-y", "@momomo12312hgfv/ghcheck-mcp"]
    }
  }
}
```

The server reads files and nothing else: no network, no writes, no telemetry.
