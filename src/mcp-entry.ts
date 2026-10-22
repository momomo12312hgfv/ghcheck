#!/usr/bin/env node
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./mcp/server";

/**
 * The ghcheck MCP server.
 *
 * It speaks MCP over stdio, which is how a local agent starts a tool. The
 * server reads files and nothing else: no network, no writes, no telemetry.
 */
serveStdio(() => createServer());
