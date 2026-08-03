# Notes

Reading Notes requires Full Disk Access (see the recovery table in
SKILL.md).

## Reading notes

- `notes_read_note` takes `references` — a single reference or an array,
  processed up to 5 per call. Each reference is a plain string (treated as
  title), `{"type": "by_id", "id": "..."}`, or
  `{"type": "by_title", "title": "...", "folder": "..."}`. Add `folder` to
  disambiguate duplicate titles.
- **Large notes are truncated to fit the response.** When the result is
  marked truncated and returns `next_offset`, call `notes_read_note` again
  with `offset: <next_offset>` and keep going until truncation stops. Never
  report a truncated note as complete.
- `format` is `markdown` (default), `html`, or `text`.

## Searching and folders

- `notes_search_notes` for content lookup; `notes_list_folders` returns the
  real folder hierarchy (paths like `Work/Projects`). Folder filters are
  path-aware — copy paths from the listing.
- Multiple accounts (iCloud, On My Mac, Gmail): scope with
  `notes_list_accounts` output when the user has duplicates across
  accounts.

## Writing notes

- `notes_write_note` accepts Markdown, including task lists (`- [ ]`).
- Apple Notes converts content through HTML on write; complex formatting may
  not round-trip byte-identically on later reads. For heavy edits of an
  existing formatted note, prefer appending or targeted edits over full
  rewrite to minimize conversion loss.
- `notes_delete_note` moves to Recently Deleted (30-day recovery);
  `notes_restore_note` recovers it.
