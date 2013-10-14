require 'test_helper'

class MimeTypesControllerTest < ActionController::TestCase
  setup do
    @mime_type = mime_types(:one)
  end

  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:mime_types)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create mime_type" do
    assert_difference('MimeType.count') do
      post :create, mime_type: {  }
    end

    assert_redirected_to mime_type_path(assigns(:mime_type))
  end

  test "should show mime_type" do
    get :show, id: @mime_type
    assert_response :success
  end

  test "should get edit" do
    get :edit, id: @mime_type
    assert_response :success
  end

  test "should update mime_type" do
    put :update, id: @mime_type, mime_type: {  }
    assert_redirected_to mime_type_path(assigns(:mime_type))
  end

  test "should destroy mime_type" do
    assert_difference('MimeType.count', -1) do
      delete :destroy, id: @mime_type
    end

    assert_redirected_to mime_types_path
  end
end
