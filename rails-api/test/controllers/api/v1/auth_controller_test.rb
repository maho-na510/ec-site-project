require "test_helper"

# 認証コントローラーのテスト
# ここで詰まった：最初 params: { user: { name:, email:, ... } } とネストして送ったが
# コントローラーは params.require(:name) のようにフラットに受け取っていた
# Railsの params.permit はネスト構造に気をつけないといけない
class Api::V1::AuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    # テスト前に Redis のセッションをクリア
    $redis.flushdb if $redis
  end

  # 新規ユーザー登録のテスト
  # JWTはレスポンスボディではなく HttpOnly Cookie にセットされる
  test "should register new user" do
    assert_difference('User.count', 1) do
      post api_v1_auth_register_url, params: {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'password123',
        password_confirmation: 'password123'
      }, as: :json
    end

    assert_response :created
    assert json_response['success']
    assert_equal 'newuser@example.com', json_response['data']['user']['email']
    # JWTはCookieに保存される（レスポンスボディには含まれない）
    assert_not_nil response.cookies['access_token']
  end

  test "should not register user with invalid email" do
    assert_no_difference('User.count') do
      post api_v1_auth_register_url, params: {
        name: 'New User',
        email: '',
        password: 'password123',
        password_confirmation: 'password123'
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
    assert_equal @user.email, json_response['data']['user']['email']
    # JWTはCookieに保存される（レスポンスボディには含まれない）
    assert_not_nil response.cookies['access_token']
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

  # ログアウト後は同じトークンで認証できないことを確認する
  # Redis からセッションが削除されるため、JWTが有効期限内でもアクセス拒否される
  test "should reject request with token after logout" do
    # ログインしてトークンを取得
    post api_v1_auth_login_url, params: {
      email: @user.email,
      password: 'password123'
    }, as: :json
    assert_response :success
    token = response.cookies['access_token']
    assert_not_nil token

    # ログイン直後はアクセスできる
    get api_v1_users_me_url, headers: { 'Authorization' => "Bearer #{token}" }, as: :json
    assert_response :success

    # ログアウト
    post api_v1_auth_logout_url, headers: { 'Authorization' => "Bearer #{token}" }, as: :json
    assert_response :success

    # ログアウト後は同じトークンでアクセスできない（Redis セッションが削除済み）
    get api_v1_users_me_url, headers: { 'Authorization' => "Bearer #{token}" }, as: :json
    assert_response :unauthorized
  end

  # ログイン時に Redis にセッションが保存されることを確認する
  test "should store session in redis on login" do
    post api_v1_auth_login_url, params: {
      email: @user.email,
      password: 'password123'
    }, as: :json
    assert_response :success

    token = response.cookies['access_token']
    assert_not_nil token

    # Redis にセッションが存在する
    session_key = AuthenticationService.session_key_for(@user.id, token)
    assert $redis.exists?(session_key), "Redisにセッションが保存されていません"

    session_data = JSON.parse($redis.get(session_key))
    assert_equal @user.id, session_data['user_id']
    assert_equal @user.email, session_data['email']
  end

  # ログアウト時に Redis からセッションが削除されることを確認する
  test "should remove session from redis on logout" do
    post api_v1_auth_login_url, params: {
      email: @user.email,
      password: 'password123'
    }, as: :json
    assert_response :success
    token = response.cookies['access_token']

    session_key = AuthenticationService.session_key_for(@user.id, token)
    assert $redis.exists?(session_key), "ログイン後にRedisセッションが存在するはず"

    # ログアウト
    post api_v1_auth_logout_url, headers: { 'Authorization' => "Bearer #{token}" }, as: :json
    assert_response :success

    # Redis からセッションが削除されている
    assert_not $redis.exists?(session_key), "ログアウト後にRedisセッションが残っています"
  end

  # トークンリフレッシュ（アクセストークンで新しいトークンを発行する）
  test "should refresh token" do
    post api_v1_auth_refresh_url, headers: auth_headers(@user), as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']['access_token']
  end
end
