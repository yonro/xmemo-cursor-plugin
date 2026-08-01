import { afterEach, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const hook = resolve(fileURLToPath(new URL("../hooks/xmemo-checkpoint-stop.ts", import.meta.url)));
const temporary = [];

afterEach(() => {
  for (const path of temporary.splice(0)) rmSync(path, { recursive: true, force: true });
});

async function invoke(cwd: string, generation: string, transcript: string) {
  const process = Bun.spawn(["bun", "run", hook], {
    cwd,
    env: {
      ...Bun.env,
      XMEMO_CHECKPOINT_MIN_TURNS: "2",
      XMEMO_CHECKPOINT_MIN_MINUTES: "1",
    },
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
  });
  process.stdin.write(
    JSON.stringify({
      conversation_id: "test-conversation",
      generation_id: generation,
      status: "completed",
      loop_count: 0,
      transcript_path: transcript,
    }),
  );
  process.stdin.end();
  const output = await new Response(process.stdout).text();
  expect(await process.exited).toBe(0);
  return JSON.parse(output);
}

test("checkpoint hook waits for sustained work and then emits one safe follow-up", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "xmemo-cursor-hook-"));
  temporary.push(cwd);
  const transcript = join(cwd, "transcript.jsonl");
  writeFileSync(transcript, "one\n");

  expect(await invoke(cwd, "g1", transcript)).toEqual({});
  await Bun.sleep(20);
  writeFileSync(transcript, "one\ntwo\n");
  const result = await invoke(cwd, "g2", transcript);

  expect(result.followup_message).toContain("xmemo-checkpoint");
  expect(result.followup_message).toContain("verified project progress");
});

test("checkpoint hook ignores duplicate generations and nested loops", async () => {
  const cwd = mkdtempSync(join(tmpdir(), "xmemo-cursor-hook-"));
  temporary.push(cwd);
  const transcript = join(cwd, "transcript.jsonl");
  writeFileSync(transcript, "one\n");

  expect(await invoke(cwd, "same", transcript)).toEqual({});
  expect(await invoke(cwd, "same", transcript)).toEqual({});
});
