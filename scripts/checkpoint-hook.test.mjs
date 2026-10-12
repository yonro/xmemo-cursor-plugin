import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const hook = resolve("hooks/xmemo-checkpoint-stop.mjs");

function invoke(cwd, generation, transcript) {
  const result = spawnSync(process.execPath, [hook], {
    cwd,
    env: {
      ...process.env,
      XMEMO_CHECKPOINT_MIN_TURNS: "2",
      XMEMO_CHECKPOINT_MIN_MINUTES: "1",
    },
    input: JSON.stringify({
      conversation_id: "test-conversation",
      generation_id: generation,
      status: "completed",
      loop_count: 0,
      transcript_path: transcript,
    }),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

test("checkpoint hook waits for sustained work and then emits one safe follow-up", () => {
  const cwd = mkdtempSync(join(tmpdir(), "xmemo-cursor-hook-"));
  try {
    const transcript = join(cwd, "transcript.jsonl");
    writeFileSync(transcript, "one\n");

    assert.deepEqual(invoke(cwd, "g1", transcript), {});
    writeFileSync(transcript, "one\ntwo\n");
    const result = invoke(cwd, "g2", transcript);

    assert.match(result.followup_message, /xmemo-checkpoint/);
    assert.match(result.followup_message, /verified project progress/);
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});

test("checkpoint hook ignores duplicate generations and nested loops", () => {
  const cwd = mkdtempSync(join(tmpdir(), "xmemo-cursor-hook-"));
  try {
    const transcript = join(cwd, "transcript.jsonl");
    writeFileSync(transcript, "one\n");

    assert.deepEqual(invoke(cwd, "same", transcript), {});
    assert.deepEqual(invoke(cwd, "same", transcript), {});
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
