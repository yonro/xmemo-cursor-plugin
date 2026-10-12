import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const errors = [];
const required = [
  "plugin.json",
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
const portable = JSON.parse(readFileSync(resolve(root, "plugin.json"), "utf8"));
if (portable.$schema !== "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json") {
  errors.push("Root plugin.json must target Agent Plugins 1.0.0");
}
for (const key of ["name", "version", "description", "author", "homepage", "repository", "license", "keywords"]) {
  if (!(key in portable)) errors.push(`Portable manifest missing ${key}`);
}
if (portable.name !== manifest.name || portable.version !== manifest.version) {
  errors.push("Portable and Cursor manifests must share name and version");
}
if (!portable.author?.url || portable.author.url !== "https://xmemo.dev") {
  errors.push("Portable author metadata must identify XMemo");
}
const cursorAuthorKeys = Object.keys(manifest.author ?? {});
for (const key of cursorAuthorKeys) {
  if (!["name", "email"].includes(key)) {
    errors.push(`Cursor manifest author contains unsupported field: ${key}`);
  }
}
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
if (mcp.$schema !== "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json") {
  errors.push("mcp.json must target Agent Plugins MCP 1.0.0");
}
if (xmemo?.type !== "streamable-http" || xmemo?.url !== "https://xmemo.dev/mcp") {
  errors.push("mcp.json must declare the hosted XMemo Streamable HTTP endpoint");
}
if (Object.keys(mcp.mcpServers ?? {}).length !== 1) {
  errors.push("mcp.json must declare exactly one MCP server");
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

for (const file of walk(resolve(root, "agents"))) {
  if (!/\.md$/i.test(file)) continue;
  const content = readFileSync(file, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match || !/^name:\s+\S+/m.test(match[1]) || !/^description:\s+\S+/m.test(match[1])) {
    errors.push(`Agent is missing name/description frontmatter: ${file}`);
  }
}

for (const file of walk(resolve(root, "rules"))) {
  if (!/\.(?:md|mdc|markdown)$/i.test(file)) continue;
  const content = readFileSync(file, "utf8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match || !/^description:\s+\S+/m.test(match[1])) {
    errors.push(`Rule is missing description frontmatter: ${file}`);
  }
}

const readme = readFileSync(resolve(root, "README.md"), "utf8");
if (!readme.includes(`plugin-v${manifest.version}-`)) {
  errors.push(`README version badge must match manifest version ${manifest.version}`);
}
for (const link of readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
  const target = link[1];
  if (/^(?:https?:|mailto:|#)/.test(target)) continue;
  if (!existsSync(resolve(root, target))) errors.push(`Broken README link: ${target}`);
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}
for (const [key, value] of Object.entries({
  agents: manifest.agents,
  skills: manifest.skills,
  rules: manifest.rules,
  hooks: manifest.hooks,
  mcpServers: manifest.mcpServers,
})) {
  const paths = Array.isArray(value) ? value : [value];
  for (const path of paths) {
    if (typeof path !== "string" || path.startsWith("/") || path.includes("..")) {
      throw new Error(`Manifest ${key} path must be relative and contained: ${path}`);
    }
    if (!existsSync(resolve(root, path))) {
      throw new Error(`Manifest ${key} path does not exist: ${path}`);
    }
  }
}
console.log(`OK: XMemo Cursor plugin ${manifest.version}; portable manifest, ${skillDirectories.length} Skills, standard MCP, and no secret patterns found.`);
