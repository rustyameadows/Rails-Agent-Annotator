namespace :rails_agent_annotator do
  desc "Run installer generator"
  task :install do
    system("bin/rails generate rails_agent_annotator:install") || abort("Install generator failed")
  end
end
