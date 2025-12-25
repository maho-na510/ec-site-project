module Api
  module V1
    class PasswordsController < ApplicationController
      skip_before_action :authenticate_user!, only: [:forgot, :reset]

      # POST /api/v1/passwords/forgot
      def forgot
        email = params[:email]&.downcase

        unless email.present?
          render json: {
            success: false,
            error: 'Email is required'
          }, status: :bad_request
          return
        end

        user = User.active.find_by(email: email)

        # Always return success to prevent email enumeration
        if user
          token = generate_reset_token(user)
          # In production, send email with reset link
          # PasswordMailer.reset_password(user, token).deliver_later
          Rails.logger.info "Password reset token for #{user.email}: #{token}"
        end

        render json: {
          success: true,
          message: 'If an account exists with that email, password reset instructions have been sent'
        }, status: :ok
      end

      # POST /api/v1/passwords/reset
      def reset
        token = params[:token]
        new_password = params[:password]
        password_confirmation = params[:password_confirmation]

        unless token.present? && new_password.present?
          render json: {
            success: false,
            error: 'Token and password are required'
          }, status: :bad_request
          return
        end

        unless new_password == password_confirmation
          render json: {
            success: false,
            error: 'Passwords do not match'
          }, status: :unprocessable_entity
          return
        end

        user = verify_reset_token(token)

        unless user
          render json: {
            success: false,
            error: 'Invalid or expired token',
            message: 'Please request a new password reset'
          }, status: :unauthorized
          return
        end

        if user.update(password: new_password, password_confirmation: password_confirmation)
          # Invalidate the reset token
          invalidate_reset_token(token)

          render json: {
            success: true,
            message: 'Password reset successfully'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Password reset failed',
            errors: user.errors.messages
          }, status: :unprocessable_entity
        end
      end

      private

      def generate_reset_token(user)
        token = SecureRandom.urlsafe_base64(32)
        reset_key = "password_reset:#{token}"

        Redis.current.setex(
          reset_key,
          1.hour.to_i,
          { user_id: user.id, email: user.email }.to_json
        )

        token
      end

      def verify_reset_token(token)
        reset_key = "password_reset:#{token}"
        data = Redis.current.get(reset_key)

        return nil unless data

        user_data = JSON.parse(data)
        User.active.find_by(id: user_data['user_id'])
      end

      def invalidate_reset_token(token)
        reset_key = "password_reset:#{token}"
        Redis.current.del(reset_key)
      end

      def public_action?
        true
      end
    end
  end
end
