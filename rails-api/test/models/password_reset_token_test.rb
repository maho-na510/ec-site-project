require "test_helper"

class PasswordResetTokenTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
  end

  test "should generate token on create" do
    token = @user.password_reset_tokens.create!
    assert_not_nil token.token
    assert_match(/\A[0-9a-f-]{36}\z/, token.token)
  end

  test "should generate unique tokens" do
    token1 = @user.password_reset_tokens.create!
    token2 = @user.password_reset_tokens.create!
    assert_not_equal token1.token, token2.token
  end

  test "should set expiry on create" do
    token = @user.password_reset_tokens.create!
    assert_not_nil token.expires_at
    assert token.expires_at > Time.current
    assert token.expires_at <= 1.hour.from_now + 1.second
  end

  test "should be valid when not expired and not used" do
    token = @user.password_reset_tokens.create!
    assert token.valid_token?
  end

  test "should be invalid when expired" do
    token = @user.password_reset_tokens.create!
    token.update!(expires_at: 1.hour.ago)
    assert_not token.valid_token?
    assert token.expired?
  end

  test "should be invalid when used" do
    token = @user.password_reset_tokens.create!
    token.mark_as_used!
    assert_not token.valid_token?
    assert token.used?
  end

  test "should find valid token" do
    token = @user.password_reset_tokens.create!
    found = PasswordResetToken.find_valid_token(token.token)
    assert_equal token, found
  end

  test "should not find expired token" do
    token = @user.password_reset_tokens.create!
    token.update!(expires_at: 1.hour.ago)
    assert_nil PasswordResetToken.find_valid_token(token.token)
  end
end