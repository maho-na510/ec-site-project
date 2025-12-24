# PasswordResetService - handles password reset workflow
class PasswordResetService
  def initialize(params)
    @params = params
  end

  # Request password reset
  def request_reset
    user = User.active.find_by(email: @params[:email]&.downcase)

    unless user
      # For security, don't reveal if email exists
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      }
    end

    # Create password reset token
    reset_token = user.password_reset_tokens.create!

    # Send password reset email
    # In production: Use background job
    # PasswordResetMailer.reset_instructions(user, reset_token).deliver_later
    Rails.logger.info "Password reset token generated for user #{user.email}: #{reset_token.token}"

    {
      success: true,
      message: 'Password reset instructions sent to your email',
      token: reset_token.token # Remove this in production (only send via email)
    }
  end

  # Reset password with token
  def reset_password
    token = PasswordResetToken.find_valid_token(@params[:token])

    unless token
      return { success: false, error: 'Invalid or expired reset token' }
    end

    user = token.user

    # Validate new password
    if @params[:password].blank? || @params[:password].length < 8
      return { success: false, error: 'Password must be at least 8 characters' }
    end

    if @params[:password] != @params[:password_confirmation]
      return { success: false, error: 'Password confirmation does not match' }
    end

    # Update password
    if user.update(password: @params[:password], password_confirmation: @params[:password_confirmation])
      # Mark token as used
      token.mark_as_used!

      # Invalidate all existing sessions
      invalidate_all_sessions(user)

      {
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      }
    else
      { success: false, errors: user.errors.messages }
    end
  end

  private

  # Invalidate all existing sessions for user
  def invalidate_all_sessions(user)
    # Remove all session keys for this user from Redis
    pattern = "session:user:#{user.id}:*"
    keys = Redis.current.keys(pattern)
    Redis.current.del(*keys) if keys.any?
  end
end
