# n8n-nodes-clientify

[![npm version](https://badge.fury.io/js/n8n-nodes-clientify.svg)](https://www.npmjs.com/package/n8n-nodes-clientify)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Connect n8n to Clientify CRM via the Clientify REST API using API keys (`Authorization: Token <apiKey>`).

This package stays aligned with the action catalog by generating actions/fields from a single shared connector spec at build time.
Under the hood, requests are executed directly via n8n’s HTTP request helper with `Authorization: Token <apiKey>`.

## Installation

### In n8n (GUI)

1. Go to **Settings** → **Community Nodes**
2. Click **Install**
3. Enter: `n8n-nodes-clientify`
4. Click **I understand the risks** and then **Install**
5. **Restart n8n** (important - it won't show up until you do)

### Via npm (Command Line)

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-clientify
# Restart n8n
```

### Docker

Persist the nodes directory, or you’ll lose the node on restart:

```yaml
volumes:
  - n8n_data:/home/node/.n8n
```

Or enable auto-reinstall:

```yaml
environment:
  - N8N_REINSTALL_MISSING_PACKAGES=true
```

## Prerequisites

You'll need:
- n8n 2.x
- Node.js 20+
- A Clientify API key

## Configuration

1. In n8n, go to **Credentials** → **New**
2. Search for **"Clientify API"**
3. Enter your **API Key**
4. Click **Save**

## Nodes

### Clientify (action node)

1. Add a node and search for **Clientify**.
2. Pick an **Action**.
3. Fill fields directly or map them from previous nodes using expressions.

### Clientify Trigger

Starts the workflow when Clientify reports a change in the CRM. It registers its own webhook:

- Activating the workflow registers its URL in Clientify, and deactivating it removes it. Nothing has to be configured by hand in **Settings → Integrations → Webhooks**.
- It needs the same **Clientify API** credential as the action node, and a **public HTTPS** webhook URL: Clientify rejects local or private addresses, so set `WEBHOOK_URL` to the public address of your n8n.
- Clientify keeps **one webhook per entity** (contacts, companies, deals, tasks, budgets, products), each with a single address. If the slot already points somewhere else, the workflow refuses to activate rather than repointing an existing integration.
- Each slot delivers both the saved and the deleted event of its entity. The node emits only the selected one unless **Receive Both Entity Events** is enabled.
- Payloads are checked against a shared secret the node registers with the webhook, since Clientify does not sign the body.

For events, payload formats and delivery behaviour, see `TRIGGERS_REFERENCE.md`.

## Available Operations

Operations are generated from the bundled catalog (currently 81 actions).

## Mapping (inputs from earlier steps)

Mapping is field-based:

- Use the field’s **+** button (variable picker), or
- Toggle **=** and use expressions like `{{$node["Create Contact"].json.id}}`.

## Troubleshooting

- If the node does not appear after install, restart n8n.
- If the API returns `401`, verify your API key.
- If an operation requires an ID, ensure you mapped the correct numeric ID from a previous node.

## Support

- **Clientify API docs:** https://api-plus.clientify.com/api/docs/v2/scalar/
- **Clientify webhooks guide:** https://api-plus.clientify.com/api/docs/v2/webhooks/
- **Triggers reference:** [`TRIGGERS_REFERENCE.md`](TRIGGERS_REFERENCE.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Clientify