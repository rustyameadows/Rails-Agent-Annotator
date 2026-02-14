# rails_agent_annotator Live CSS Edit MVP Plan

## Goal
Add a fast "inspect and tweak" loop where a selected element shows editable CSS values, updates live in the page as values change, and exports only the CSS diffs in Markdown.

## User Problem
After selecting an element, I can see rough CSS context but cannot quickly test alternatives (for example `border-radius: 20px -> 8px`) and hand those exact changes to an agent.

## MVP Outcome
- User selects an element and sees a `CSS Edits` section in that annotation card.
- User edits allowed CSS properties and sees changes live on the current page.
- Annotation stores only changed properties (`before` and `after`), not the full stylesheet stack.
- Markdown export includes a compact diff block per annotation.

## Scope

### In Scope (MVP)
- Editable CSS rows in annotation card:
  - property name
  - value
  - enabled toggle
  - remove row
- Add-row flow for manual property/value entries.
- Live preview application using inline styles on the selected element.
- Persist CSS edit diffs in annotation JSON (`localStorage`).
- Re-apply persisted edits when annotation card renders on same page.
- Markdown export of CSS diffs only.
- Basic validation and guardrails for property and value inputs.

### Out of Scope (MVP)
- Full DevTools-level cascade viewer.
- Pseudo states (`:hover`, `:focus`, etc.).
- Media query/state simulation.
- Undo/redo history stack.
- Cross-page or server-side persistence.
- Automatic conversion from shorthand to longhand.

## UX Plan
1. User enters select mode and clicks an element.
2. Annotation card appears with current fields plus new `CSS Edits` block.
3. Default rows are prefilled from curated computed properties (for example `border-radius`, `padding`, `font-size`) with current values.
4. User changes value and sees page update immediately.
5. User can disable, remove, or add properties.
6. User copies Markdown and gets only changed CSS values in diff format.

## Data Model (Annotation)
Add to each annotation:

```json
{
  "css_edits": [
    {
      "property": "border-radius",
      "before": "20px",
      "after": "8px",
      "enabled": true
    }
  ]
}
```

Notes:
- `before` is captured from computed style at first edit.
- `after` is current user-entered value.
- Only rows where `after != before` are exported in Markdown.
- Empty or invalid rows are ignored on apply/export.

## Implementation Design

### 1) Element targeting
- Keep a runtime map of `annotation.id -> DOM element` when captured.
- Fallback resolver: query by saved selector when runtime handle is missing.
- If element cannot be resolved, keep row UI editable but show a small "preview unavailable" hint.

### 2) Live preview engine
- `applyCssEdits(annotation)`:
  - resolve target element
  - for each enabled valid row: `element.style.setProperty(property, after)`
- `clearCssEditsPreview(annotation)`:
  - remove inline properties from rows that are disabled/removed
  - if needed, restore `before` during reset action
- Apply on every relevant edit event (value/property/enabled toggle), with light debounce for persistence.

### 3) Validation and safety
- Property allowlist for MVP (layout/spacing/typography/border/color basics).
- Property format check: lowercase kebab-case string.
- Value guardrails:
  - reject obviously broken values (empty, unmatched parentheses)
  - max length guard (for example 120 chars)
- Ignore disallowed rows instead of throwing.

### 4) UI changes
- Add `CSS Edits` section inside each annotation card:
  - editable grid rows
  - `+ Add Property` button
  - `Reset` button (restores `after = before` for all rows)
- Keep existing `Rough CSS impact` read-only block for context.

### 5) Markdown export format
Add per annotation:

```text
- CSS Edits:
  - border-radius: 20px -> 8px
  - padding: 16px -> 12px
```

Rules:
- Export only changed and enabled rows.
- Do not export unchanged baseline values.

## Milestones

1. Data model and persistence
- Add `css_edits` schema in capture/render/persist pipeline.
- Exit criteria: edits survive page refresh.

2. UI editing controls
- Build rows, add/remove/toggle/reset actions.
- Exit criteria: row interactions work without breaking notes/tag/priority behavior.

3. Live preview apply/reapply
- Apply edits in-page on input change and when reloading stored annotations.
- Exit criteria: visible change occurs for supported properties.

4. Markdown diff export
- Add `CSS Edits` diff block.
- Exit criteria: copied markdown contains only edited properties.

5. Hardening and docs
- Validation edge cases, selector-miss handling, README update.
- Exit criteria: manual QA checklist passes.

## Testing Plan (MVP)

### Automated
- Existing Ruby/integration suite remains green.
- Add targeted unit coverage where feasible for:
  - diff filtering (changed vs unchanged)
  - markdown serializer output for css edits

### Manual QA checklist
- Select element, edit `border-radius`, see immediate visual update.
- Toggle edit row off, value no longer applied.
- Remove edit row, value no longer applied.
- Refresh page, persisted edits reapply on matched selector.
- Copy Markdown includes only changed CSS rows.
- Selector miss path does not throw and keeps UI usable.

## Risks and Mitigations
- Selector mismatch after DOM changes:
  - Mitigation: runtime element handle first, selector fallback second, safe no-op if unresolved.
- Invalid user input causing broken inline styles:
  - Mitigation: allowlist + validation + ignore invalid rows.
- Performance on many annotations:
  - Mitigation: apply only for the edited annotation, debounce persistence.
- Confusion between computed and authored CSS:
  - Mitigation: label this as "preview diffs" and keep rough context separate.

## Definition of Done (MVP)
- A user can select an element, edit key CSS values, see immediate visual changes, persist those edits for that page session, and copy compact Markdown diffs representing only intended CSS changes.

## Post-MVP Candidates
- Pseudo-state preview (`hover`, `focus`).
- Device breakpoint previews.
- Batch apply to multiple matching elements.
- "Generate patch" mode for SCSS/CSS snippets from diffs.
