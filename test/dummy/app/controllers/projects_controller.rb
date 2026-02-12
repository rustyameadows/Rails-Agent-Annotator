class ProjectsController < ApplicationController
  PROJECTS = [
    {
      id: "atlas",
      name: "Atlas Dashboard",
      owner: "Platform",
      status: "In Progress",
      summary: "Internal analytics dashboard with weekly release cadence.",
      notes: [
        "Primary action in sidebar feels cramped.",
        "Form submit behavior on Enter needs review."
      ]
    },
    {
      id: "pulse",
      name: "Pulse Marketing Site",
      owner: "Growth",
      status: "Review",
      summary: "Campaign landing pages with reusable component sections.",
      notes: [
        "CTA alignment shifts on medium breakpoints.",
        "Hero copy could be more concise."
      ]
    },
    {
      id: "notion-sync",
      name: "Notion Sync Worker",
      owner: "Automation",
      status: "Backlog",
      summary: "Sync service for docs, tags, and decision logs.",
      notes: [
        "Need clearer empty state guidance.",
        "Button hierarchy should mirror dashboard patterns."
      ]
    }
  ].freeze

  def index
    @projects = PROJECTS
  end

  def show
    @project = find_project
  end

  def edit
    @project = find_project
  end

  def update
    project = find_project
    redirect_to project_path(project[:id]), notice: "Saved (demo only, no persistence)."
  end

  private

  def find_project
    project = PROJECTS.find { |item| item[:id] == params[:id] }
    raise ActionController::RoutingError, "Not Found" unless project

    project
  end
end
