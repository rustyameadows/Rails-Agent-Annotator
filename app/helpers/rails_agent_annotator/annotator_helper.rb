module RailsAgentAnnotator
  module AnnotatorHelper
    def rails_agent_annotator
      return unless RailsAgentAnnotator.enabled_for?(controller)

      render("rails_agent_annotator/injector", annotator_context: annotator_context_payload)
    end

    def annotator_context_payload
      context = RailsAgentAnnotator.context_for(controller).merge(
        storage_key_prefix: RailsAgentAnnotator.configuration.storage_key_prefix
      )

      ERB::Util.json_escape(context.to_json)
    end
  end
end
