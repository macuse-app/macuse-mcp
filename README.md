# Macuse MCP

MCPB Bundle for connecting Claude Desktop to [Macuse](https://macuse.app).

## What is Macuse?

Macuse is an MCP server for macOS that connects AI assistants to native apps and system automation.

| Toolbox             | Capabilities                                                                       |
| ------------------- | ---------------------------------------------------------------------------------- |
| **Calendar**        | View calendars, search events, create/reschedule meetings, find free time slots   |
| **Reminders**       | Create reminders with due dates and priorities, mark complete, search across lists |
| **Mail**            | Search emails, read content, compose/send/reply, move between mailboxes           |
| **Messages**        | Search iMessage conversations, send messages, retrieve chat history               |
| **Notes**           | Browse folders, full-text search, create and edit notes                           |
| **Contacts**        | Look up contacts by name/email/phone/company                                      |
| **Maps & Location** | Place search, directions, travel time, current location                           |
| **UI Viewer**       | Inspect any app's UI hierarchy, read visible text, find elements                  |
| **UI Controller**   | Click buttons, type text, press shortcuts, control any application                |

All processing runs locally on your Mac.

## Why This MCP Bundle?

Claude Desktop doesn't support `http://` remote connectors directly. This `.mcpb` provides a way to connect without manually editing configuration files.

## Installation

### Prerequisites

1. Download Macuse from https://macuse.app/download/
2. Drag `Macuse.app` into `/Applications`
3. Launch and grant the necessary permissions

### Install MCP Bundle

Download `macuse.mcpb` from [Releases](https://github.com/macuse-app/macuse-mcp/releases) and double-click to install in Claude Desktop.

To uninstall, remove it from Claude Desktop settings.

## Alternative: Direct CLI

For MCP clients that support custom commands, you can skip this MCP bundle and configure directly:

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

## First Connection

1. Macuse launches automatically if not running
2. Approve the OAuth authorization prompt
3. Connection established

Each client gets separate authorization, manageable in Macuse settings.

## Links

- Macuse Website: https://macuse.app/
- Macuse Download: https://macuse.app/download/
- MCP: https://modelcontextprotocol.io/
