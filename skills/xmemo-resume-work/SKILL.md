---
name: xmemo-resume-work
description: Resume a project or unfinished task by recovering XMemo's latest verified checkpoint, relevant decisions, TODOs, blockers, and exact next action. Use at the start of a Cursor session, after interruption, or when continuing work previously handled by another agent.
---

# Resume work from XMemo

1. Resolve the project and task scope; verify connection identity when ambiguous.
2. Prefer `get_project_context` for a known project and `recall_context` for a task-oriented pack. Add focused `recall`, timeline, or TODO reads only to close specific gaps.
3. Inspect current repository state before trusting remembered completion or paths.
4. Reconcile memory with current files, diffs, commits, tests, deployments, and user corrections.
5. Return a Resume Brief with objective, verified state, remembered context, decisions, completed work, blocker, artifacts, remaining work, and one exact next action.
6. Continue only after the next action is evidence-backed and authorized.
7. Update the checkpoint after material verified progress, a new blocker, or a meaningful pause—not every turn.

Resume restores useful context, not the original conversation.
