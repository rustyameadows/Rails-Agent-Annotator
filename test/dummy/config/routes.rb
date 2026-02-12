Rails.application.routes.draw do
  mount RailsAgentAnnotator::Engine => "/rails_agent_annotator"
end
