import { mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });

const child = Bun.spawn(
  ["bun", "build", "--compile", "--minify", "./src/cli.ts", "--outfile", "dist/ghcheck.exe"],
  {
    stdout: "inherit",
    stderr: "inherit",
  },
);

const code = await child.exited;
if (code !== 0) {
  process.exit(code);
}

console.log("Built dist/ghcheck.exe");
