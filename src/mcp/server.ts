import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import pkg from "../../package.json";
import {
  blastRadius,
  explainRule,
  listRules,
  scanRepository,
  type BlastRadiusInput,
  type RuleToolResult,
  type ScanToolInput,
} from "./tools";

/**
 * The MCP surface of ghcheck.
 *
 * Four tools, no side effects, no network. An agent that can run ghcheck can
 * ask it what a repository exposes, what a token can reach and what a rule
 * means, and get the answer in a shape it can act on.
 */

function text(value: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function failure(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: JSON.stringify({ error: message }, null, 2) }], isError: true };
}

export function createServer(): McpServer {
  const server = new McpServer(
    { name: "ghcheck", version: pkg.version },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "scan_repository",
    {
      title: "Scan a repository",
      description:
        "Scan a repository for token blast radius, workflow holes, leaked secrets and agent configuration. Returns the score, a summary per analyzer and every finding with its location and fix.",
      inputSchema: z.object({
        path: z.string().optional().describe("Path to scan. Defaults to the working directory."),
        analyzers: z
          .array(z.string())
          .optional()
          .describe("Analyzers to run: token, workflow, secret, agent. All of them by default."),
        severity: z
          .string()
          .optional()
          .describe("Only return findings at or above this severity: low, medium, high, critical."),
      }),
    },
    async (input) => {
      try {
        return text(await scanRepository(input as ScanToolInput));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "explain_rule",
    {
      title: "Explain a rule",
      description:
        "Explain one ghcheck rule: what it means, how severe it is and how to fix it. Use the rule id from a finding.",
      inputSchema: z.object({
        rule_id: z.string().describe("Rule id, for example workflow.script-injection."),
      }),
    },
    async (input) => {
      try {
        return text(explainRule(input.rule_id) as RuleToolResult);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "list_rules",
    {
      title: "List the rules",
      description:
        "List every rule ghcheck can report, optionally filtered by analyzer or severity.",
      inputSchema: z.object({
        analyzer: z.string().optional().describe("token, workflow, secret or agent."),
        severity: z.string().optional().describe("low, medium, high or critical."),
      }),
    },
    async (input) => {
      try {
        return text(listRules(input));
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "blast_radius",
    {
      title: "Show the blast radius of a token",
      description:
        "Work out what a GitHub token can reach: its scopes, its fine-grained permissions and every write capability they grant. Pass a token, a gh account name, or describe the token with scopes and permissions.",
      inputSchema: z.object({
        token: z.string().optional().describe("The token to analyse."),
        gh_account: z.string().optional().describe("Read the token of this gh CLI account."),
        scopes: z.array(z.string()).optional().describe("Classic OAuth scopes, for an offline analysis."),
        permissions: z
          .array(z.string())
          .optional()
          .describe("Fine-grained permissions, for example contents=write."),
        login: z.string().optional().describe("Login name to display."),
      }),
    },
    async (input) => {
      try {
        return text(await blastRadius(input as BlastRadiusInput));
      } catch (error) {
        return failure(error);
      }
    },
  );

  return server;
}
