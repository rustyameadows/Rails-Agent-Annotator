Rails.application.routes.draw do
  root to: "home#index"

  mount RailsAgentAnnotator::Engine => "/rails_agent_annotator"
end
