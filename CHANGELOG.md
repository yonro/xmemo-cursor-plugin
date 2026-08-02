# Changelog

## 1.1.0

- Route cross-agent or cross-session takeovers to `restore_restart_snapshot`, and optional complete handoff packages to `create_restart_snapshot`.
- Explain when normal continuation should use project or recall context and when a takeover should restore a restart snapshot.
- Document the optional restart snapshot step for a current handoff checkpoint without making it a handoff requirement.

## 1.0.0

- Add hosted XMemo MCP configuration with interactive OAuth.
- Add nine professional project-memory Skills.
- Add context-auditor and handoff-curator Subagents.
- Add a minimal continuity Rule and fail-open checkpoint Hook.
- Add validation, Hook tests, and tag-based GitHub Release automation.
