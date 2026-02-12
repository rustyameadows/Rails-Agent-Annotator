# rails_agent_annotator Task Tracker

## Milestone Status
- [x] M1 Bootstrap gem and baseline tooling
- [x] M2 Enablement and host integration
- [x] M3 Toolbar and overlay interaction
- [x] M4 Element capture
- [x] M5 Annotation panel and localStorage
- [x] M6 Markdown export
- [x] M7 Rails context blob injection
- [ ] M8 Hardening, docs, compatibility verification

## Acceptance Checklist
- [x] Installs in a Rails app with generator
- [x] Toolbar appears only in allowed environments
- [x] Element selection captures required metadata
- [x] Annotation CRUD works in panel
- [x] Session persists in browser storage
- [x] Markdown copy includes Rails context + annotations
- [x] Turbo navigation does not break annotator lifecycle
- [ ] Rails 7 + Rails 8 test matrix passes

## Local Host-App Validation Checklist
- [ ] Add gem via Gemfile `path:`
- [ ] Run installer generator in host app
- [ ] Confirm toolbar rendering in development
- [ ] Create at least 2 annotations and reload page
- [ ] Copy Markdown and verify output format
- [ ] Navigate through Turbo flow and reconfirm behavior
