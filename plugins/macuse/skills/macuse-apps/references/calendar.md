# Calendar

## Calendar references

- `{"type": "by_title", "title": "Work"}` is the durable form — titles
  survive account re-syncs. `by_id` UUIDs are reissued when a CalDAV account
  re-syncs; only use an ID obtained from `calendar_list_calendars` in the
  current session.
- Stale-ID errors include the current calendar list inline — pick the right
  calendar from that list instead of re-calling `list_calendars`.
- Calendar filter arrays accept at most 10 entries after deduplication.
- `No matching Calendars found for filters` means the guessed titles do not
  exist — call `calendar_list_calendars` and use exact titles.

## Choosing the right tool

- Time changes → `calendar_reschedule_event`. Everything else (title, notes,
  location, alarms, calendar move, recurrence) → `calendar_update_event`.
- Before creating events in a busy window, check
  `calendar_find_available_times` to avoid conflicts.

## Recurring events

- Create with a `recurrence` spec:
  `{"frequency": "weekly", "days_of_week": ["monday"], "interval": 1}`.
  Monthly by date uses `days_of_month` (negative counts from month end);
  "3rd Thursday" patterns use `days_of_week` + `set_positions: [3]`.
  `end_date` and `occurrence_count` are mutually exclusive.
- Target a single occurrence with `by_id` + `occurrence_date` (ISO 8601
  start of that occurrence). Omit `occurrence_date` to target the master.
  Both `occurrence_date` and `scope` apply to update, reschedule, and
  cancel alike.
- `scope` controls blast radius: `this_event` (default) vs
  `this_and_future`. Updating `recurrence` itself always applies to this and
  future occurrences; pass `recurrence: null` to stop repeating.
- `Failed to update: Another instance of this event occurs on this date`
  means the reschedule collides with a sibling occurrence of the same
  series. Pick a non-colliding time, or cancel the colliding occurrence
  first (`scope: "this_event"`).

## Cross-account moves rewrite IDs

Moving an event between sources (e.g. iCloud → Google) makes EventKit issue
a **new** event ID; the old one dies immediately. Always use the ID returned
by the move for any follow-up call. Never chain from the pre-move ID.

## Deletion

`calendar_cancel_event` is permanent (no trash). For recurring events,
double-check `scope` before cancelling — `this_and_future` on the first
occurrence deletes the whole series.
