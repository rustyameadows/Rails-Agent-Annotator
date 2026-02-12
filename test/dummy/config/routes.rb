Rails.application.routes.draw do
  root to: "pages#home"

  resources :blog_posts, only: %i[index show]
  resources :projects, only: %i[index show edit update]

  mount RailsAgentAnnotator::Engine => "/rails_agent_annotator"
end
