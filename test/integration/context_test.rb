require "cgi"
require "json"
require "test_helper"

class ContextTest < ActionDispatch::IntegrationTest
  test "context payload includes rails metadata" do
    get "/"

    assert_response :success

    script_payload = response.body[/<script id="raa-context" type="application\/json">(.*?)<\/script>/m, 1]
    assert script_payload

    payload = JSON.parse(CGI.unescapeHTML(script_payload))

    assert_equal "/", payload["url"]
    assert_equal "GET", payload["method"]
    assert_equal "pages#home", payload["controller"]
    assert_equal "root", payload["route"]
    assert_equal "rails_agent_annotator", payload["storage_key_prefix"]
    assert payload["timestamp"].present?
  end

  test "context payload updates per resource route" do
    get "/blog_posts/ship-week-notes"

    assert_response :success

    script_payload = response.body[/<script id="raa-context" type="application\/json">(.*?)<\/script>/m, 1]
    payload = JSON.parse(CGI.unescapeHTML(script_payload))

    assert_equal "/blog_posts/ship-week-notes", payload["url"]
    assert_equal "blog_posts#show", payload["controller"]
    assert_equal "blog_post", payload["route"]
  end
end
