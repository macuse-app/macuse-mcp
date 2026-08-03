# Reminders

## List resolution

- Call `reminders_list_lists` before referencing any list by name.
  `No matching Lists found for filters` means the guessed titles do not
  exist. List filter arrays accept at most 10 entries after deduplication.
- List references accept a string (UUID auto-detected as id, otherwise
  title) or `{"type": "by_title", "title": "..."}`. Omit `list` on create to
  use the default list.

## Creating and updating reminders

- `title` is required on create — never omit it.
- `due_date` is ISO 8601; set `all_day: true` for date-only reminders.
- `priority` accepts `none`/`low`/`medium`/`high` or numeric 0–9.
- `recurrence` uses the same spec as calendar
  (`{"frequency": "weekly", "days_of_week": ["monday"]}`) and **requires a
  due_date**.
- `alarms`: up to 8 entries, each exactly one of `{"before_minutes": N}`,
  `{"absolute_date": "ISO 8601"}`, or `{"location": {...}}` (geofence with
  `title`, `latitude`, `longitude`, `proximity: "enter"|"leave"`).

## Completing vs deleting

`reminders_complete_reminder` marks done; `reminders_delete_reminder` is
permanent. When the user says "remove" an already-done item, prefer
complete unless deletion is explicit.

## List management

`reminders_create_list`, `reminders_update_list` (name, color, make
default), and `reminders_delete_list` are available. Deleting a list asks
the user for confirmation through Macuse and removes all its reminders —
never pass a force flag on the first attempt.
