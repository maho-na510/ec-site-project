class ApplicationController < ActionController::API
  include ActionController::Cookies

  # Handle common exceptions
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from InsufficientStockError, with: :insufficient_stock
  rescue_from StandardError, with: :internal_server_error

  # Authentication
  before_action :authenticate_user!

  private

  def authenticate_user!
    token = request.headers['Authorization']&.split(' ')&.last
    return render_unauthorized unless token

    begin
      decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
      @current_user = User.find(decoded_token[0]['user_id'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render_unauthorized
    end
  end

  def current_user
    @current_user
  end

  def render_unauthorized
    render json: {
      success: false,
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource'
    }, status: :unauthorized
  end

  def record_not_found(exception)
    render json: {
      success: false,
      error: 'Record not found',
      message: exception.message
    }, status: :not_found
  end

  def record_invalid(exception)
    render json: {
      success: false,
      error: 'Validation failed',
      errors: exception.record.errors.messages
    }, status: :unprocessable_entity
  end

  def insufficient_stock(exception)
    render json: {
      success: false,
      error: 'Insufficient stock',
      message: exception.message
    }, status: :unprocessable_entity
  end

  def internal_server_error(exception)
    Rails.logger.error "Internal Server Error: #{exception.message}"
    Rails.logger.error exception.backtrace.join("\n")

    render json: {
      success: false,
      error: 'Internal server error',
      message: Rails.env.production? ? 'An error occurred' : exception.message
    }, status: :internal_server_error
  end
end
