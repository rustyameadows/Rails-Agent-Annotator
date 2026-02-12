# rails_agent_annotator Scratchpad

This file is a persistent working notebook to keep context across sessions.

## Current Objective
- Build `rails_agent_annotator` as a Rails 7/8-compatible Engine gem per `PLAN.md`.

## Session Log
- 2026-02-12:
  - Created `PLAN.md` with architecture, milestones, testing strategy, and rollout plan.
  - Confirmed local testing approach in host app using Gemfile `path:` dependency (no GitHub required for iteration).

## Decisions
- v1 storage will be browser-only (`localStorage`), namespaced.
- v1 output format is Markdown-first; clipboard flow is the primary UX.
- Safety default is development-only enablement with optional explicit staging authorization.

## Open Questions
- Which JS packaging target should we prefer first for broad Rails 7/8 compatibility:
  - importmap-first with plain ES modules
  - jsbundling-friendly package output
  - dual support from engine assets
- Should v1 include a tiny visual marker for “copied successfully” state in toolbar?
- Should we include a debug route/controller in first pass or defer until core flow is stable?

## Technical Notes
- Core selector strategy should prefer:
  1. `id`
  2. stable data attributes (if available)
  3. short class-based path
  4. nth-of-type fallback
- Turbo-safe init must be idempotent on repeated `turbo:load` events.
- Keep host integration minimal: initializer + layout hook (+ optional route mount).

## Next Actions
- Scaffold gem engine and baseline test harness.
- Implement config object + enablement guard + installer generator.
- Add minimal toolbar shell and static panel rendering.

## Handoff Checklist
- Update this file at end of each work session:
  - What was changed
  - What is blocked
  - What is next
