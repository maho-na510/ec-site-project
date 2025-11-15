module Authenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user!, unless: :public_action?
  end

  private

  def authenticate_user!
    token = extract_token_from_header

    unless token
      render json: {
        success: false,
        error: 'Authentication required',
        message: 'No token provided'
      }, status: :unauthorized
      return
    end

    @current_user = AuthenticationService.verify_token(token)

    unless @current_user
      render json: {
        success: false,
        error: 'Invalid or expired token',
        message: 'Please log in again'
      }, status: :unauthorized
    end
  end

  def current_user
    @current_user
  end

  def extract_token_from_header
    auth_header = request.headers['Authorization']
    return nil unless auth_header

    # Format: "Bearer <token>"
    auth_header.split(' ').last if auth_header.start_with?('Bearer ')
  end

  def public_action?
    false
  end
end
