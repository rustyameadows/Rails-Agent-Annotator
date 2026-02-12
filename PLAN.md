# rails_agent_annotator v1 Implementation Plan

## Goal
Build a Rails 7/8-compatible Engine gem that lets developers visually select page elements, attach notes, and copy structured Markdown for AI coding agents, with safe-by-default development-only behavior.

## Scope Summary

### In v1
- Rails Engine gem with isolated namespace
- Dev toolbar overlay (select mode, panel, copy Markdown, clear session)
- Element capture (selector + metadata)
- Annotation panel with create/edit/delete
- Local persistence via `localStorage`
- Rails context injection (URL, method best-effort, controller/action, route name)
- Markdown serialization + clipboard copy
- Turbo-safe lifecycle (`turbo:load`)
- Installer generator + initializer + layout hook (optional debug route mount)

### Out of scope in v1
- Server persistence
- Team sharing or multi-user sync
- Automatic agent submission
- Screenshots
- Advanced DOM-to-template mapping

## Architecture Plan

### Gem shape
- `rails_agent_annotator.gemspec`
- `lib/rails_agent_annotator.rb`
- `lib/rails_agent_annotator/engine.rb`
- `lib/rails_agent_annotator/configuration.rb`
- `lib/rails_agent_annotator/version.rb`

### Engine responsibilities
- Asset registration and namespacing
- Render UI injection partial/helper when enabled
- Emit page context JSON blob for JS consumption
- Optional lightweight debug route/controller/view

### Frontend responsibilities
- Selection/highlight controller
- Annotation state manager (in-memory + `localStorage`)
- Panel UI behavior
- Markdown formatter + clipboard copy
- Turbo lifecycle rebinding

### Configuration surface
- `enabled_environments` (default: development)
- `enabled` (default: true in development)
- `allow_in_staging` (default: false)
- `authorize` proc/lambda (optional)
- `mount_path` (default: `/__agent_annotator`)
- `storage_key_prefix` (default: `rails_agent_annotator`)
- `markdown_template` (default: v1 template)

## Milestones

1. Bootstrap gem and baseline tooling
- Create Rails plugin/engine skeleton
- Add linting + formatting + test harness baseline
- Add dummy app for integration tests
- Exit criteria: `bundle exec rake` green on baseline

2. Enablement and host integration
- Implement configuration + environment/authorization guard
- Add layout injection hook and initializer generator
- Optional route mount support
- Exit criteria: toolbar can render only when enabled

3. Toolbar + overlay interaction
- Implement floating toolbar UI and CSS
- Toggle select mode + open panel + clear session actions
- Exit criteria: non-blocking overlay UX in development pages

4. Element capture
- Hover/highlight and click-to-capture
- Stable-selector best effort + metadata capture:
  - tag/id/classes/text/bounding box/turbo frame/stimulus
- Exit criteria: captured records appear in panel reliably

5. Annotation panel + storage
- Add/edit/delete annotations
- Tag and priority fields
- Persist/reload via namespaced `localStorage`
- Exit criteria: reload retains session annotations

6. Markdown export
- Deterministic Markdown serializer
- Clipboard copy action + fallback handling
- Exit criteria: copied Markdown matches v1 template

7. Rails context blob
- Inject URL/method/controller/action/route name into page JSON
- Frontend merges context into exported Markdown
- Exit criteria: exported Markdown includes Rails context fields

8. Hardening + docs
- Turbo navigation stability checks
- Accessibility and keyboard checks for panel basics
- README install/usage/configuration/troubleshooting
- Exit criteria: install flow works in clean Rails app

## Testing Strategy (includes your question)

### Short answer
You do **not** need to push to GitHub to test this gem in another local project. Local path-based gem usage is the standard workflow while building.

### How we will test the gem itself
1. Unit tests for Ruby objects:
- Configuration logic
- Enablement/authorization guards
- Markdown serialization helpers (if Ruby-side pieces exist)

2. Engine/request/view tests:
- Injection occurs only when enabled
- Context blob contains expected fields
- Optional debug route behavior

3. JavaScript/system tests (important for this gem):
- Toolbar visibility and toggling
- Hover/click capture behavior
- Annotation CRUD
- LocalStorage persistence
- Clipboard export shape
- Turbo navigation rebinding

4. Compatibility matrix tests:
- Run suite against Rails 7 and Rails 8 using `Appraisal` (or equivalent multi-Gemfile matrix)
- CI matrix by Rails version and Ruby version

### How to test in your other local project (no GitHub required)
Use a local path in that app’s Gemfile during development:
- `gem "rails_agent_annotator", path: "/absolute/path/to/agent-feedback-gem"`

Then:
1. `bundle install`
2. `bin/rails rails_agent_annotator:install`
3. Boot app and verify toolbar + annotation flow

Optional alternatives:
- Build/install local `.gem` file (`gem build` + `gem install`) for packaging checks
- Use local git URL (`git: "file:///..."`) if you want to mimic git-sourced dependency behavior

### When GitHub is needed
- Sharing with teammates
- Remote CI
- Versioned release workflow
- Publishing to RubyGems

GitHub is not required for iterative local development/testing.

## Execution Order (first implementation passes)
1. Scaffold engine + generator + config guard
2. Add minimal injected UI shell
3. Implement selection + capture logic
4. Build panel and persistence
5. Implement Markdown export + context blob
6. Add tests and compatibility matrix
7. Validate in your target local host app
8. Prepare release docs and versioning

## Risks and Mitigations
- Selector fragility on dynamic DOM:
  - Mitigation: best-effort selector strategy + fallback metadata
- Turbo lifecycle duplication:
  - Mitigation: idempotent init + teardown/rebind pattern
- Clipboard API browser variance:
  - Mitigation: fallback copy path and clear user feedback
- Non-dev exposure risk:
  - Mitigation: strict default disable rules and optional auth gate

## Definition of Done (v1)
- In a Rails app, a developer can enable the gem, select elements, write notes, copy structured Markdown with Rails context, and use it across Turbo navigation without breaking normal page behavior.
