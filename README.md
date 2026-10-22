# ghcheck

> **一次扫描，一份报告**：CI Token 权限、工作流漏洞、仓库里泄露的密钥、AI Agent 的配置。

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/github/v/release/momomo12312hgfv/ghcheck)](https://github.com/momomo12312hgfv/ghcheck/releases)

`zizmor` 管工作流，`gitleaks` 管密钥，`patscope` 管 Token —— 三份报告，三个工具。
**ghcheck 把它们合进一个仓库**：一次扫描、一份报告、一个门禁。

[English](README.en.md) · [规则清单](docs/rules.md)

---

## 为什么

现成的工具各管一段，没有任何一份报告同时回答四个问题：

1. **我的 CI Token 能干什么？**（`contents: write` 意味着什么）
2. **我的工作流有哪些洞？**（脚本注入、特权触发器、未固定 action）
3. **仓库里漏了什么？**（GitHub / AWS / 私钥 / 数据库口令）
4. **我的 Agent 拿到了什么权限？**（`.mcp.json` 里的凭据、未固定的包、通配整个家目录）

ghcheck 的四个分析器共用**同一个 Finding 结构、同一套评分、同一份报告**。

## 它做什么

| 分析器 | 查什么 | 代表规则 |
|---|---|---|
| `token` | 每个 job 的 GITHUB_TOKEN 实际权限 + PAT 的 scope/权限能力 | `token.write-all-permissions`、`token.capability.repo.delete` |
| `workflow` | 工作流结构与注入面 | `workflow.script-injection`、`workflow.privileged-checkout`、`workflow.dangerous-trigger` |
| `secret` | 仓库里硬编码的凭据 | `secret.github-token`、`secret.aws-access-key-id`、`secret.private-key` |
| `agent` | 仓库对 AI Agent 的**声明**：MCP 服务器、它拉取的包、指挥它的指令文件 | `agent.mcp-unpinned-runner`、`agent.mcp-embedded-credential`、`agent.instruction-prompt-injection` |

完整清单见 [docs/rules.md](docs/rules.md)（91 条规则，随代码生成）。

## 安装

```bash
# 从 Releases 下载对应平台的二进制（自带 Bun 运行时，约 60–85 MB）
bunx ghcheck scan
```

从源码运行（需要 [Bun](https://bun.sh) 1.2+）：

```bash
git clone https://github.com/momomo12312hgfv/ghcheck.git
cd ghcheck
bun install
bun run src/cli.ts scan
```

## 用法

```bash
# 扫描当前目录
ghcheck scan

# 扫描指定目录，输出 Markdown
ghcheck scan ../my-repo --format markdown > report.md

# 输出 SARIF，交给 Code Scanning
ghcheck scan --format sarif > ghcheck.sarif

# CI 门禁：出现 high 及以上就失败（退出码 2）
ghcheck scan --fail-on high

# 只跑某几个分析器
ghcheck scan --analyzer workflow,secret

# 忽略某条规则
ghcheck scan --ignore workflow.unpinned-action

# 跳过某些路径
ghcheck scan --exclude node_modules --exclude dist

# 连同用户级 Agent 配置一起看（~/.claude.json 等）
ghcheck scan --agent-home

# 查看全部规则
ghcheck rules
```

### Agent 配置审计

`agent` 分析器读的是仓库对 AI Agent 的**声明**，不看运行时行为：

```bash
# 扫当前仓库里的 .mcp.json / AGENTS.md / CLAUDE.md / .vscode/mcp.json
ghcheck scan --analyzer agent

# 连同本机的 Agent 配置一起扫（默认关闭）
ghcheck scan --agent-home
```

它会报告：

- `.mcp.json` 里 **未固定版本**的包（`npx -y some-server@latest`）
- 端点 URL 里**内嵌凭据**、**明文 HTTP** 的远程 MCP
- 被授权到**整个家目录**的 filesystem server
- 指令文件里的 **prompt injection**（`忽略以上所有指令`）、`curl … | sh`、**外传数据**、**索要凭据**

**边界写清楚**：ghcheck **不会**启动 MCP 服务器、**不会**调用任何工具，因此也**不会**判断某个服务器是否要求鉴权。工具描述里声明了执行能力 ≠ 存在漏洞；这类结论标记为 `likely`，且**不影响评分**。

### Token 能力分析

同一个仓库里还有第二个入口 `ghcheck token`，它把一个 Token 变成能力清单：

```bash
# 从 gh CLI 读某个账号的 Token
ghcheck token --gh-account momomo12312hgfv

# 从 stdin 读，避免进入 shell 历史
cat token.txt | ghcheck token --token-stdin

# 完全离线：自己描述这个 Token
ghcheck token --scopes repo,workflow,delete_repo
ghcheck token --permissions repo.contents=write,repo.workflows=write
```

经典 Token 的 OAuth scope 由 GitHub API 返回；**细粒度 PAT 的权限 GitHub 不暴露**，只能通过 `--permissions` 自报，报告中会明确标注。

两个入口也可以合并成一次扫描：

```bash
ghcheck scan ../my-repo --gh-account momomo12312hgfv
```

### 抑制误报

四个分析器共用一套注释语法：

```yaml
- run: echo "${{ github.event.pull_request.title }}"  # ghcheck: ignore workflow.script-injection
- uses: actions/checkout@v4                            # ghcheck: ignore-all
# ghcheck: ignore-file   ← 整个文件都不检查
```

### 跳过什么

- 扫描**自动尊重仓库根目录的 `.gitignore`**
- 内置跳过 `node_modules`、`dist`、二进制文件、超过 2 MB 的文件
- `--exclude <片段>` 手动排除路径（可重复）
- `--ignore <规则 id>` 全局忽略某条规则（可重复）

### 输出格式

| 格式 | 用途 |
|---|---|
| `terminal` | 终端可读报告（默认） |
| `markdown` | 贴进 Issue / PR |
| `json` | 自动化、看板、自定义检查 |
| `sarif` | Code Scanning 等 SARIF 消费方 |

SARIF 的每条结果都指向**真实的文件与行号**，可以直接在 Code Scanning 里定位。

### 退出码

| 码 | 含义 |
|---|---|
| `0` | 扫描完成，且没有触发 `--fail-on` 阈值 |
| `1` | 参数错误或扫描失败 |
| `2` | 命中了 `--fail-on` 阈值 |

## GitHub Action

```yaml
name: ghcheck
on: [push, pull_request]

permissions:
  contents: read
  security-events: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: momomo12312hgfv/ghcheck@v0.2.0
        with:
          fail-on: high
          format: sarif
          output-file: ghcheck.sarif
      - uses: github/codeql-action/upload-sarif@v4
        if: always()
        with:
          sarif_file: ghcheck.sarif
```

Action 会写一份 Markdown 到 job summary，输出 `score` / `level` / `report` / `findings`，并在达到阈值时让 job 失败。

## 评分

沿用 patscope 已验证的模型：**加权求和**与**最高严重度下限**取大值，上限 100。

| 严重度 | 权重 | 分数下限 |
|---|---|---|
| critical | 50 | 70 |
| high | 20 | 45 |
| medium | 8 | 20 |
| low | 2 | 0 |

同一条规则在多处命中只计一次（取最高严重度），所以「20 个未固定 action」不会把分数刷爆。

## 安全与隐私

- **不联网**：整个扫描过程只读本地文件，不发出任何网络请求。
- **不改文件**：只读。
- **不打印凭据**：脱敏在 core 层统一执行，渲染器没有旁路；所有 evidence 都是 `ghp_****...redacted` 这种形式。
- **无遥测**：没有分析、崩溃上报或任何外发数据。

## 上游与致谢

ghcheck 的规则集参考了这些开源项目（均为 MIT / Apache-2.0），完整清单见 [THIRD-PARTY.md](THIRD-PARTY.md)：

| 项目 | 许可 | 借鉴内容 |
|---|---|---|
| [zizmor](https://github.com/zizmorcore/zizmor) | MIT | 工作流安全审计的思路与规则分类 |
| [actionlint](https://github.com/rhysd/actionlint) | MIT | 工作流正确性检查 |
| [secretlint](https://github.com/secretlint/secretlint) | MIT | 密钥检测的规则组织方式 |
| [patscope](https://github.com/momomo12312hgfv/patscope) | MIT | 评分模型、能力矩阵、报告与 Action 框架 |

## 开发

```bash
bun install
bun run typecheck
bun test
bun run build         # 当前平台二进制
bun run build:all     # 6 个平台交叉编译
bun run build:action  # 打包 GitHub Action
bun run docs          # 重新生成 docs/rules.md
```

## 路线图

- **v0.2** —— ✅ Agent 分析器：`.mcp.json`、`AGENTS.md`、`CLAUDE.md`、`.vscode/mcp.json` 进同一份报告
- **v0.3** —— ghcheck 作为 MCP Server 被 Agent 直接调用；npm 分发；官方 Registry 上架
- **v0.4** —— 需要 GitHub Token 的在线审计（已知漏洞 action）、可配置规则集

## 许可

MIT。见 [LICENSE](LICENSE)。
