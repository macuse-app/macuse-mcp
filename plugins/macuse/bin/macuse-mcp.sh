#!/bin/sh
# Bridge the plugin to the Macuse macOS app's built-in stdio MCP server.
#
# The binary ships with the app, not with this plugin, so its path is resolved
# at launch instead of being baked into .mcp.json. Override MACUSE_BINARY when
# the app lives outside /Applications.

MACUSE_BINARY="${MACUSE_BINARY:-/Applications/Macuse.app/Contents/MacOS/macuse}"

if [ ! -x "$MACUSE_BINARY" ]; then
	echo "macuse: binary not found at $MACUSE_BINARY" >&2
	echo "macuse: install the app from https://macuse.app/download/ or set MACUSE_BINARY" >&2
	exit 1
fi

exec "$MACUSE_BINARY" mcp "$@"
