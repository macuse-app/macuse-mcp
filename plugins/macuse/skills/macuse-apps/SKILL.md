---
name: macuse-apps
description: This skill should be used when the user asks to read, search, create, or manage the macOS Calendar, Apple Mail, Reminders, Notes, or Messages apps, or asks for the Mac's current location — e.g. "check my email", "create a calendar event", "remind me to...", "search my notes", "text someone on iMessage". Applies whenever Macuse MCP tools (calendar_*, mail_*, reminders_*, notes_*, messages_*, location_get_current) are available. Covers tool selection, parameter formats, workflow ordering, and permission-error recovery.
---

# Macuse App Tools

Macuse exposes native macOS app control as MCP tools named `<domain>_<action>`:
`calendar_*`, `mail_*`, `reminders_*`, `notes_*`, `messages_*`, plus
`location_get_current`, which returns the Mac's current coordinates
(requires the user's one-time Location Services approval for Macuse; a
transient `kCLErrorDomain` failure usually resolves on a single retry).
Everything runs locally on the user's Mac.

## Tool Routing

- For Calendar, Mail, Reminders, Notes, and Messages tasks, always use these
  domain tools. Never drive these apps through screenshots or generic UI
  automation — domain tools are faster, work in the background, and do not
  steal the user's focus.
- For any other Mac app's GUI, use Macuse `computer_use_*` tools (covered by
  the `macuse-computer-use` skill).
- If no Macuse tools are available in this session at all, Macuse is not
  installed or not connected — follow the `macuse-setup` skill before
  attempting any of the workflows below. If that skill is not installed,
  guide the user to install the app from https://macuse.app/download/ and
  see https://macuse.app/docs for client setup.

## Universal Rules

These apply across all domains. Domain-specific details live in `references/`.

### 1. Search before modify

Every update/delete/move tool takes a reference to an existing item. Obtain
that reference from a search or list tool first (`mail_search_messages`,
`calendar_search_events`, `reminders_search_reminders`, `notes_search_notes`,
`messages_search_chats`). Never fabricate IDs, folder paths, list names, or
calendar names from memory — the most common failure class is referencing an
entity that does not exist under the guessed name.

### 2. Pass reference objects in their documented shape

Reference parameters are tagged objects, e.g.
`{"type": "by_id", "id": "..."}` or
`{"type": "by_reference", "subject": "...", "sender": "...", "date_received": "..."}`.
Copy field values verbatim from prior search results. Do not JSON-encode an
object into a string, and do not invent extra fields.

### 3. Prefer durable references over raw IDs

Numeric row IDs and sync-assigned UUIDs go stale when the underlying app
reindexes or an account re-syncs. When a tool offers a content-based
alternative (mail `by_reference`, calendar `by_title`), prefer it for write
operations, especially when time has passed since the search. On any
"not found" error for an ID that worked before, re-run the search and retry
once with the fresh reference; if the retry also fails, stop and report
instead of trying further variants.

### 4. Dates are RFC 3339 / ISO 8601

Always include a timezone offset (`2026-08-03T14:00:00+10:00`). Ensure
`start_date` precedes `end_date`. Never send natural-language dates.

### 5. Respect documented limits

- `limit` parameters: stay within each tool's documented maximum (commonly
  100). Page with `offset` instead of raising `limit`.
- Filter arrays (calendars, reminder lists): at most 10 entries after
  deduplication.
- Batch reference arrays: check each tool's per-call cap in its schema and
  the domain reference before batching.

### 6. Scalars stay scalars

Parameters typed as a single string (`account`, `mailbox`, `sender`) take one
value, not an array. To cover multiple accounts, issue multiple calls or omit
the filter.

### 7. Do not blind-retry environment errors

Permission and app-state errors are not fixed by retrying with different
parameters. Recognize them and follow the recovery table below.

## Write Operations and Consent

Write tools (send, delete, move, create on some setups) may trigger a consent
prompt that the user answers in the Macuse app. If a call fails with
"User did not respond to the consent prompt":

- Tell the user a confirmation dialog is waiting in Macuse and retry after
  they approve.
- Known issue: OpenAI Codex auto-declines these prompts for third-party MCP
  servers (openai/codex#18896), so write tools can fail there even when the
  user wants to approve. Explain this and suggest performing the action in a
  client with working consent, or confirming intent in chat and using a
  read-only alternative.

Destructive-action safety: `calendar_cancel_event` and
`reminders_delete_reminder` are permanent; `notes_delete_note` and
`mail_delete_message` are recoverable (Recently Deleted / Trash);
`messages_send_messages` cannot be unsent. Prefer `mail_move_message` to
archive over deletion, and confirm destructive intent with the user when the
request is ambiguous.

## Permission and Environment Recovery

| Error contains | Meaning | Action |
| --- | --- | --- |
| `Full Disk Access required` / `permission denied` (mail, messages, notes) | One-time macOS grant missing | Ask the user to enable Macuse in System Settings → Privacy & Security → Full Disk Access, then retry |
| `Accessibility permissions not granted` | One-time macOS grant missing | System Settings → Privacy & Security → Accessibility → enable Macuse |
| `Mail app is not running` / `Messages app is not running` | Write path needs the app alive | Launch it via `computer_use_app` (`action: "launch"`, keep `activate: false`), then retry — or ask the user to open the app if computer_use tools are unavailable |
| `EKCADErrorDomain #1021` (too many EKEventStore instances) | Transient Macuse-side state | Retry once after a short pause; if persistent, ask the user to restart Macuse. Do not hammer |
| `User did not respond to the consent prompt` | Consent pending, declined, or client cannot show it | See "Write Operations and Consent" above |

For first-time connection, missing tools, or macOS permission grants, follow
the `macuse-setup` skill (or https://macuse.app/docs when it is not
installed).

## Additional Resources

Consult the domain reference before non-trivial work in that domain:

- **`references/mail.md`** — mailbox role names vs. localized paths, account
  resolution, message reference strategies, attachments, compose/reply/move
- **`references/calendar.md`** — calendar references, recurrence rules and
  scopes, rescheduling conflicts, cross-account moves
- **`references/reminders.md`** — list resolution, recurrence, alarms,
  priorities, list management
- **`references/notes.md`** — reading large notes with offset continuation,
  folders, write formatting
- **`references/messages.md`** — chat references, history retrieval, sending
  safety
