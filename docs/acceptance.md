# XMemo Cursor plugin acceptance

This record separates package validation from live Cursor and XMemo service
behavior. It does not claim Cursor Marketplace approval or a completed Cursor
OAuth session.

## Candidate

- Version: `1.0.2`
- Manifest formats: Agent Plugins 1.0.0 and Cursor Plugin
- MCP transport: Streamable HTTP
- Endpoint: `https://xmemo.dev/mcp`
- Test date: 2026-10-13 (Asia/Tokyo)

## Results

| Area | Status | Evidence |
| --- | --- | --- |
| Root Agent Plugins manifest | **VERIFIED** | `plugin.json` contains the canonical 1.0.0 schema, coherent metadata, and synchronized version `1.0.2`. |
| Cursor manifest | **VERIFIED** | `.cursor-plugin/plugin.json` declares the Cursor components and the same name/version. |
| Standard MCP declaration | **VERIFIED** | `mcp.json` uses the Agent Plugins MCP schema and `streamable-http` for `https://xmemo.dev/mcp`. |
| Component discovery | **VERIFIED** | Nine Skills, two Agents, one Rule, one Hook, and one MCP server are present at declared paths. |
| Static validator | **VERIFIED** | `node scripts/validate-plugin.mjs` passed. |
| Checkpoint Hook | **VERIFIED** | `node --test scripts/checkpoint-hook.test.mjs` passed two tests; Hook is fail-open and uses Node.js without a Bun dependency. |
| Endpoint protection | **VERIFIED** | Unauthenticated `GET https://xmemo.dev/mcp` returned HTTP 401. |
| OAuth discovery | **VERIFIED** | XMemo authorization-server metadata returned HTTP 200 with PKCE S256, registration, token, and revocation endpoints. |
| Cursor OAuth flow | **NOT RUN** | Requires a signed-in Cursor client and a user-approved browser authorization. |
| Cursor tools/list | **NOT RUN** | Devin and Claude evidence cannot be promoted to Cursor client evidence. |
| Cursor memory read/write | **NOT RUN** | Requires an authenticated Cursor session and synthetic records. |
| Cursor isolation/revocation/resume | **NOT RUN** | Requires Cursor-specific authenticated and multi-session evidence. |
| Cursor Marketplace submission | **NOT SUBMITTED** | The package is ready for submission at `https://cursor.com/marketplace/publish` or the configured Cursor directory, pending owner review. |

## Reproducible checks

```bash
node scripts/validate-plugin.mjs
node --test scripts/checkpoint-hook.test.mjs
```

The live endpoint and OAuth metadata checks are connectivity evidence only;
they do not grant access or prove a Cursor account has authorized XMemo.
