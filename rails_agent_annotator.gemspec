require_relative "lib/rails_agent_annotator/version"

Gem::Specification.new do |spec|
  spec.name = "rails_agent_annotator"
  spec.version = RailsAgentAnnotator::VERSION
  spec.authors = ["Rusty Meadows"]
  spec.email = ["rusty@example.com"]
  spec.homepage = "https://github.com/example/rails_agent_annotator"
  spec.summary = "Visual UI annotation and markdown export for AI coding agents in Rails apps"
  spec.description = "A Rails Engine gem for selecting visual elements, writing notes, and copying structured markdown context for agentic coding workflows."
  spec.license = "MIT"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/CHANGELOG.md"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,lib,test}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.required_ruby_version = ">= 3.1"

  spec.add_dependency "rails", ">= 7.0", "< 9.0"
end
