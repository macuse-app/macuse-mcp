#!/bin/bash
# Macuse setup diagnosis. Prints KEY=VALUE lines; read-only, safe to re-run.

APP_PATH="/Applications/Macuse.app"

if [ -d "$APP_PATH" ]; then
  echo "APP_INSTALLED=yes"
  echo "APP_VERSION=$(defaults read "$APP_PATH/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo unknown)"
else
  echo "APP_INSTALLED=no"
fi

# Desktop app and the CLI stdio bridge share one binary; the bridge runs
# "... macuse mcp". Match the installed binary path, exclude bridge
# processes. Do not anchor on end-of-line: desktop mode carries extra args
# (e.g. --crash-reporter-server=...).
if ps -axo args | grep "Contents/MacOS/macuse" | grep -v grep | grep -vq "MacOS/macuse mcp"; then
  echo "APP_RUNNING=yes"
else
  echo "APP_RUNNING=no"
fi

# Any HTTP status (401 expected when unauthenticated) means the MCP server
# is up; no response means it is not listening.
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:35729/mcp 2>/dev/null)
if [ -n "$HTTP_CODE" ] && [ "$HTTP_CODE" != "000" ]; then
  echo "MCP_SERVER=up http_$HTTP_CODE"
else
  echo "MCP_SERVER=down"
fi

