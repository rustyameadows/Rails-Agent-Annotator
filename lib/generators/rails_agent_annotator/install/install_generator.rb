require "rails/generators"

module RailsAgentAnnotator
  module Generators
    class InstallGenerator < Rails::Generators::Base
      source_root File.expand_path("templates", __dir__)

      class_option :mount,
        type: :boolean,
        default: false,
        desc: "Mount engine debug route at configured mount_path"

      def create_initializer
        template "initializer.rb", "config/initializers/rails_agent_annotator.rb"
      end

      def inject_layout_hook
        layout_path = "app/views/layouts/application.html.erb"
        unless File.exist?(layout_path)
          say "Skipped layout injection: #{layout_path} not found", :yellow
          return
        end

        guard_start = "<% if defined?(RailsAgentAnnotator::AnnotatorHelper) %>"
        hook = "<%= rails_agent_annotator %>"
        guard_end = "<% end %>"
        guarded_hook = [guard_start, "  #{hook}", guard_end].join("\n")

        content = File.read(layout_path)
        return if content.include?(guarded_hook)

        if content.include?(hook)
          gsub_file(layout_path, hook, guarded_hook)
          return
        end

        inject_into_file layout_path, "\n    #{guarded_hook}\n", before: "</body>"
      end

      def mount_debug_route
        return unless options[:mount]

        route %(mount RailsAgentAnnotator::Engine => RailsAgentAnnotator.configuration.mount_path)
      end
    end
  end
end
