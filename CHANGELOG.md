# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-09-15

### Added
- `webhookMethods` (`checkExists`, `create`, `delete`) in `ClientifyTrigger`: activating a workflow now registers its URL in Clientify through `POST /v2/webhooks/{entity}/`, re-enables a slot that was switched off, and deactivating it frees the slot with `DELETE /v2/webhooks/{entity}/`. This is the lifecycle the n8n Creator Portal review requires.
- `clientifyApi` credential on the trigger node, needed to manage the webhook through the API.
- Six new events: `contact.deleted`, `deal.deleted`, `task.deleted`, and the `budget.*` and `product.*` families, matching the six CRM webhook slots.
- **Receive Both Entity Events** option, to run the workflow for the saved and the deleted event of the entity, since a slot always delivers both.
- Shared secret: the node generates one per registration, stores it as the webhook's `X-Clientify-Secret` header and drops payloads that do not carry it. Clientify does not sign the body, so this is what identifies a notification as ours.
- `hook_id` in the output, taken from `hook.id`.
- Dark icon variant (`clientify.dark.svg`), the white version of the isotype that the brand guidelines require on dark backgrounds. Both nodes and the credential now declare `icon: { light, dark }`.
- `test/lifecycle.test.cjs` with 24 checks over the webhook lifecycle, the payload handling and the error mapping of the action node, wired as `npm test`.

### Changed
- The trigger reads the documented payload shape `{"hook": {...}, "data": {...}}`, where `data` is the full resource. The previous shapes (entity at the root or nested under `data`) still work.
- `ClientifyApi` no longer re-throws raw errors: every failure goes through a helper that keeps validation errors as `NodeOperationError` and wraps anything else in `NodeApiError`.
- Codex category `Marketing` replaced with the supported value `Marketing & Content` in both node metadata files.
- Credential documentation URL now points at the current v2 API reference.
- `TRIGGERS_REFERENCE.md` rewritten around the registration lifecycle, the one-webhook-per-entity limit and Clientify's delivery behaviour (5 s timeout, any answer counts as delivered, duplicates, no guaranteed order).

### Notes
- Clientify exposes six fixed webhooks, one per entity, each holding a single address. Two active workflows cannot listen to the same entity: the second one now fails on activation with an explicit error instead of repointing an existing integration.
- Registration requires a public HTTPS webhook URL; Clientify rejects local or private addresses.

## [0.2.19] - 2026-06-19

### Changed
- Use `NodeConnectionTypes.Main` instead of the raw `"main"` string for node inputs/outputs in both `ClientifyApi` and `ClientifyTrigger`.
- Wrap HTTP/API failures in `NodeApiError` so n8n surfaces the status code and response details; internal validation errors keep raising `NodeOperationError`.
- Simplify the `build` script and remove the legacy `ClientifyMcp` icon-copy steps.
- Fix `homepage` and `repository.url` to point to `ClientifySL/clientify_n8n` (required for npm provenance).

### Added
- Codex metadata files (`ClientifyApi.node.json`, `ClientifyTrigger.node.json`) with `Sales` and `Marketing` categories.
- GitHub Actions workflow (`.github/workflows/publish.yml`) to publish to npm with provenance on `v*` tags.

### Removed
- Legacy `nodes/ClientifyMcp/` folder (icons already live in each node's folder).
