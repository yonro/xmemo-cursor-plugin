import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { stdin } from "bun";

const STATE_PATH = resolve(".cursor/hooks/state/xmemo-checkpoint.json");
const DEFAULT_MIN_TURNS = 6;
const DEFAULT_MIN_MINUTES = 20;

interface StopHookInput {
  conversation_id: string;
  generation_id?: string;
  status: "completed" | "aborted" | "error" | string;
  loop_count: number;
  transcript_path?: string | null;
}

interface CheckpointState {
  version: 1;
  lastPromptAtMs: number;
  turnsSincePrompt: number;
  lastTranscriptMtimeMs: number | null;
  lastGenerationId: string | null;
}

function positiveInt(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function emptyState(): CheckpointState {
  return {
    version: 1,
    lastPromptAtMs: 0,
    turnsSincePrompt: 0,
    lastTranscriptMtimeMs: null,
    lastGenerationId: null,
  };
}

function loadState(): CheckpointState {
  if (!existsSync(STATE_PATH)) return emptyState();
  try {
    const parsed = JSON.parse(readFileSync(STATE_PATH, "utf8"));
    return parsed.version === 1 ? { ...emptyState(), ...parsed } : emptyState();
  } catch {
    return emptyState();
  }
}

function saveState(state: CheckpointState): void {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function transcriptMtime(path: string | null | undefined): number | null {
  if (!path) return null;
  try {
    return statSync(path).mtimeMs;
  } catch {
    return null;
  }
}

async function main(): Promise<number> {
  try {
    const input = JSON.parse(await stdin.text()) as StopHookInput;
    const state = loadState();

    if (
      input.status !== "completed" ||
      input.loop_count !== 0 ||
      (input.generation_id && input.generation_id === state.lastGenerationId)
    ) {
      console.log(JSON.stringify({}));
      return 0;
    }

    state.lastGenerationId = input.generation_id ?? null;
    state.turnsSincePrompt += 1;

    const now = Date.now();
    const mtime = transcriptMtime(input.transcript_path);
    const transcriptAdvanced =
      mtime !== null &&
      (state.lastTranscriptMtimeMs === null || mtime > state.lastTranscriptMtimeMs);
    const turnsDue =
      state.turnsSincePrompt >=
      positiveInt("XMEMO_CHECKPOINT_MIN_TURNS", DEFAULT_MIN_TURNS);
    const minutesDue =
      state.lastPromptAtMs === 0 ||
      now - state.lastPromptAtMs >=
        positiveInt("XMEMO_CHECKPOINT_MIN_MINUTES", DEFAULT_MIN_MINUTES) * 60_000;

    if (transcriptAdvanced) state.lastTranscriptMtimeMs = mtime;

    if (turnsDue && minutesDue && transcriptAdvanced) {
      state.lastPromptAtMs = now;
      state.turnsSincePrompt = 0;
      saveState(state);
      console.log(
        JSON.stringify({
          followup_message:
            "Run the `xmemo-checkpoint` skill now. Preserve only material, verified project progress. If nothing durable changed or XMemo is unavailable, do not fabricate a save.",
        }),
      );
      return 0;
    }

    saveState(state);
    console.log(JSON.stringify({}));
    return 0;
  } catch (error) {
    console.error("[xmemo-checkpoint] fail-open", error);
    console.log(JSON.stringify({}));
    return 0;
  }
}

process.exit(await main());
