#!/usr/bin/env bun
import { Command } from "commander";
import pkg from "../package.json";
import { formatError, registerScan } from "./commands/scan";
import { registerMcp } from "./commands/mcp";
import { registerRules } from "./commands/rules";
import { registerToken } from "./commands/token";

const program = new Command();

program
  .name("ghcheck")
  .description("One scan, one report: token blast radius, workflow holes, leaked secrets and agent configuration.")
  .version(pkg.version)
  .showHelpAfterError()
  .showSuggestionAfterError();

registerScan(program);
registerToken(program);
registerRules(program);
registerMcp(program);

if (process.argv.length <= 2) {
  program.help();
}

try {
  await program.parseAsync(process.argv);
} catch (error) {
  process.stderr.write(`ghcheck: ${formatError(error)}\n`);
  process.exitCode = 1;
}
