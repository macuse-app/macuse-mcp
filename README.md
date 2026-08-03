# Macuse — AI Superpowers for Every Mac App

Give your AI direct control of Calendar, Mail, Notes, Reminders, Messages, and any other Mac app over the [Model Context Protocol](https://modelcontextprotocol.io) — an MCP server for Mac plus Computer Use for macOS, fully on-device.

Works with Claude Desktop, Cursor, Codex, Raycast, VS Code, Warp, Zed, LM Studio, Windsurf, and any MCP-compatible client.

> This repo packages Macuse for agent clients: the **Claude Desktop `.mcpb` installer** and the **agent plugin** for Claude Code and Codex. The macOS app itself and the full docs live at [macuse.app](https://macuse.app).

| You use | Install this | Get |
| --- | --- | --- |
| Claude Code, Codex | [Agent plugin](#install-as-an-agent-plugin) | MCP tools **+ skills** |
| Claude Desktop | [`.mcpb` bundle](#install-for-claude-desktop) | MCP tools |
| Cursor, Raycast, VS Code, Zed, … | [Direct command](#use-with-other-mcp-clients) | MCP tools |

All three connect to the same local server. The plugin additionally installs
skills — instructions that teach the agent how to use the tools correctly
instead of discovering the parameter shapes by trial and error.

## What Macuse Does

Two complementary ways for AI to work with your Mac. Everything runs locally — your data never leaves your device.

### Native App Integrations

Your AI reads and writes directly to macOS apps through natural conversation.

| Toolbox             | What you can ask                                                               |
| ------------------- | ------------------------------------------------------------------------------ |
| **Calendar**        | "Schedule a meeting next Tuesday at 3pm", find free time, manage events        |
| **Mail**            | "Draft a reply to this email", search inbox, organize messages                 |
| **Notes**           | "Find notes mentioning the Q2 launch", capture ideas, append to notes          |
| **Reminders**       | Create tasks with due dates and priorities, mark complete, search across lists |
| **Messages**        | Read and send iMessages, search conversations                                  |
| **Stickies**        | Search, read, and create sticky notes in Apple Stickies                        |
| **Contacts**        | Look up by name, email, phone, or company                                      |
| **Maps & Location** | Place search, directions, travel time, current location                        |
| **Shortcuts**       | Browse installed Shortcuts and run them with optional input                    |

### Computer Use on macOS

See and control any Mac app — even ones without a dedicated integration. Macuse brings Computer Use to macOS for **any** MCP client, not just Claude or Codex.

- Click any element, type text, navigate menus, drive any app
- Fill out web forms, operate enterprise software, automate APIs that don't exist
- Runs in the background — your cursor and active window stay untouched while AI works in another app

## Install as an Agent Plugin

For **Claude Code** and **Codex**. Bundles the MCP server with three skills, so
the agent knows the workflows, parameter formats, and permission-error recovery
paths up front.

1. **Install Macuse:** download from [macuse.app/download](https://macuse.app/download/), drag `Macuse.app` to `/Applications`, and launch it once
2. **Add the marketplace and install:**

   **Claude Code**

   ```shell
   /plugin marketplace add macuse-app/macuse-mcp
   /plugin install macuse@macuse-plugins
   ```

   **Codex**

   ```shell
   codex plugin marketplace add macuse-app/macuse-mcp
   codex plugin add macuse@macuse-plugins
   ```

3. **Approve OAuth:** on the first tool call, approve the authorization prompt in the Macuse window

Restart the session (or run `/reload-plugins` in Claude Code) if tools do not
appear immediately. Set `MACUSE_BINARY` if the app is not in `/Applications`.

### Skills Included

| Skill | Covers |
| --- | --- |
| `macuse-setup` | Install, connect a client, grant macOS permissions, diagnose a broken setup |
| `macuse-apps` | Calendar, Mail, Reminders, Notes, Messages, Location — routing, parameter shapes, workflow ordering |
| `macuse-computer-use` | Driving any Mac app's GUI — inspect/act/verify loop, element targeting, error recovery |

The agent loads a skill only when the task calls for it. Details live in
[`plugins/macuse/README.md`](plugins/macuse/README.md).

> **Codex users:** write operations currently fail because Codex auto-declines
> consent prompts from third-party MCP servers
> ([openai/codex#18896](https://github.com/openai/codex/issues/18896)). Reads
> work normally.

## Install for Claude Desktop

Claude Desktop doesn't support remote `http://` connectors directly, so this `.mcpb` is the one-click installer. For other MCP clients, see [Use With Other Clients](#use-with-other-mcp-clients) below.

1. **Install Macuse:**
   - Download from [macuse.app/download](https://macuse.app/download/)
   - Drag `Macuse.app` to `/Applications` and launch it
   - Grant the permissions the app prompts for
2. **Install the bundle:** download `macuse.mcpb` from [Releases](https://github.com/macuse-app/macuse-mcp/releases) and double-click to open in Claude Desktop
3. **Approve OAuth:** approve the authorization prompt that pops up — connection done

To uninstall, remove the entry from Claude Desktop settings.

## Use With Other MCP Clients

For clients that accept a custom command (Cursor, Codex, Raycast, VS Code, Warp, Zed, LM Studio, Windsurf, ChatWise, and more), skip this bundle and configure directly:

```json
{
  "mcpServers": {
    "macuse": {
      "command": "/Applications/Macuse.app/Contents/MacOS/macuse",
      "args": ["mcp"]
    }
  }
}
```

Per-client setup guides: [macuse.app/docs/clients](https://macuse.app/docs/clients/).

## Privacy & Permissions

- **Local-only.** All processing stays on your Mac. No cloud, no telemetry of your content.
- **Per-app permissions.** Allow, deny, or one-time-approve each AI client for each app it touches. Sensitive apps like password managers and banking re-confirm every time. Revoking an AI client automatically clears its app permissions.
- **Per-client OAuth.** Each MCP client gets its own authorization, manageable in Macuse settings.

## How This Works

Every install path is a thin shim over the same thing: `macuse mcp`, the CLI
built into the Macuse macOS app. All MCP protocol handling, OAuth, permissions,
and reconnection live inside the app.

- The **`.mcpb` bundle** is a ~130 LOC Node stdio wrapper that spawns `macuse mcp` and forwards JSON-RPC over stdin/stdout. It exists solely because Claude Desktop doesn't yet support `http://` remote connectors directly.
- The **plugin** skips Node entirely — a shell launcher execs the same binary, and adds the skills on top.

Override the binary path with the `MACUSE_BINARY` environment variable
(configurable in the Claude Desktop bundle UI). Default:
`/Applications/Macuse.app/Contents/MacOS/macuse`.

## Repo Layout

```
.claude-plugin/marketplace.json   Claude Code marketplace catalog
.agents/plugins/marketplace.json  Codex marketplace catalog
plugins/macuse/                   The plugin — manifests, launcher, skills
src/, bin/                        Node stdio wrapper for the .mcpb bundle
manifest.json                     .mcpb bundle manifest (Claude Desktop)
server.json                       MCP Registry entry
```

Both marketplaces point at `plugins/macuse` in this repo, so one push updates
every channel. Version strings across `package.json`, `manifest.json`, and both
plugin manifests are synced at release time by
`scripts/sync-manifest-version.js`.

Validate plugin changes before pushing:

```shell
claude plugin validate ./plugins/macuse --strict   # plugin manifest
claude plugin validate . --strict                  # marketplace catalog
```

## Requirements

- macOS 13.0 (Ventura) or later — Apple Silicon or Intel
- [Macuse](https://macuse.app) macOS app installed
- Node 20.8.1+ for the `.mcpb` bundle only (bundled by Claude Desktop's runtime); the plugin has no Node dependency

## Links

- Website: [macuse.app](https://macuse.app/)
- Download: [macuse.app/download](https://macuse.app/download/)
- Docs: [macuse.app/docs](https://macuse.app/docs/)
- Pricing: [macuse.app/pricing](https://macuse.app/pricing) — free tier with daily limits, or one-time Lifetime
- MCP spec: [modelcontextprotocol.io](https://modelcontextprotocol.io/)

## License

This MCPB bundle is MIT-licensed. The Macuse macOS application is a separate commercial product — see [macuse.app](https://macuse.app) for details.
