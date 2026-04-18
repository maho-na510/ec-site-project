require "test_helper"

# AuthenticationService の単体テスト (Small Test)
#
# テスト分類:
#   Small  : DB・Redis に依存するがネットワーク通信なし
#   Medium : HTTPリクエストを伴う結合テスト（auth_controller_test.rb）
#   Big    : ブラウザを使う E2E（Cypress）
class AuthenticationServiceTest < ActiveSupport::TestCase
  setup do
    @user = users(:one)
    @service = AuthenticationService.new(email: @user.email, password: 'password123')
  end

  # ---- 認証 (authenticate) ----

  test "authenticate returns success with valid credentials" do
    result = @service.authenticate

    assert result[:success]
    assert_not_nil result[:access_token]
    assert_not_nil result[:refresh_token]
    assert_equal @user.id, result[:user]['id']
  end

  test "authenticate returns failure with wrong password" do
    service = AuthenticationService.new(email: @user.email, password: 'wrong')
    result  = service.authenticate

    assert_not result[:success]
  end

  test "authenticate returns failure with unknown email" do
    service = AuthenticationService.new(email: 'nobody@example.com', password: 'pass')
    result  = service.authenticate

    assert_not result[:success]
  end

  # ---- Redis セッション保存 (store_session) ----

  test "authenticate stores session in Redis" do
    result      = @service.authenticate
    token       = result[:access_token]
    session_key = AuthenticationService.session_key_for(@user.id, token)

    assert $redis.exists?(session_key), "Redisにセッションが保存されていません"
  end

  test "session data in Redis contains correct user info" do
    result      = @service.authenticate
    token       = result[:access_token]
    session_key = AuthenticationService.session_key_for(@user.id, token)
    data        = JSON.parse($redis.get(session_key))

    assert_equal @user.id,    data['user_id']
    assert_equal @user.email, data['email']
  end

  test "session in Redis expires within ACCESS_TOKEN_EXPIRY" do
    result  = @service.authenticate
    token   = result[:access_token]
    key     = AuthenticationService.session_key_for(@user.id, token)
    ttl     = $redis.ttl(key)

    assert ttl > 0,                                          "TTLが設定されていません"
    assert ttl <= AuthenticationService::ACCESS_TOKEN_EXPIRY.to_i, "TTLが期待値を超えています"
  end

  # ---- セッションキー生成 (session_key_for) ----

  test "session_key_for generates unique keys for different tokens" do
    token_a = "fake.token.aaa"
    token_b = "fake.token.bbb"

    key_a = AuthenticationService.session_key_for(@user.id, token_a)
    key_b = AuthenticationService.session_key_for(@user.id, token_b)

    assert_not_equal key_a, key_b
  end

  test "session_key_for generates same key for same token" do
    token = "fake.token.consistent"

    key1 = AuthenticationService.session_key_for(@user.id, token)
    key2 = AuthenticationService.session_key_for(@user.id, token)

    assert_equal key1, key2
  end

  test "session_key_for differs by user_id" do
    other_user = users(:two)
    token      = "fake.token.xyz"

    key_user1 = AuthenticationService.session_key_for(@user.id, token)
    key_user2 = AuthenticationService.session_key_for(other_user.id, token)

    assert_not_equal key_user1, key_user2
  end

  # ---- トークン検証 (verify_token) ----

  test "verify_token returns user when session is valid" do
    result = @service.authenticate
    token  = result[:access_token]

    verified = AuthenticationService.verify_token(token)

    assert_not_nil verified
    assert_equal @user.id, verified.id
  end

  test "verify_token returns nil for invalid JWT" do
    result = AuthenticationService.verify_token("not.a.valid.jwt")

    assert_nil result
  end

  test "verify_token returns nil when session is not in Redis" do
    result = @service.authenticate
    token  = result[:access_token]

    # Redis から手動でセッションを削除
    $redis.flushdb

    verified = AuthenticationService.verify_token(token)
    assert_nil verified, "Redisにセッションがなければ認証に失敗するはず"
  end

  # ---- ログアウト (logout) ----

  test "logout removes session from Redis" do
    result      = @service.authenticate
    token       = result[:access_token]
    session_key = AuthenticationService.session_key_for(@user.id, token)

    assert $redis.exists?(session_key), "前提: ログイン後にセッションが存在する"

    AuthenticationService.logout(@user, token)

    assert_not $redis.exists?(session_key), "ログアウト後にセッションが残っています"
  end

  test "verify_token returns nil after logout" do
    result = @service.authenticate
    token  = result[:access_token]

    AuthenticationService.logout(@user, token)

    assert_nil AuthenticationService.verify_token(token),
               "ログアウト後は旧トークンで認証できてはいけない"
  end

  # ---- トークンリフレッシュ (refresh_token) ----

  test "refresh_token returns new access token" do
    result        = @service.authenticate
    refresh_token = result[:refresh_token]

    refresh_result = AuthenticationService.refresh_token(refresh_token)

    assert refresh_result[:success]
    assert_not_nil refresh_result[:access_token]
  end

  test "refresh_token stores new session in Redis" do
    result        = @service.authenticate
    refresh_token = result[:refresh_token]

    refresh_result  = AuthenticationService.refresh_token(refresh_token)
    new_token       = refresh_result[:access_token]
    new_session_key = AuthenticationService.session_key_for(@user.id, new_token)

    assert $redis.exists?(new_session_key), "リフレッシュ後の新セッションがRedisにありません"
  end

  test "refresh_token fails with invalid token" do
    result = AuthenticationService.refresh_token("invalid.refresh.token")

    assert_not result[:success]
  end
end
