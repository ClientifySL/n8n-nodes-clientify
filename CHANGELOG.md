# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- The node source now lives in its own **public** repository,
  `ClientifySL/n8n-nodes-clientify`. npm only accepts provenance attestations
  from public repositories, and provenance is mandatory for n8n's Creator Portal
  verification since 2026-05-01 — which is what makes the node installable on
  n8n Cloud. Deployment of Clientify's own n8n image stays in the private
  repository and now installs this package from npm instead of building it from
  source. `homepage`/`repository`/`bugs` updated accordingly.

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
