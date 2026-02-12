# Spec Parity Check - rails_agent_annotator v1

## Status Key
- Done: implemented and validated in current codebase
- Partial: implemented but needs broader validation/hardening
- Pending: not implemented

## Core Purpose
- Done: Visual element selection + notes + markdown export for AI agent handoff.

## What It Is / Is Not
- Done: Rails Engine gem, local/client-side interaction, no SaaS.
- Done: No server-side persistence for annotations in v1.

## Primary Workflow
1. Toggle annotator on: Done
2. Hover to highlight elements: Done
3. Click to select element: Done
4. Add note and optional tag: Done
5. Copy markdown: Done
6. Paste into agent: Done (manual user action)

## v1 Features

### 1) Dev-only toolbar overlay
- Done: Select toggle, annotations panel, copy markdown, clear session.

### 2) Element selection and capture
- Done: Selector, tag/id/class list, text snippet, bounding box, nearest turbo frame, nearest stimulus controllers.
- Partial: Stable selector algorithm is best-effort and may vary on highly dynamic DOM.

### 3) Annotation panel
- Done: Session list, edit fields, delete.
- Done: Suggested tags supported via datalist: bug/copy/layout/behavior/feature.
- Done: Priority supported: P0/P1/P2.
- Done: localStorage namespaced by key prefix + path.

### 4) Rails context injection
- Done: URL path/fullpath, method, controller#action, route name best-effort.
- Partial: Route-name extraction relies on request path params and should be validated against edge custom routing setups.

### 5) Markdown export
- Done: Structured markdown with context and annotation sections.

## Packaging Approach
- Done: Rails Engine with isolated namespace.
- Done: Engine assets (JS/CSS) delivered and injected.
- Done: Turbo-safe rebinding on `turbo:load`.
- Done: Optional engine debug page route.

## Generator Responsibilities
- Done: Creates initializer.
- Done: Injects layout hook in host app layout.
- Done: Optional mount support for debug route.

## Safety Defaults
- Done: Config defaults to development-only enablement.
- Done: Staging disabled unless explicitly allowed.
- Done: Optional authorization proc hook.

## Rails-y Design Choices
- Partial: Turbo-safe lifecycle implemented.
- Pending: Stimulus-based UI internals (current implementation is framework-agnostic JS rather than Stimulus controllers).
- Done: Namespaced assets and minimal host touchpoints.

## Explicit Non-goals
- Done: No team sharing, screenshots, server persistence, or auto-agent sending.

## Build Order + Definition of Done
- Partial: Functional DoD achieved in manual demo.
- Partial: Cross-version compatibility matrix scaffolding exists; Rails 7 matrix execution still pending full runtime validation in this environment.

## Next Hardening Items
1. Add optional Stimulus controller implementation mode (to fully match design preference).
2. Add browser/system tests for end-to-end UI interactions.
3. Run CI matrix for Rails 7 + Rails 8 and close compatibility item.
