require "test_helper"

class NavigationTest < ActionDispatch::IntegrationTest
  test "annotator injector renders on enabled page" do
    get "/"

    assert_response :success
    assert_includes response.body, "id=\"raa-root\""
    assert_includes response.body, "id=\"raa-context\""
    assert_includes response.body, "rails_agent_annotator/application.js"
  end

  test "annotator injector renders across demo resources" do
    get "/blog_posts"
    assert_response :success
    assert_includes response.body, "id=\"raa-root\""

    get "/projects/atlas/edit"
    assert_response :success
    assert_includes response.body, "id=\"raa-root\""
    assert_includes response.body, "name=\"project[name]\""

    get "/ui_lab"
    assert_response :success
    assert_includes response.body, "id=\"raa-root\""
    assert_includes response.body, "id=\"ui_lab_stub\""
    assert_not_includes response.body, "demo-header"
  end

  test "debug route is available when engine mounted" do
    get "/rails_agent_annotator"

    assert_response :success
    assert_includes response.body, "rails_agent_annotator Debug"
    assert_includes response.body, "rails_agent_annotator/application.js"
    assert_includes response.body, "raa-debug-minimap"
    assert_includes response.body, "raa-debug-diagnostics"
    assert_includes response.body, "raa-debug-notes"
    assert_includes response.body, "Loading storage diagnostics..."
  end
end
