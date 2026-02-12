# rails_agent_annotator Task Tracker

## Milestone Status
- [ ] M1 Bootstrap gem and baseline tooling
- [ ] M2 Enablement and host integration
- [ ] M3 Toolbar and overlay interaction
- [ ] M4 Element capture
- [ ] M5 Annotation panel and localStorage
- [ ] M6 Markdown export
- [ ] M7 Rails context blob injection
- [ ] M8 Hardening, docs, compatibility verification

## Acceptance Checklist
- [ ] Installs in a Rails app with generator
- [ ] Toolbar appears only in allowed environments
- [ ] Element selection captures required metadata
- [ ] Annotation CRUD works in panel
- [ ] Session persists in browser storage
- [ ] Markdown copy includes Rails context + annotations
- [ ] Turbo navigation does not break annotator lifecycle
- [ ] Rails 7 + Rails 8 test matrix passes

## Local Host-App Validation Checklist
- [ ] Add gem via Gemfile `path:`
- [ ] Run installer generator in host app
- [ ] Confirm toolbar rendering in development
- [ ] Create at least 2 annotations and reload page
- [ ] Copy Markdown and verify output format
- [ ] Navigate through Turbo flow and reconfirm behavior
