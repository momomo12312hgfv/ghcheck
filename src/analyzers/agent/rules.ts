import type { RuleDefinition } from "../../core/types";

export type AgentRule = RuleDefinition;

/**
 * The agent rule set.
 *
 * ghcheck reads what a repository *declares* about its agents. It never
 * starts an MCP server, never calls a tool and never judges runtime
 * behaviour, so every rule here is about a declaration that is visible in a
 * file: a credential in a URL, a package that runs unpinned, an instruction
 * file that asks for something dangerous.
 *
 * The boundary is deliberate. Tools that open a live session with a server
 * can say whether it demands authentication. ghcheck cannot, so it does not
 * claim that either way.
 */
export const AGENT_RULES: AgentRule[] = [  {
    id: "agent.mcp-invalid-json",
    title: "Agent configuration is not valid JSON",
    severity: "medium",
    description:
      "The MCP configuration could not be parsed, so none of the agent checks could run against it. Editors accept comments and trailing commas, which is why this file may still work in the editor.",
    remediation: "Fix the JSON syntax, or keep the file valid for every tool that reads it.",
  },
  {
    id: "agent.mcp-embedded-credential",
    title: "MCP endpoint carries a credential",
    severity: "critical",
    description:
      "The MCP endpoint embeds a credential in the URL or in a header. The value is part of the configuration file, so it ends up in git history, in the agent transcript and in every log that prints the configuration.",
    remediation:
      "Move the credential into an environment variable and reference it (`${TOKEN}`), and rotate the value that was committed.",
  },
  {
    id: "agent.mcp-secret-in-env",
    title: "MCP server receives a secret as a literal value",
    severity: "high",
    description:
      "The server configuration passes a secret to the MCP server as a literal string. Every process that can read the configuration file can read the secret with it.",
    remediation:
      "Reference the environment variable instead (`${TOKEN}`) and keep the value in the shell or the secret store.",
  },
  {
    id: "agent.mcp-unpinned-runner",
    title: "MCP server runs an unpinned package",
    severity: "high",
    description:
      "The server is started with a package runner that resolves the package at install time. Whoever controls that package name, or the account that owns it, decides what runs on the machine next.",
    remediation: "Pin the exact version (`pkg@1.2.3`) or the commit of the package you trust.",
  },
  {
    id: "agent.mcp-insecure-endpoint",
    title: "MCP endpoint uses plain HTTP",
    severity: "high",
    description:
      "The remote MCP endpoint is reached over plain HTTP. Everything the agent sends and everything the server answers travels in clear text, including the credentials the agent hands over.",
    remediation: "Use `https://` and terminate TLS at the endpoint.",
  },
  {
    id: "agent.mcp-broad-filesystem",
    title: "MCP filesystem server is scoped to the whole home directory",
    severity: "high",
    confidence: "likely",
    description:
      "The filesystem server is allowed to read the entire home directory, which normally holds SSH keys, tokens, shell history and every other project on the machine.",
    remediation: "Scope the server to the one directory the agent actually needs.",
  },
  {
    id: "agent.mcp-permission-bypass",
    title: "MCP server is started with a permission bypass",
    severity: "high",
    description:
      "The server is started with a flag that turns the permission prompts off. The agent then runs whatever the server asks for, with the permissions of the user who started it.",
    remediation: "Drop the flag and let the agent ask before it acts.",
  },
  {
    id: "agent.instruction-unsafe-command",
    title: "Agent instructions ask for an unsafe command",
    severity: "high",
    description:
      "The instruction file tells the agent to run a command that pipes a download into a shell, makes a file world writable, or deletes a home directory. Instructions like this run every time the agent reads the file.",
    remediation: "Remove the command, or state the steps the agent should follow instead of a shell one-liner.",
  },
  {
    id: "agent.mcp-shell-command",
    title: "MCP server is started through a shell",
    severity: "medium",
    confidence: "likely",
    description:
      "The server is launched through a shell interpreter, so the real command is hidden inside a string argument and cannot be reviewed by reading the configuration.",
    remediation: "Run the server binary directly instead of wrapping it in `sh -c`.",
  },
  {
    id: "agent.instruction-prompt-injection",
    title: "Agent instructions contain an instruction override",
    severity: "medium",
    confidence: "likely",
    description:
      "The instruction file tells the agent to ignore previous instructions or to turn off its safety rules. A file like that can turn any later request into an unguarded one.",
    remediation: "Remove the override wording and keep the file to instructions about the project itself.",
  },
  {
    id: "agent.instruction-exfiltration",
    title: "Agent instructions send data to an external endpoint",
    severity: "medium",
    confidence: "likely",
    description:
      "The instruction file asks the agent to upload or post something to an external address. Combined with the access an agent usually has, that turns a routine task into a leak.",
    remediation: "Say what should happen locally, and keep the outbound call explicit and reviewable.",
  },
  {
    id: "agent.instruction-credential-request",
    title: "Agent instructions ask for credentials",
    severity: "medium",
    confidence: "likely",
    description:
      "The instruction file asks the agent to read, print or show a credential. An agent that answers that request hands the value to the model, and from there to whoever is on the other end of the conversation.",
    remediation: "Ask for the path or the name of the secret, never for the value.",
  },
];
