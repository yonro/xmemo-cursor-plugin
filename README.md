<div align="center">
  <a href="https://xmemo.dev/product/mcp">
    <img src="assets/logo.png" alt="XMemo" width="112" />
  </a>

  <h1>XMemo for Cursor</h1>

  <p><strong>Durable project memory and cross-agent continuity for Cursor.</strong></p>
  <p>Recover decisions, preserve verified progress, review plans, and hand work across sessions without replaying chat history.</p>

  <p>
    <img alt="Version" src="https://img.shields.io/badge/plugin-v1.0.1-8B5CF6?style=flat-square" />
    <img alt="Hosted MCP" src="https://img.shields.io/badge/MCP-hosted-06B6D4?style=flat-square" />
    <img alt="OAuth" src="https://img.shields.io/badge/auth-OAuth%202.0-10B981?style=flat-square" />
    <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-111827?style=flat-square" /></a>
  </p>
</div>

---

XMemo gives Cursor a private, user-controlled memory workspace for work that should survive one conversation. The plugin combines a hosted OAuth MCP connection with focused Skills, evidence-aware Subagents, a lightweight Rule, and a fail-open checkpoint Hook.

> [!IMPORTANT]
> This repository is a Cursor Marketplace submission candidate. It does not claim approval or marketplace availability.

## What it enables

- resume work from the latest verified checkpoint;
- recall project decisions, constraints, lessons, TODOs, and relevant context;
- turn brainstorms into approved, evidence-gated plans;
- review plans and audit agent progress against saved context and live files;
- distill important sessions without archiving raw transcripts;
- prepare and receive cross-agent handoffs with provenance and one exact next action;
- preserve stage checkpoints after sustained work without writing every turn.

## Components

| Component | Purpose |
|---|---|
| `plugin.json` + `.cursor-plugin/plugin.json` | Portable Agent Plugins metadata plus Cursor-specific components |
| `mcp.json` | Declares the standard Streamable HTTP connection to `https://xmemo.dev/mcp`; Cursor handles interactive OAuth |
| `skills/` | Nine focused professional workflows for recall, planning, review, progress, checkpointing, and handoff |
| `agents/` | Independent context auditor and handoff curator |
| `rules/` | Minimal always-on continuity and memory-safety policy |
| `hooks/` | Fail-open stop Hook that suggests a checkpoint only after sustained work |

The plugin does not pin or advertise a fixed tool count. Cursor receives the server-managed tool profile authorized for its signed OAuth identity, and each workflow uses only tools visible in the active connection.

## Quick start

Install the plugin through Cursor Marketplace when available, or load this repository locally using Cursor's plugin development flow. Then:

1. Enable the XMemo MCP server.
2. Complete the browser-based OAuth flow.
3. Ask Cursor naturally, for example:

```text
Bring me up to speed on this project using XMemo. Reconcile the latest checkpoint with the current repository and give me one exact next action.
```

Other representative prompts:

```text
Brainstorm three architecture directions using our saved constraints. Keep every option tentative until I approve one.

Review this implementation plan against our XMemo decisions and current code. Return a formal verdict and acceptance gate.

Audit the last agent's progress report against the approved plan, git diff, and test evidence.

Prepare a restart-ready handoff for another agent and preserve the verified checkpoint in XMemo.
```

## Checkpoint Hook

The `stop` Hook counts completed top-level turns and observes transcript modification time. It stores only bounded local metadata in `.cursor/hooks/state/xmemo-checkpoint.json`; it does not read or persist transcript content. After sustained work it emits a follow-up request to run `xmemo-checkpoint`. The Skill checks live evidence and skips the write when no material verified change exists.

The Hook is fail-open: malformed input, unavailable files, or runtime errors never block Cursor work.

## Security and privacy

- No API keys, bearer tokens, reviewer credentials, or client secrets are committed.
- OAuth tokens are managed by Cursor and XMemo, not by this repository.
- The package never stores raw chat transcripts.
- Permanent deletion requires an explicit user request and confirmation.
- Current user instructions and verified workspace evidence override stale memory.

See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md). XMemo's public privacy policy is available at [xmemo.dev/legal/privacy](https://xmemo.dev/legal/privacy).

## Validation

```bash
node scripts/validate-plugin.mjs
node --test scripts/checkpoint-hook.test.mjs
```

Validation checks both Open Plugins and Cursor manifests, component discovery, Agent Plugins MCP schema fields, frontmatter, Hook behavior, local links, and common credential patterns. The checkpoint Hook runs with Node.js and has no Bun runtime dependency.

See [docs/acceptance.md](docs/acceptance.md) for the evidence matrix and the
boundary between package validation and live Cursor OAuth/tool verification.

## Release policy

The manifest is the version source of truth. Tags use the matching `vMAJOR.MINOR.PATCH` form. Release archives are produced by CI and are not committed to the repository.

## Support

- Support: [support@xmemo.dev](mailto:support@xmemo.dev)
- Help center: [https://xmemo.dev/support](https://xmemo.dev/support)
- Security reports: [SECURITY.md](SECURITY.md)

## License

[MIT](LICENSE) © Yonro
