module RailsAgentAnnotator
  class Engine < ::Rails::Engine
    isolate_namespace RailsAgentAnnotator

    initializer "rails_agent_annotator.assets" do |app|
      app.config.assets.precompile += %w[
        rails_agent_annotator/application.css
        rails_agent_annotator/application.js
      ]
    end

    initializer "rails_agent_annotator.helpers" do
      ActiveSupport.on_load(:action_controller_base) do
        helper RailsAgentAnnotator::AnnotatorHelper
      end
    end
  end
end
