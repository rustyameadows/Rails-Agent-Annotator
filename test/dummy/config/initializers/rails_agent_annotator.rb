RailsAgentAnnotator.configure do |config|
  config.enabled_environments = %w[development test]
  config.enabled = true
  config.allow_in_staging = false
  config.storage_key_prefix = "rails_agent_annotator"
end
