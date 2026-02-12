RailsAgentAnnotator::Engine.routes.draw do
  get "/", to: "debug#show"
end
