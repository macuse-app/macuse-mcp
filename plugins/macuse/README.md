# Macuse Plugin

Agent plugin for [Macuse](https://macuse.app) — bundles the Macuse MCP server
together with skills that teach the agent how to drive it well.

Works with **Claude Code** and **OpenAI Codex**. Both read the same
`skills/` directory; only the manifest differs.

## Prerequisites

The [Macuse macOS app](https://macuse.app/download/) must be installed. This
plugin does not contain the server — it points at the `mcp` subcommand of the
app binary, which handles OAuth, permissions, and all protocol work.

## Install

**Claude Code**

```bash
/plugin marketplace add macuse-app/macuse-mcp
/plugin install macuse@macuse-plugins
```

**Codex**

```bash
codex plugin marketplace add macuse-app/macuse-mcp
codex plugin add macuse@macuse-plugins
```

If the app is installed somewhere other than `/Applications`, set
`MACUSE_BINARY` to the executable path before launching your client.

## What's Inside

| Skill | Covers |
| --- | --- |
| `macuse-setup` | Installing the app, connecting a client, granting macOS permissions, diagnosing a broken setup |
| `macuse-apps` | Calendar, Mail, Reminders, Notes, Messages, Location — tool routing, parameter shapes, workflow ordering, permission recovery |
| `macuse-computer-use` | Driving any Mac app's GUI through the Accessibility API — inspect/act/verify loop, element targeting, error recovery |

`macuse-apps` keeps per-domain detail in `skills/macuse-apps/references/`,
loaded only when the agent works in that domain.

## Known Issue on Codex

Macuse asks for consent before write operations, and Codex currently
auto-declines consent prompts from third-party MCP servers
([openai/codex#18896](https://github.com/openai/codex/issues/18896)). Reads
work normally; writes — sending mail, creating events, deleting reminders —
fail with `User did not respond to the consent prompt` until that lands.

The skills detect this failure mode and explain it rather than retrying
blindly, but the underlying limitation is upstream.

## Why Two MCP Configs

`.mcp.json` and `.mcp.codex.json` describe the same server but resolve its
path differently, because the two ecosystems do not share a substitution
mechanism:

- **Claude Code** substitutes `${CLAUDE_PLUGIN_ROOT}` inside `.mcp.json`.
- **Codex** does not substitute placeholders there. Its own bundled plugins
  use a relative `command` plus `"cwd": "."`, which resolves against the
  plugin root, so `.mcp.codex.json` follows that convention.

Each file uses its ecosystem's documented, officially-used form rather than
relying on one being compatible with the other. The same split applies to
`${CLAUDE_PLUGIN_ROOT}` in skill text: Claude Code expands it, Codex leaves
it literal, so `macuse-setup` spells out both paths to `check.sh`.

## Development

Validate before publishing:

```bash
claude plugin validate ./plugins/macuse --strict
```

Version strings in `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json`
are synced from the repo's `package.json` at release time by
`scripts/sync-manifest-version.js`. Do not bump them by hand — clients only
offer an update when the version changes, so an out-of-band edit strands users
on old skills.
