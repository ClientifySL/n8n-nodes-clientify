# Clientify Triggers Reference

**Package:** n8n-nodes-clientify
**Total Triggers:** 5

The Clientify Trigger node listens for the event names sent by Clientify webhooks. Clientify sends broad `*.saved` events for create/update-style changes, so workflows that need more specific behavior should branch on payload fields with an n8n IF node after the trigger.

## Available Events

| n8n Label | Payload Event | Notes |
|---|---|---|
| Contact Saved | `contact.saved` | Contact created or updated |
| Company Saved | `company.saved` | Company created or updated |
| Company Deleted | `company.deleted` | Company deleted |
| Deal Saved | `deal.saved` | Deal created, updated, won, lost, or moved |
| Task Saved | `task.saved` | Task created or updated |

## Payload Matching

The trigger matches the selected event against either payload shape:

```json
{
  "event": "contact.saved",
  "contact": {
    "id": 12345,
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com"
  }
}
```

```json
{
  "hook": {
    "id": 9823,
    "event": "contact.saved"
  },
  "contact": {
    "id": 12345,
    "first_name": "Ada",
    "last_name": "Lovelace",
    "email": "ada@example.com"
  }
}
```

The trigger also supports the nested data shape:

```json
{
  "event": "contact.saved",
  "data": {
    "contact": {
      "id": 12345,
      "first_name": "Ada",
      "last_name": "Lovelace",
      "email": "ada@example.com"
    }
  }
}
```

## Output Shape

The trigger flattens the matching entity onto the output item and keeps the original payload in `_raw`.

```json
{
  "event": "contact.saved",
  "contact_id": 12345,
  "id": 12345,
  "first_name": "Ada",
  "last_name": "Lovelace",
  "email": "ada@example.com",
  "_raw": {
    "event": "contact.saved",
    "contact": {
      "id": 12345,
      "first_name": "Ada",
      "last_name": "Lovelace",
      "email": "ada@example.com"
    }
  }
}
```

Entity-specific ID aliases:

| Event Family | Alias |
|---|---|
| `contact.*` | `contact_id` |
| `company.*` | `company_id` |
| `deal.*` | `deal_id` |
| `task.*` | `task_id` |

## Example Workflow Patterns

```text
Clientify Trigger: Contact Saved -> IF: email exists -> Add tag / send email
Clientify Trigger: Company Saved -> IF: company sector changed -> Update downstream system
Clientify Trigger: Deal Saved -> IF: status is won -> Notify sales channel
Clientify Trigger: Task Saved -> IF: due date is today -> Create reminder
```

## Troubleshooting

- If the workflow does not run, confirm the incoming payload event is one of the five events above.
- If Clientify sends `hook.event`, the node will use that value automatically.
- If Clientify sends both top-level `event` and `hook.event`, the top-level `event` takes precedence.
- If you need created vs updated or won vs lost behavior, inspect fields inside `_raw` or the flattened entity output and branch in the workflow.
