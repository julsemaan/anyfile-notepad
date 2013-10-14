require 'test_helper'

class ScaffoldControllerTest < ActionController::TestCase
  test "should get MimeType" do
    get :MimeType
    assert_response :success
  end

end
