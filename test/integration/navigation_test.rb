require "test_helper"

class NavigationTest < ActionDispatch::IntegrationTest
  test "annotator injector renders on enabled page" do
    get "/"

    assert_response :success
    assert_includes response.body, "id=\"raa-root\""
    assert_includes response.body, "id=\"raa-context\""
    assert_includes response.body, "rails_agent_annotator/application.js"
  end

  test "debug route is available when engine mounted" do
    get "/rails_agent_annotator"

    assert_response :success
    assert_includes response.body, "rails_agent_annotator Debug"
  end
end
