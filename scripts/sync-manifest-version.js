#!/usr/bin/env node
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Every manifest that carries its own copy of the release version. The plugin
// manifests matter for distribution: Claude Code and Codex only offer users an
// update when the version string changes, so a stale one silently pins
// everyone to the skills they first installed with.
const MANIFESTS = [
  "manifest.json",
  "plugins/macuse/.claude-plugin/plugin.json",
  "plugins/macuse/.codex-plugin/plugin.json",
];

try {
  const { version } = JSON.parse(readFileSync("package.json", "utf8"));

  for (const path of MANIFESTS) {
    if (!existsSync(path)) {
      throw new Error(`${path} is missing`);
    }
    const manifest = JSON.parse(readFileSync(path, "utf8"));
    manifest.version = version;
    writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  try {
    execSync(`npx biome format --write ${MANIFESTS.join(" ")}`, {
      stdio: "ignore",
    });
  } catch {}

  console.log(`Updated ${MANIFESTS.length} manifests to version ${version}`);
} catch (error) {
  console.error("Error syncing manifest version:", error.message);
  process.exit(1);
}
