# Clientify Triggers Reference

**Package:** n8n-nodes-clientify
**Total events:** 12 (6 entities × saved/deleted)

The Clientify Trigger registers its own webhook in Clientify when the workflow is activated and removes it when the workflow is deactivated. It needs the **Clientify API** credential, the same one used by the action node.

## How the registration works

| Workflow action | What the node does in Clientify |
|---|---|
| Activate | Reads `GET /v2/webhooks/{entity}/`, and if the slot is free registers this workflow's production URL with `POST /v2/webhooks/{entity}/` |
| Activate, slot already holding this URL | Leaves it in place, and switches it back on with `POST /v2/webhooks/{entity}/activate/` if it was disabled |
| Activate, slot holding another address | Stops with an error and changes nothing, so an existing integration is never repointed |
| Deactivate | Removes the address with `DELETE /v2/webhooks/{entity}/`, leaving the slot free — unless the slot has since been taken by another address, which is left untouched |

## One webhook per entity

Clientify has six fixed webhooks, one per CRM entity, and each one holds a single address. There is no way to add a seventh or to send the same entity to two addresses.

That has three consequences:

- Two active workflows cannot listen to the same entity. The second one fails on activation with an explicit error instead of hijacking the first.
- Each slot always delivers both events of its entity. Selecting `contact.saved` also receives `contact.deleted`; the node discards the other one unless **Receive Both Entity Events** is enabled.
- If the account already uses an entity webhook for another integration, free it first in Clientify (**Settings → Integrations → Webhooks**), or point that address at a workflow that forwards the events where they are needed.

## Available events

| n8n label | Payload event | Entity slot |
|---|---|---|
| Contact Saved | `contact.saved` | `contacts` |
| Contact Deleted | `contact.deleted` | `contacts` |
| Company Saved | `company.saved` | `companies` |
| Company Deleted | `company.deleted` | `companies` |
| Deal Saved | `deal.saved` | `deals` |
| Deal Deleted | `deal.deleted` | `deals` |
| Task Saved | `task.saved` | `tasks` |
| Task Deleted | `task.deleted` | `tasks` |
| Budget Saved | `budget.saved` | `budgets` |
| Budget Deleted | `budget.deleted` | `budgets` |
| Product Saved | `product.saved` | `products` |
| Product Deleted | `product.deleted` | `products` |

`*.saved` covers both creation and update. A deleted event carries the whole resource as it was just before disappearing, not only its ID.

## Requirements

- The webhook URL must be a **public HTTPS address**. Clientify rejects `http://`, private hosts and internal IPs, so an n8n reachable only on `localhost` cannot register the webhook. Serve n8n over HTTPS on a public domain (or a tunnel) and set `WEBHOOK_URL` accordingly.
- The credential's API key must belong to an account with the API addon, and the user must be an account administrator.

## Security

Clientify does not sign the request body: there is no HMAC and no timestamp. When the node registers the webhook it generates a random secret and stores it as the `X-Clientify-Secret` header of that registration, then checks it on every incoming call and silently ignores payloads that do not carry it.

A webhook configured by hand from the Clientify panel has no secret, so no check is applied in that case.

## Payload

Clientify posts `{"hook": {...}, "data": {...}}`, where `data` is the full resource:

```json
{
  "hook": {
    "id": 412,
    "event": "contact.saved",
    "target": "https://n8n.example.com/webhook/abc/webhook"
  },
  "data": {
    "id": 88123456,
    "first_name": "Ada",
    "last_name": "Lovelace",
    "status": "lead"
  }
}
```

The older shapes (`event` at the root, the entity under its own key, or nested in `data`) are still accepted.

## Output

The resource is flattened onto the output item, with an ID alias per entity family and the untouched payload in `_raw`:

```json
{
  "event": "contact.saved",
  "hook_id": 412,
  "contact_id": 88123456,
  "id": 88123456,
  "first_name": "Ada",
  "last_name": "Lovelace",
  "status": "lead",
  "_raw": { "hook": { "...": "..." }, "data": { "...": "..." } }
}
```

| Event family | Alias |
|---|---|
| `contact.*` | `contact_id` |
| `company.*` | `company_id` |
| `deal.*` | `deal_id` |
| `task.*` | `task_id` |
| `budget.*` | `budget_id` |
| `product.*` | `product_id` |

## Delivery behaviour

Worth knowing when designing the workflow, because it comes from Clientify and not from n8n:

- **5 second timeout.** The trigger answers as soon as it receives the call, so the rest of the workflow runs after the response.
- **Any answer counts as delivered**, including 4xx and 5xx. A notification is only retried when the server does not answer at all, up to 5 times with 1, 2, 4, 8 and 16 second waits.
- **The same notification can arrive twice**, and there is no delivery ID. Deduplicate on `event` plus the resource ID.
- **Order is not guaranteed.** Two consecutive changes to the same record can arrive swapped, so trust the content of each payload rather than the arrival order.
- **Writes made through the API with your own key do not come back**, except for bulk actions and imports, which are processed in the background and do notify today.
- **There is no delivery log** for CRM webhooks. Record what is needed on arrival.

## Example patterns

```text
Clientify Trigger: Contact Saved  -> IF: email exists         -> Add tag / send email
Clientify Trigger: Deal Saved     -> IF: status is won        -> Notify sales channel
Clientify Trigger: Budget Saved   -> IF: status is accepted   -> Create order downstream
Clientify Trigger: Contact Saved  -> Receive Both Entity Events + Switch on event -> Sync and purge
```

## Troubleshooting

| Symptom | Cause |
|---|---|
| Activation fails with "already pointing to …" | Another integration or workflow owns that entity webhook |
| Activation fails with "only accepts public HTTPS" | n8n is exposing a local or non-HTTPS webhook URL |
| Activation fails with 401 | The API key in the credential is not valid |
| Activation fails with 403 | The account does not have the API addon, or the user is not an administrator |
| Workflow never runs | Check in Clientify that the webhook is on, and that the selected event matches what is being changed |
| Deleted events never arrive | Enable **Receive Both Entity Events**, or create a second workflow for the deleted event of another entity |
