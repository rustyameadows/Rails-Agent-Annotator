require "json"
require "rails_agent_annotator/version"
require "rails_agent_annotator/configuration"
require "rails_agent_annotator/engine"

module RailsAgentAnnotator
  class << self
    def configure
      yield(configuration)
    end

    def configuration
      @configuration ||= Configuration.new
    end

    def reset_configuration!
      @configuration = Configuration.new
    end

    def enabled_for?(controller)
      config = configuration
      return false unless config.enabled
      return false unless environment_allowed?(config)
      return false unless authorized?(config, controller)

      true
    end

    def context_for(controller)
      route_name = controller.request.path_parameters[:_route]

      {
        url: controller.request.fullpath,
        method: controller.request.request_method,
        controller: "#{controller.controller_path}##{controller.action_name}",
        route: route_name,
        timestamp: Time.current.iso8601
      }
    end

    private

    def environment_allowed?(config)
      env_name = Rails.env.to_s
      enabled_environments = Array(config.enabled_environments).map(&:to_s)

      return false unless enabled_environments.include?(env_name)
      return false if env_name == "staging" && !config.allow_in_staging

      true
    end

    def authorized?(config, controller)
      return true unless config.authorize.respond_to?(:call)

      config.authorize.call(controller)
    rescue StandardError
      false
    end
  end
end
