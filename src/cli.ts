#!/usr/bin/env bun
import { Command } from "commander";
import pkg from "../package.json";
import { formatError, registerScan } from "./commands/scan";
import { registerRules } from "./commands/rules";

const program = new Command();

program
  .name("ghcheck")
  .description("One scan, one report: token blast radius, workflow holes and leaked secrets.")
  .version(pkg.version)
  .showHelpAfterError()
  .showSuggestionAfterError();

registerScan(program);
registerRules(program);

if (process.argv.length <= 2) {
  program.help();
}

try {
  await program.parseAsync(process.argv);
} catch (error) {
  process.stderr.write(`ghcheck: ${formatError(error)}\n`);
  process.exitCode = 1;
}
