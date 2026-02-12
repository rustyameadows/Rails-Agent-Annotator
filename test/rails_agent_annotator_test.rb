require "test_helper"

class RailsAgentAnnotatorTest < ActiveSupport::TestCase
  setup do
    RailsAgentAnnotator.reset_configuration!
  end

  teardown do
    RailsAgentAnnotator.reset_configuration!
  end

  test "has a version" do
    assert RailsAgentAnnotator::VERSION
  end

  test "is enabled when environment and config allow it" do
    RailsAgentAnnotator.configure do |config|
      config.enabled = true
      config.enabled_environments = [Rails.env]
    end

    assert RailsAgentAnnotator.enabled_for?(ApplicationController.new)
  end

  test "is disabled when authorize hook denies" do
    RailsAgentAnnotator.configure do |config|
      config.enabled = true
      config.enabled_environments = [Rails.env]
      config.authorize = ->(_controller) { false }
    end

    assert_not RailsAgentAnnotator.enabled_for?(ApplicationController.new)
  end

  test "staging remains disabled unless explicitly allowed" do
    Rails.stub(:env, ActiveSupport::StringInquirer.new("staging")) do
      RailsAgentAnnotator.configure do |config|
        config.enabled = true
        config.enabled_environments = ["staging"]
        config.allow_in_staging = false
      end

      assert_not RailsAgentAnnotator.enabled_for?(ApplicationController.new)
    end
  end
end
