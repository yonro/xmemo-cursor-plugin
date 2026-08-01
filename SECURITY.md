# Security Policy

## Reporting a vulnerability

Report security issues privately to [support@xmemo.dev](mailto:support@xmemo.dev). Do not open a public issue for an unpatched vulnerability.

Include the affected version, reproduction steps, impact, and any suggested mitigation. Do not include real user data or active credentials.

## Package boundaries

- The plugin uses the hosted XMemo MCP endpoint and interactive OAuth.
- No static API key, bearer token, client secret, or reviewer credential belongs in the repository.
- The Hook is local, bounded, and fail-open; it does not read transcript content or call XMemo directly.
- Memory operations remain scoped to the signed-in user's authorized XMemo account.
