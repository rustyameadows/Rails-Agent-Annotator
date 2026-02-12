# rails_agent_annotator

`rails_agent_annotator` is a Rails Engine gem for development workflows where you need to point at UI, attach notes, and hand clean implementation instructions to an AI coding agent.

It adds a lightweight in-browser annotation toolbar that lets you:
- select elements visually,
- capture selector/context metadata,
- add notes/tags/priority,
- copy structured Markdown to your clipboard.

## Status

v1 implementation includes:
- Dev toolbar overlay
- Element capture (selector/tag/id/classes/text/bounds/turbo frame/stimulus)
- Annotation panel with edit/delete
- `localStorage` session persistence
- Rails context injection in export (URL/method/controller/route/timestamp)
- Turbo-safe initialization (`turbo:load`)
- Installer generator

## Installation

Add to your host app Gemfile in development:

```ruby
group :development do
  gem "rails_agent_annotator", git: "https://github.com/rustyameadows/Rails-Agent-Annotator.git", branch: "main"
end
```

Then install:

```bash
bundle install
bin/rails generate rails_agent_annotator:install
```

Optional (mount debug endpoint):

```bash
bin/rails generate rails_agent_annotator:install --mount
```

## Host App Integration

The installer generator:
- creates `config/initializers/rails_agent_annotator.rb`
- injects `<%= rails_agent_annotator %>` into `app/views/layouts/application.html.erb`
- optionally mounts engine route (if `--mount` is passed)

If you skip generator, do these manually.

## Configuration

Initializer options:

```ruby
RailsAgentAnnotator.configure do |config|
  config.enabled_environments = %w[development]
  config.enabled = Rails.env.development?
  config.allow_in_staging = false
  config.authorize = nil # ->(controller) { controller.current_user&.admin? }
  config.mount_path = "/__agent_annotator"
  config.storage_key_prefix = "rails_agent_annotator"
  # Optional explicit app key for storage isolation (auto-derived by default).
  # config.app_id = "my_app_unique_key"
  config.markdown_template = :v1
end
```

## Safety Defaults

- Disabled outside configured environments
- `staging` requires explicit `allow_in_staging = true`
- Optional authorization hook for restricted rollout
- Storage isolation is app-scoped (prevents cross-project note collisions on the same localhost host/port)

## Usage

1. Open a page with the toolbar enabled.
2. Toggle `Select: On`.
3. Hover and click an element to capture it.
4. Add note/tag/priority in the panel.
5. Click `Copy Markdown` and paste into your coding agent.

## Demo Surface (dummy app)

When running this gem repo directly (`bundle exec rails s`), use:
- `/` marketing page
- `/blog_posts` and `/blog_posts/:id`
- `/projects`, `/projects/:id`, `/projects/:id/edit`
- `/rails_agent_annotator` debug endpoint

These routes are designed as a richer annotation playground with cards, tables, forms, and turbo-frame regions.

## Example Markdown Output

```text
Title: Annotator Notes

Context:
- URL: /projects/12/edit
- Method: GET
- Controller: projects#edit
- Route: edit_project
- Timestamp: 2026-02-12T20:00:00Z

Annotations:
1) [layout] [P1]
- Selector: .sidebar .btn.btn-primary
- Text: Save
- Element: button
- Turbo Frame: project_form
- Stimulus: form autosave
- Notes:
  - Increase padding to ~16px and reduce icon/text crowding.
```

## Testing This Gem

### Gem tests

Run inside this gem:

```bash
bundle install
bundle exec rake test
```

### Test locally in another project (no GitHub required)

Use a local path dependency in that project’s Gemfile:

```ruby
gem "rails_agent_annotator", path: "/absolute/path/to/agent-feedback-gem"
```

Then run:

```bash
bundle install
bin/rails generate rails_agent_annotator:install
bin/rails server
```

This is the normal iterative workflow. You only need GitHub for sharing, CI, or release publication.

### Install from GitHub (alternative to local path)

```ruby
gem "rails_agent_annotator", git: "https://github.com/rustyameadows/Rails-Agent-Annotator.git", branch: "main"
```

## Rails 7/8 Compatibility Strategy

- Gem dependency allows Rails `>= 7.0, < 9.0`
- Add Appraisal-based matrix (`Rails 7`, `Rails 8`)
- Keep integration based on engine helpers + asset tags + Turbo lifecycle hooks

## License

MIT.
