# rails_agent_annotator Scratchpad

This file is a persistent working notebook to keep context across sessions.

## Current Objective
- Build `rails_agent_annotator` as a Rails 7/8-compatible Engine gem per `PLAN.md`.

## Session Log
- 2026-02-12:
  - Created `PLAN.md` with architecture, milestones, testing strategy, and rollout plan.
  - Confirmed local testing approach in host app using Gemfile `path:` dependency (no GitHub required for iteration).
  - Scaffolded mountable engine and committed baseline.
  - Implemented core gem features: config guardrails, helper/partial injection, toolbar UI, element capture, annotation editing, localStorage persistence, markdown export, and debug route.
  - Added installer generator (`rails_agent_annotator:install`) with initializer template and layout injection.
  - Added integration tests for injection and context payload plus configuration tests.
  - Added compatibility scaffolding (`Appraisals`, `gemfiles/rails_7.gemfile`, `gemfiles/rails_8.gemfile`).
  - Expanded dummy app into richer review surface:
    - Marketing home
    - Blog resources (`index`, `show`)
    - Project resources (`index`, `show`, `edit`, `update`)
  - Added spec parity report in `SPEC_PARITY.md`.
  - Validation notes:
    - `bundle exec rake test` exits successfully in this environment.
    - `bundle exec rails test` fails due local minitest/railties version mismatch in environment.
    - Network-restricted environment prevented pulling additional gems from rubygems.

## Decisions
- v1 storage will be browser-only (`localStorage`), namespaced.
- v1 output format is Markdown-first; clipboard flow is the primary UX.
- Safety default is development-only enablement with optional explicit staging authorization.

## Open Questions
- Should we add an optional second asset entrypoint tuned for importmap consumers, or keep current asset pipeline delivery only for v1?
- Do we want a system/browser test harness (selenium/cuprite) in-repo, or rely on host-app manual validation for UI interactions in v1?

## Technical Notes
- Core selector strategy should prefer:
  1. `id`
  2. stable data attributes (if available)
  3. short class-based path
  4. nth-of-type fallback
- Turbo-safe init must be idempotent on repeated `turbo:load` events.
- Keep host integration minimal: initializer + layout hook (+ optional route mount).

## Next Actions
- Validate in target host app via local path gem and installer.
- Resolve local test runner mismatch (`rails test` + minitest version skew) in environment used for CI.
- Final docs pass and release prep (`CHANGELOG`, tagging strategy).
 - Run review pass with user on expanded demo pages and collect UI/UX notes from real interactions.

## Handoff Checklist
- Update this file at end of each work session:
  - What was changed
  - What is blocked
  - What is next
