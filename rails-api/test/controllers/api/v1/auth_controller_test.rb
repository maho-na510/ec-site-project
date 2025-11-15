require "test_helper"

class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
  end

  test "should register new user" do
    assert_difference('User.count', 1) do
      post api_v1_auth_register_url, params: {
        user: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }, as: :json
    end

    assert_response :created
    assert json_response['success']
    assert_not_nil json_response['data']['access_token']
    assert_equal 'newuser@example.com', json_response['data']['user']['email']
  end

  test "should not register user with invalid email" do
    assert_no_difference('User.count') do
      post api_v1_auth_register_url, params: {
        user: {
          name: 'New User',
          email: '',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }, as: :json
    end

    assert_response :unprocessable_entity
    assert_not json_response['success']
  end

  test "should login with valid credentials" do
    post api_v1_auth_login_url, params: {
      email: @user.email,
      password: 'password123'
    }, as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']['access_token']
    assert_equal @user.email, json_response['data']['user']['email']
  end

  test "should not login with invalid credentials" do
    post api_v1_auth_login_url, params: {
      email: @user.email,
      password: 'wrongpassword'
    }, as: :json

    assert_response :unauthorized
    assert_not json_response['success']
  end

  test "should logout successfully" do
    post api_v1_auth_logout_url, headers: auth_headers(@user), as: :json

    assert_response :success
    assert json_response['success']
  end

  test "should refresh token" do
    post api_v1_auth_refresh_url, headers: auth_headers(@user), as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']['access_token']
  end
end
