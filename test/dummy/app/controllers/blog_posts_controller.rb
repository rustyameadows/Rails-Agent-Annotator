class BlogPostsController < ApplicationController
  POSTS = [
    {
      id: "ship-week-notes",
      title: "Ship Week Notes",
      category: "Product",
      excerpt: "What changed in the latest release, and what still needs polish.",
      body: "This page intentionally includes cards, badges, and callouts for annotation testing."
    },
    {
      id: "faster-feedback-loop",
      title: "Building a Faster Feedback Loop",
      category: "Engineering",
      excerpt: "Using local tools and agent prompts to reduce UI iteration time.",
      body: "Try annotating this paragraph and requesting copy, layout, or behavior updates."
    },
    {
      id: "design-system-breakpoints",
      title: "Design System Breakpoints",
      category: "Design",
      excerpt: "How we prioritize readability and hierarchy on small screens.",
      body: "Card spacing, typography rhythm, and call-to-action clarity are all fair game."
    }
  ].freeze

  def index
    @posts = POSTS
  end

  def show
    @post = POSTS.find { |item| item[:id] == params[:id] }
    raise ActionController::RoutingError, "Not Found" unless @post
  end
end
