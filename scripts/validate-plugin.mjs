import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];
const required = [
  ".cursor-plugin/plugin.json",
  "mcp.json",
  "hooks/hooks.json",
  "assets/logo.png",
  "README.md",
  "LICENSE",
  "PRIVACY.md",
  "SECURITY.md",
];

for (const path of required) {
  if (!existsSync(resolve(root, path))) errors.push(`Missing ${path}`);
}

const manifest = JSON.parse(
  readFileSync(resolve(root, ".cursor-plugin/plugin.json"), "utf8"),
);
if (!/^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(manifest.name ?? "")) {
  errors.push("Manifest name is not a valid Cursor plugin identifier");
}
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) {
  errors.push("Manifest version is not semantic MAJOR.MINOR.PATCH");
}
for (const key of ["displayName", "description", "author", "repository", "license", "logo"]) {
  if (!manifest[key]) errors.push(`Manifest missing ${key}`);
}

const mcp = JSON.parse(readFileSync(resolve(root, "mcp.json"), "utf8"));
const xmemo = mcp?.mcpServers?.xmemo;
if (xmemo?.type !== "http" || xmemo?.url !== "https://xmemo.dev/mcp") {
  errors.push("mcp.json must declare the hosted XMemo HTTP endpoint");
}

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = resolve(directory, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const files = walk(root).filter((path) => !path.includes("/.git/"));
const textFiles = files.filter((path) => /\.(?:json|md|mdc|mjs|ts|yml|yaml)$/i.test(path));
const forbidden = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bBearer\s+[A-Za-z0-9._~-]{12,}/,
  /\bXMEMO_KEY\s*[:=]\s*["']?(?!\$|<)[A-Za-z0-9_-]{12,}/i,
  /claude_reviewer@xmemo\.dev/i,
];
for (const file of textFiles) {
  const content = readFileSync(file, "utf8");
  for (const pattern of forbidden) {
    if (pattern.test(content)) errors.push(`Potential secret or reviewer credential in ${file}`);
  }
  if (/\b[A-Z]:\\Users\\/i.test(content)) errors.push(`Local absolute Windows path in ${file}`);
}

const skillRoot = resolve(root, "skills");
const skillDirectories = readdirSync(skillRoot).filter((name) =>
  statSync(resolve(skillRoot, name)).isDirectory(),
);
if (skillDirectories.length !== 9) errors.push(`Expected 9 Skills, found ${skillDirectories.length}`);
for (const name of skillDirectories) {
  const path = resolve(skillRoot, name, "SKILL.md");
  if (!existsSync(path)) {
    errors.push(`Missing skills/${name}/SKILL.md`);
    continue;
  }
  const content = readFileSync(path, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`Invalid frontmatter in skills/${name}/SKILL.md`);
    continue;
  }
  const keys = match[1]
    .split(/\r?\n/)
    .filter((line) => /^[a-zA-Z][\w-]*:/.test(line))
    .map((line) => line.split(":", 1)[0]);
  if (keys.join(",") !== "name,description") {
    errors.push(`Skill ${name} frontmatter must contain only name and description`);
  }
  if (!match[1].includes(`name: ${name}`)) errors.push(`Skill folder/name mismatch for ${name}`);
}

const readme = readFileSync(resolve(root, "README.md"), "utf8");
for (const link of readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
  const target = link[1];
  if (/^(?:https?:|mailto:|#)/.test(target)) continue;
  if (!existsSync(resolve(root, target))) errors.push(`Broken README link: ${target}`);
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}
console.log(`OK: XMemo Cursor plugin ${manifest.version}; ${skillDirectories.length} Skills; no secret patterns found.`);
