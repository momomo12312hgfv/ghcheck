import { Command } from "commander";

export function registerMcp(program: Command): void {
  program
    .command("mcp")
    .description("Serve ghcheck over the Model Context Protocol, so an agent can call it")
    .action(async () => {
      const { serveStdio } = await import("@modelcontextprotocol/server/stdio");
      const { createServer } = await import("../mcp/server");

      await serveStdio(() => createServer());
    })
    .addHelpText(
      "after",
      `
Examples:
  $ ghcheck mcp                       # speak MCP over stdio
  $ claude mcp add ghcheck -- ghcheck mcp

Tools:
  scan_repository   scan a repository and return the findings
  list_rules        list every rule ghcheck can report
  explain_rule      explain one rule
  blast_radius      work out what a GitHub token can reach
`,
    );
}
