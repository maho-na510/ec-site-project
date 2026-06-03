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
    Rails.logger.info "Password reset requested for user_id=#{user.id}" 

    {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    }
  end

  # Reset password with token
  def reset_password
    token = PasswordResetToken.find_valid_token(@params[:token])

    unless token
      return { success: false, error: 'Invalid or expired reset token' }
    end

    user = token.user

    if @params[:password].blank?
      return { success: false, errors: { password: ["can't be blank"] } }
    end
    
    begin
      ActiveRecord::Base.transaction do
        user.update!(password: @params[:password], password_confirmation: @params[:password_confirmation])
        token.mark_as_used!
      end

      # Redisはトランザクション外（DBロールバックの影響を受けないため）
      invalidate_all_sessions(user)

      {
        success: true,
        message: 'Password reset successfully. Please log in with your new password.'
      }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, errors: e.record.errors.messages }
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