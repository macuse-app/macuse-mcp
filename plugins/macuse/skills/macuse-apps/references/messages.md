# Messages

Reading requires Full Disk Access; sending requires Messages.app running.

## Chat references

`messages_get_chat` accepts a plain string (chat_id, phone/email, or display
name) or a tagged object:

- `{"type": "by_id", "chat_id": "..."}` — chat_id from
  `messages_search_chats` (e.g. `+14155551234` or `chat123456789`). Most
  precise.
- `{"type": "by_participants", "participants": ["+1415...", "a@b.com"]}` —
  phone numbers or emails; matches group chats containing exactly these
  participants.
- `{"type": "by_display_name", "display_name": "Family"}` — fuzzy, for
  named group chats.

Never JSON-encode the object into a string. When a display name is
ambiguous, run `messages_search_chats` first and use the returned chat_id.

## History and search

- `messages_get_chat` `limit`: default 50, max 500.
- `messages_search_messages` searches content across chats;
  `messages_search_chats` finds conversations. Search first, then pull
  history by chat_id.

## Sending

`messages_send_messages` delivers immediately and **cannot be unsent**.
Before sending: confirm the recipient resolution (exact chat_id or
phone/email, not a fuzzy name) and echo the final text to the user when the
request left any room for interpretation. It may also trigger a consent
prompt in Macuse — see SKILL.md.
