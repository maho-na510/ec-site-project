ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

class ActiveSupport::TestCase
  # 並列テストはワーカーごとに別のDBを使うが、Redis は共有されてしまうため
  # flushdb が他ワーカーのセッションを消してしまう問題を避けるため並列化を無効にする
  parallelize(workers: 1)

  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  # 各テスト前に Redis セッションをクリアしてテスト間の干渉を防ぐ
  setup do
    $redis.flushdb if $redis
  end

  def json_response
    JSON.parse(response.body)
  end

  # テスト用の認証ヘッダーを生成する
  # authenticate を通じて Redis にセッションを保存するため、
  # authenticate_user! の Redis 検証も通過できる
  def auth_headers(user)
    result = AuthenticationService.new(email: user.email, password: 'password123').authenticate
    { 'Authorization' => "Bearer #{result[:access_token]}" }
  end
end

class ActionDispatch::IntegrationTest
  fixtures :all

  # 各テスト前に Redis セッションをクリア
  setup do
    $redis.flushdb if $redis
  end

  def json_response
    JSON.parse(response.body)
  end

  def auth_headers(user)
    result = AuthenticationService.new(email: user.email, password: 'password123').authenticate
    { 'Authorization' => "Bearer #{result[:access_token]}" }
  end
end
