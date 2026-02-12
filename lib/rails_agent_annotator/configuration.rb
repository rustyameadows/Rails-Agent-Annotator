module RailsAgentAnnotator
  class Configuration
    attr_accessor :enabled_environments, :enabled, :allow_in_staging, :authorize,
      :mount_path, :storage_key_prefix, :markdown_template, :app_id

    def initialize
      @enabled_environments = %w[development]
      @enabled = true
      @allow_in_staging = false
      @authorize = nil
      @mount_path = "/__agent_annotator"
      @storage_key_prefix = "rails_agent_annotator"
      @markdown_template = :v1
      @app_id = nil
    end
  end
end
