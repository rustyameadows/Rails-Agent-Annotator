module RailsAgentAnnotator
  class DebugController < ApplicationController
    def show
      @enabled = RailsAgentAnnotator.enabled_for?(self)
      @context = RailsAgentAnnotator.context_for(self)
    end
  end
end
