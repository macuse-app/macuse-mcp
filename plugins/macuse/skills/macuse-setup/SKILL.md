---
name: macuse-setup
description: This skill should be used when the user asks to "install Macuse", "set up Macuse", "connect Macuse", "fix Macuse", or when Macuse MCP tools (calendar_*, mail_*, computer_use_*, ...) are expected but missing, unreachable, or failing with permission errors. Guides installing the macOS app, connecting an MCP client (Claude Code, Codex, Claude Desktop), and granting macOS permissions.
---

# Macuse Setup

Macuse is a macOS app that runs a local MCP server on `127.0.0.1:35729`.
Setup has three layers; diagnose top-down — a fresh machine may need all
three, an established setup usually breaks in exactly one:

1. **App** — installed and running on the Mac
2. **Client** — this agent's MCP config points at Macuse
3. **Permissions** — macOS grants + per-feature consent inside Macuse

## Step 1: Diagnose

Run the bundled probe and read its KEY=VALUE output:

```bash
bash "${CLAUDE_PLUGIN_ROOT}/skills/macuse-setup/scripts/check.sh"
```

Claude Code substitutes `${CLAUDE_PLUGIN_ROOT}` automatically. Elsewhere —
Codex, or a standalone copy of this skill — nothing substitutes it and the
path stays literal; in that case run `scripts/check.sh` relative to this
skill's own directory. Either way the probe is read-only, so a wrong guess
costs nothing but a "no such file" error.

| Output | Meaning | Go to |
| --- | --- | --- |
| `APP_INSTALLED=no` | App missing | Step 2 |
| `APP_RUNNING=no`, `MCP_SERVER=down` | App installed but not running | Step 3, launch branch |
| `APP_RUNNING=no`, `MCP_SERVER=up ...` | A Macuse outside `/Applications` is serving (dev build, or app kept elsewhere). The probe only watches the standard path | Nothing to fix here — skip to Step 4. Do **not** launch a second copy |
| `APP_RUNNING=yes`, `MCP_SERVER=down` | App running but MCP server disabled | Step 3, toggle branch |
| `MCP_SERVER=up ...` but no `calendar_*`/`mail_*` tools in this session | Client not connected | Step 4 |
| Tools missing right after installing the Macuse plugin | Session predates the install | Step 4, plugin branch — reload, do not hand-edit config |
| Tools exist but calls fail with permission/consent errors | Permissions | Step 5 |

An HTTP 401 from the probe is healthy — it means the server is up and
correctly requiring OAuth.

## Step 2: Install the App

There is no Homebrew cask. Open the official download page and guide the
user through the drag-install:

```bash
open "https://macuse.app/download/"
```

Tell the user: open the downloaded DMG, drag Macuse into Applications, then
launch it once from Applications (first launch shows an onboarding flow and
places a menu bar icon). Re-run the probe afterwards.

## Step 3: Start the App

- **Launch branch** (`APP_RUNNING=no`):

  ```bash
  open -a Macuse
  ```

  Wait a few seconds and re-run the probe.

- **Toggle branch** (`APP_RUNNING=yes`, `MCP_SERVER=down`): ask the user to
  check the MCP server toggle inside Macuse (menu bar icon → settings),
  then re-run the probe.

## Step 4: Connect This Client

All stdio clients connect through the Macuse CLI bridge — the app binary
itself in `mcp` mode. It auto-launches the desktop app when needed and
handles OAuth; no Node or npm is required. This is why install (Step 2)
must precede this step: the binary has to exist.

**Plugin branch — check this first.** If this skill came from the Macuse
plugin, the MCP server is already bundled with it and no config editing is
warranted. Missing tools mean the session predates the install, or the
plugin is installed but disabled:

- Claude Code: `/reload-plugins`, then `/plugin` to confirm `macuse` is
  enabled.
- Codex: restart the session, then `codex plugin list` to confirm it is
  installed and enabled.

The plugin already carries its own server entry, so only fall through to the
manual branch below when the plugin is genuinely absent.

**Manual branch** — for clients without the plugin installed:

- **Claude Code**:

  ```bash
  claude mcp add macuse -- "/Applications/Macuse.app/Contents/MacOS/macuse" mcp
  ```

- **Codex** — add to `~/.codex/config.toml`:

  ```toml
  [mcp_servers.macuse]
  command = "/Applications/Macuse.app/Contents/MacOS/macuse"
  args = ["mcp"]
  ```

  (Recent Codex versions also accept
  `codex mcp add macuse -- /Applications/Macuse.app/Contents/MacOS/macuse mcp`.)

- **Claude Desktop** — use the one-click `.mcpb` bundle from
  https://macuse.app/download/ instead of manual config.

After editing config, the user must restart the client session for tools to
appear. On the first tool call, Macuse shows an authorization prompt —
tell the user to approve it in the Macuse window.

## Step 5: Grant Permissions On Demand

Do not front-load every permission. Trigger each grant only when a tool
reports it missing, and open the exact System Settings pane for the user:

- Full Disk Access (Mail / Messages / Notes reading):

  ```bash
  open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"
  ```

- Accessibility (computer_use, Mail compose):

  ```bash
  open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"
  ```

In both panes the user enables **Macuse**, then retries the failed call.
If the call still fails immediately after granting, quit and relaunch
Macuse — these grants apply to processes started after the grant.
Calendar/Reminders access and per-app computer-use consent are approved in
dialogs that Macuse itself shows — tell the user to look for the Macuse
prompt (known issue: OpenAI Codex auto-declines Macuse consent prompts,
openai/codex#18896; see the macuse-apps skill for handling).

## Step 6: Verify

Confirm end-to-end with the cheapest read call available in the session,
e.g. `reminders_list_lists` or `calendar_list_calendars`. Without a client
restart, verify the server side alone:

```bash
"/Applications/Macuse.app/Contents/MacOS/macuse" mcp --list-tools
```

This command may auto-launch the Macuse app and show a one-time
authorization prompt inside Macuse — that is expected, not a hang; tell the
user to approve it.

Report to the user which layers were fixed and what remains (e.g. grants
that require a logout or an app restart).
