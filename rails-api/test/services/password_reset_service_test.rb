require "test_helper"

class PasswordResetServiceTest < ActiveSupport::TestCase
  setup do
    @existing_user = users(:one)  # test@example.com（登録済み）
  end

  # =========================================================
  # request_reset: ユーザー列挙攻撃の防止
  # =========================================================

  test "request_reset returns same message for existing email" do
    service = PasswordResetService.new(email: @existing_user.email)
    result = service.request_reset

    assert result[:success]
    assert_equal 'If the email exists, a password reset link has been sent', result[:message]
  end

  test "request_reset returns same message for non-existing email" do
    service = PasswordResetService.new(email: 'nobody@example.com')
    result = service.request_reset

    assert result[:success]
    assert_equal 'If the email exists, a password reset link has been sent', result[:message]
  end

  test "request_reset responses are identical regardless of email existence" do
    existing_result = PasswordResetService.new(email: @existing_user.email).request_reset
    missing_result  = PasswordResetService.new(email: 'nobody@example.com').request_reset

    # キーも値も完全に一致すること（攻撃者が区別できないこと）
    assert_equal missing_result.keys.sort, existing_result.keys.sort
    assert_equal missing_result[:message],  existing_result[:message]
  end

  test "request_reset does not include token in response" do
    service = PasswordResetService.new(email: @existing_user.email)
    result = service.request_reset

    assert_nil result[:token], "APIレスポンスにトークンが含まれてはいけない"
  end

  # =========================================================
  # request_reset: ログにトークン・メールが含まれないこと
  # =========================================================

  test "request_reset does not log the reset token" do
    logged = []
    # Railsのloggerをキャプチャ
    Rails.logger.stub(:info, ->(msg) { logged << msg }) do
      PasswordResetService.new(email: @existing_user.email).request_reset
    end

    logged.each do |msg|
      assert_no_match(/[A-Za-z0-9_\-]{20,}/, msg, "ログにトークンらしき文字列が含まれています")
    end
  end

  test "request_reset does not log user email address" do
    logged = []
    Rails.logger.stub(:info, ->(msg) { logged << msg }) do
      PasswordResetService.new(email: @existing_user.email).request_reset
    end

    logged.each do |msg|
      assert_no_match(/@/, msg, "ログにメールアドレスが含まれています")
    end
  end

  # =========================================================
  # reset_password: バリデーションはモデルに委譲されること
  # =========================================================

  test "reset_password succeeds with valid token and password" do
    token = @existing_user.password_reset_tokens.create!
    service = PasswordResetService.new(
      token: token.token,
      password: "NewPass1",
      password_confirmation: "NewPass1"
    )
    service.define_singleton_method(:invalidate_all_sessions) { |_user| }
    result = service.reset_password

    assert result[:success]
    assert_equal "Password reset successfully. Please log in with your new password.", result[:message]
  end

  test "reset_password fails when password is too short via model validation" do
    token = @existing_user.password_reset_tokens.create!
    service = PasswordResetService.new(
      token: token.token,
      password: "abc1",
      password_confirmation: "abc1"
    )
    service.define_singleton_method(:invalidate_all_sessions) { |_user| }
    result = service.reset_password

    assert_not result[:success]
    assert result[:errors].present?
    assert result[:errors][:password].any?
  end

  test "reset_password fails when password is blank via model validation" do
    token = @existing_user.password_reset_tokens.create!
    service = PasswordResetService.new(
      token: token.token,
      password: "",
      password_confirmation: ""
    )
    service.define_singleton_method(:invalidate_all_sessions) { |_user| }
    result = service.reset_password

    assert_not result[:success]
    assert result[:errors].present?
  end

  test "reset_password fails when confirmation does not match via model validation" do
    token = @existing_user.password_reset_tokens.create!
    service = PasswordResetService.new(
      token: token.token,
      password: "NewPass1",
      password_confirmation: "Different1"
    )
    service.define_singleton_method(:invalidate_all_sessions) { |_user| }
    result = service.reset_password

    assert_not result[:success]
    assert result[:errors].present?
  end

  test "reset_password fails with invalid token" do
    service = PasswordResetService.new(
      token: "invalid_token",
      password: "NewPass1",
      password_confirmation: "NewPass1"
    )
    result = service.reset_password

    assert_not result[:success]
    assert_equal "Invalid or expired reset token", result[:error]
  end

end