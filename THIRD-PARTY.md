# Third party notices

ghcheck is MIT licensed (see [LICENSE](LICENSE)). It re-implements ideas and
rule sets from the projects below. Their licenses are permissive and compatible
with MIT.

| Project | License | What ghcheck took from it |
|---|---|---|
| [zizmor](https://github.com/zizmorcore/zizmor) | MIT | The idea and the taxonomy of GitHub Actions security audits, and the split between a workflow being dangerous and a workflow being exploitable |
| [actionlint](https://github.com/rhysd/actionlint) | MIT | How workflow correctness problems are described and where they live |
| [secretlint](https://github.com/secretlint/secretlint) | MIT | How secret detection rules are organized per provider |
| [patscope](https://github.com/momomo12312hgfv/patscope) | MIT | The scope and permission matrices, the capability model, the weighted score with severity floors, the report renderers and the GitHub Action framework |

No source code was copied verbatim from these projects. The scope matrix, the
permission matrix and the capability table in `src/analyzers/token/` were
written for patscope and are shared between the two projects under the same
MIT license and the same copyright holder.

The MCP server uses these libraries at runtime. Both are permissive:

| Project | License | What ghcheck uses it for |
|---|---|---|
| [@modelcontextprotocol/server](https://github.com/modelcontextprotocol/typescript-sdk) | Apache-2.0 | The Model Context Protocol server implementation |
| [zod](https://github.com/colinhacks/zod) | MIT | The tool input schemas the MCP server advertises |

Projects that were deliberately **not** used, because their licenses are
incompatible with distributing an MIT licensed tool:

| Project | License | Reason |
|---|---|---|
| [trufflehog](https://github.com/trufflesecurity/trufflehog) | AGPL-3.0 | Copyleft |
| [secure-repo](https://github.com/step-security/secure-repo) | AGPL-3.0 | Copyleft |
| [action-validator](https://github.com/mpalmer/action-validator) | GPL-3.0 | Copyleft |
