# Mail

Reading works via direct database access (needs Full Disk Access). Write
operations (compose, reply, move, delete, read-state) drive Mail.app itself,
so Mail must be running — launch it in the background first if needed.

## Mailboxes: role words beat literal names

The single largest source of Mail failures is guessing mailbox names.

- For the six special mailboxes, pass the plain English role word: `Inbox`,
  `Drafts`, `Sent`, `Trash`, `Junk`, `Archive`. Macuse resolves the role to
  each account's real (often localized) folder — `Entwürfe`, `已发送邮件`,
  etc. Never pass a localized name directly.
- For custom folders, call `mail_list_mailboxes` first and copy the exact
  path from the result. Nested paths must match verbatim, including
  separators and special characters.
- `Mailbox not found: <path>` means the guessed path does not exist under
  that account — list mailboxes, find the closest real path, retry once.

## Accounts

- `account` is a single string (name, email, or UUID; partial match) — never
  an array. `No account matching '["..."]'` indicates an array was sent.
- Ambiguity: a filter can match multiple accounts; results are unioned and
  the response lists per-account UUIDs. Pass a UUID to scope precisely.
- When compose/reply fails on account resolution, call `mail_list_accounts`
  and use the exact name or address from the result.

## Message references

`mail_get_messages`, `mail_move_message`, `mail_delete_message`,
`mail_reply_message`, etc. accept three reference forms:

- `{"type": "by_id", "id": 12345}` — fastest, but the row ID goes stale when
  Mail rebuilds its index. Fine immediately after a search in the same
  session.
- `{"type": "by_reference", "subject": "...", "sender": "...",
  "date_received": "..."}` — survives reindexing. **Preferred for write
  operations.** Copy `date_received` verbatim from the search result to
  round-trip correctly.
- `{"type": "by_signature", "subject": "...", "sender": "..."}` — most
  recent match when no exact date is available.

On `Message with ID not found`, do not retry the same ID — re-search and use
`by_reference`.

## Searching

- Default search scope is subject + sender (fast). To find messages sent TO
  someone, use `search_in: ["recipients"]` with `query` — the `sender` filter
  only matches the From address.
- `body` and `recipients` scopes scan message files and are slow; keep the
  date window tight.
- Date defaults: `start_date` defaults to 7 days ago. Widen explicitly for
  older mail.

## Attachments

Before `mail_get_attachment`, confirm the message actually has attachments
via `mail_get_messages` (search-level `has_attachments` is a thread-level
approximation). `Attachment index 0 not found (message has 0 attachments)`
means the flag lied — trust `get_messages`.

## Compose, reply, move

- Prefer `mail_move_message` (archive) over `mail_delete_message`.
- Moving to a special folder: use the role word as the destination.
- Reply/compose place content through Mail's UI; if the error mentions
  focus or Accessibility, ensure the Accessibility grant is in place.
