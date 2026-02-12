class PagesController < ApplicationController
  def home
    @featured_posts = BlogPostsController::POSTS.first(2)
    @featured_projects = ProjectsController::PROJECTS.first(2)
  end
end
