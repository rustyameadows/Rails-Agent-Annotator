# Changelog

## Unreleased

## 0.2.0 - 2026-02-14
- Guard generated initializer with `defined?(RailsAgentAnnotator)` so production boot and `assets:precompile` do not fail when gem is installed only in development.
- Guard generated layout hook with `defined?(RailsAgentAnnotator::AnnotatorHelper)` and auto-upgrade old unguarded hook on installer re-run.
- Add rough CSS impact capture for selected elements (computed snapshot + matching selectors/declarations) shown in annotation cards.
- Add live CSS edit rows per annotation with immediate in-page preview and compact markdown diff export (`before -> after`).
- Add selector scope controls for CSS edits (`exact`, `similar siblings`, `container`) with live match counts.
- Expand CSS edit support for border shorthand, side-specific borders, and corner-specific border radius properties.
- Improve exact selector generation to avoid unnecessary `:nth-of-type(...)` when class-qualified selectors are already unique among siblings.
- Streamline markdown export structure and make `CSS Scope Selector` conditional on there being CSS edits.
- Remove the `Title:` prefix from markdown export header (`Annotator Notes` now emitted directly).

## 0.1.1 - 2026-02-12
- Added app-scoped storage isolation (`app_id`) to prevent annotation collisions across different local Rails apps on the same host/port.
- Fixed installer generator discovery by moving it to Rails conventional path under `lib/generators/...`.
- Added `/ui_lab` two-bar setup: centered dumb HTML/CSS stub plus real working toolbar.
- Added `Escape` key support to exit active select mode.
- Updated select button to state-only styling (no `On/Off` label text).
- Added toolbar visibility controls: `Close` button plus `Agent Annotation` launcher button when hidden.
- Added toolbar button hover states and aligned UI Lab stub controls with real toolbar classes/states.

## 0.1.0 - 2026-02-12
- Initial implementation of `rails_agent_annotator` v1.
- Added Rails Engine integration, toolbar UI, annotation capture, localStorage persistence, markdown export, and context injection.
- Added installer generator and optional debug route.
- Added baseline tests and Rails 7/8 compatibility scaffolding.
