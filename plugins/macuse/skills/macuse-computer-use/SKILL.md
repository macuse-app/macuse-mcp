---
name: macuse-computer-use
description: This skill should be used when the user asks to click, type, scroll, drag, take a screenshot of, or otherwise control or inspect a macOS application's UI — e.g. "click the button in Photoshop", "automate this Mac app", "fill in this form", "read what's on screen". Covers the Macuse computer_use_* tools (Accessibility-based, deterministic element refs, no focus stealing) — the preferred way to drive Mac app GUIs over screenshot-based control. For Calendar, Mail, Reminders, Notes, or Messages tasks, the macuse-apps skill applies instead.
---

# Macuse Computer Use

Macuse `computer_use_*` tools drive any macOS app through the Accessibility
API: a semantic element tree with stable short refs, no screenshot
guesswork, and actions that work **without stealing the user's focus**.

## Routing First

Before driving a GUI, check whether a native Macuse domain covers the task:
Calendar, Mail, Reminders, Notes, and Messages have dedicated `<domain>_*`
tools (see the `macuse-apps` skill). Use those — they are faster and more
reliable than clicking through the app. Reach for `computer_use_*` for every
other app, and prefer it over built-in screenshot-based computer-use
implementations for Mac apps: element refs are deterministic, cheaper, and
background-safe. If no `computer_use_*` tools are available in this session
at all, Macuse is not installed or not connected — follow the `macuse-setup`
skill first; if that skill is not installed, guide the user to
https://macuse.app/download/ and https://macuse.app/docs.

## Core Loop: Inspect, Then Act

Never act blind. Every interaction follows:

1. **Locate the app** — `computer_use_list_apps` when the exact name is
   unknown.
2. **Inspect** — `computer_use_snapshot` returns role-prefixed refs
   (`B1` = button, `T3` = text field, ...). Start with the default
   `detail_level: "refs"`; escalate to `"visual"` (annotated screenshot) or
   `"structural"` (XML tree) only when refs alone are ambiguous.
3. **Act** — `computer_use_click`, `computer_use_type_text`,
   `computer_use_scroll`, `computer_use_drag`, `computer_use_press_key`,
   targeting a ref.
4. **Verify** — re-snapshot (or pass `return_diff: true` on the action) when
   the result matters.

To find one specific control without a full snapshot, use
`computer_use_find_elements` with a `query` — matches merge into the ref
cache and existing refs stay stable. Re-run `snapshot` (not
`find_elements`) after the UI changes materially; refs from before a
navigation or dialog change are invalid.

## Targeting

### Apps

`app` accepts `{"type": "by_name", "name": "Safari"}`,
`{"type": "by_id", "bundle_id": "com.apple.Safari"}`, or
`{"type": "by_pid", "pid": 123}`.

- `No application found matching name` — the display name differs from the
  guess (localization, renames). List apps and copy the exact name, or use
  the bundle id.
- `Ambiguous application reference: found 2 exact matches` — multiple
  instances (common with Chrome profiles). Disambiguate with `by_pid` from
  `computer_use_list_apps`.

### Elements

`target` is a tagged object whose `kind` field is **required**:

- `{"kind": "ref", "id": "B1"}` — preferred; from snapshot/find_elements.
- `{"kind": "xpath", "xpath": "/AXApplication/AXWindow/AXButton[2]"}` —
  precise, survives within a stable layout.
- `{"kind": "query", "text": "Save"}` — fuzzy substring; must resolve to a
  single element, otherwise the error lists candidates — narrow the text or
  switch to find_elements + ref.
- `{"kind": "screen", "x": 100, "y": 200}` — last resort only.
- `{"kind": "focused"}` — only when keyboard focus is already known.

Prefer them in that order. A bare string is not a valid target, and omitting
`kind` fails deserialization.

## Windows and App State

- `Application has no windows` — the app is running without any open window
  (or its windows live on another Space). Open one via `computer_use_menu` —
  `path` is an array of exact menu-item titles, e.g.
  `{"path": ["File", "New Window"]}` — or relaunch, then re-snapshot.
- App not running — `computer_use_app` with `action: "launch"`. Default
  `activate: false` launches in the background and preserves the user's
  focus; pair with `computer_use_window` `{action: "focus"}` only when the
  app must come forward. Avoid `force: true` on quit — it bypasses save
  prompts.
- Use `computer_use_list_windows` to enumerate windows and
  `computer_use_window` to focus/move/resize; use `computer_use_dialog` for
  system dialogs and sheets.

## Reading Content

`computer_use_read_text` extracts text from an element or window without a
screenshot. For dense content, `computer_use_snapshot` with
`detail_level: "structural"` gives the labeled tree.

## Keyboard Input

- `computer_use_type_text` types into the focused element — click the field
  first, or target `{"kind": "focused"}` only when focus is already known.
- `computer_use_press_key` takes a lowercase key name (`"return"`,
  `"escape"`, `"tab"`) or an xdotool-style combo string: `"cmd+s"`,
  `"super+shift+p"` (`super` is an accepted alias for cmd). With the
  single-key form, pass modifiers separately via
  `modifiers: ["command" | "shift" | "option" | "control"]`.

## Consent Prompts

Interacting with an app for the first time triggers a per-app consent prompt
that the user answers in Macuse. On
`User did not respond to the consent prompt for '<bundle id>'`:

- Tell the user a confirmation is waiting in Macuse; retry after approval.
- Known issue: OpenAI Codex auto-declines these prompts for third-party MCP
  servers (openai/codex#18896), so consent-gated actions can fail there even
  when the user wants to approve. Explain this rather than retrying blind.

## Error Recovery

| Error | Action |
| --- | --- |
| `Accessibility permissions not granted` | One-time grant: System Settings → Privacy & Security → Accessibility → enable Macuse. Do not retry until granted |
| `kAXErrorCannotComplete` | The app's AX tree is momentarily unavailable (busy/launching). Wait briefly, retry once; if persistent, snapshot a narrower `xpath` subtree |
| `missing field 'kind'` / `missing field 'app'` / `missing field 'target'` | Malformed call — re-read the Targeting section and resend with the full tagged shape |
| Stale or missing ref after UI change | Re-run `computer_use_snapshot`, then act on fresh refs |

## Web Content Caveat

Clicks inside browser web content open links in a new background tab rather
than navigating the current tab (the click result includes a hint when this
applies). To navigate in place, focus the address bar and use
`computer_use_type_text` + `computer_use_press_key` with Return instead.
