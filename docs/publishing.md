# Publishing

ghcheck ships in four places. This page is the runbook for the two that need
an account.

| Channel | What it is | Needs an account |
|---|---|---|
| GitHub Releases | The six platform binaries and the npm tarball | No |
| GitHub Action | `momomo12312hgfv/ghcheck@v0.3.0` | No |
| npm | `@momomo12312hgfv/ghcheck-mcp` | **Yes** |
| Official MCP Registry | `io.github.momomo12312hgfv/ghcheck` | **Yes** |

## The npm package

The package is a single bundled file with no dependencies. The SDK and zod are
compiled into it, so `npx` works without an install step and the published
artifact cannot drift from the code in this repository.

```bash
bun install --frozen-lockfile
bun run build:mcp        # writes npm/ and server.json
cd npm && npm pack       # writes ghcheck-mcp-<version>.tgz
```

To publish it:

```bash
npm adduser              # once, on the machine that publishes
cd npm
npm publish --access public
```

The version, the `mcpName` and the `server.json` are all generated from
`package.json` by `bun run build:mcp`, so they cannot get out of step with
each other. The release workflow runs the same build and uploads the tarball
as a release asset, so the package can also be installed from a release:

```bash
npm install -g https://github.com/momomo12312hgfv/ghcheck/releases/download/v0.3.0/ghcheck-mcp-0.3.0.tgz
```

## The official MCP Registry

The registry only hosts metadata. The package has to be on npm first.

```bash
# 1. install the publisher
curl -L "https://github.com/modelcontextprotocol/registry/releases/latest/download/mcp-publisher_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/').tar.gz" | tar xz mcp-publisher
sudo mv mcp-publisher /usr/local/bin/

# 2. authenticate with the GitHub account that owns the namespace
mcp-publisher login github

# 3. check the manifest
mcp-publisher validate

# 4. publish
mcp-publisher publish
```

The namespace `io.github.momomo12312hgfv` matches the GitHub account, so the
GitHub login is the one that proves ownership. The `mcpName` in
`npm/package.json` and the `name` in `server.json` are the same string, and
the registry rejects a package that does not carry it.

After publishing:

```bash
curl "https://registry.modelcontextprotocol.io/v0.1/servers?search=io.github.momomo12312hgfv/ghcheck"
```

## What the registry does not check

The registry verifies the namespace and the package. It does not run the
server and it does not read a single rule. The report the server produces is
the same report the CLI produces, because it is the same code.
