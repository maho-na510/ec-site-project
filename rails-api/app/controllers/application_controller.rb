class ApplicationController < ActionController::API
  include ActionController::Cookies

  # 例外ハンドラー
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from InsufficientStockError, with: :insufficient_stock
  rescue_from StandardError, with: :internal_server_error

  # 認証
  before_action :authenticate_user!

  # フロントエンドはcamelCaseでリクエストを送るので、Rails用にsnake_caseに変換
  before_action :transform_request_params

  private

  # camelCase → snake_case 変換（例: shippingAddress → shipping_address）
  def transform_request_params
    request.parameters.deep_transform_keys! do |key|
      key.to_s.gsub(/([A-Z])/) { "_#{$1.downcase}" }
    end
  end

  def authenticate_user!
    # HttpOnly Cookie → Authorization ヘッダー の順でJWTを取得
    token = cookies[:access_token] || request.headers['Authorization']&.split(' ')&.last
    return render_unauthorized unless token

    # JWT検証 + Redisセッション存在確認の両方を通過した場合のみ認証成功
    # ログアウト済みトークンはRedisから削除されるため、ここで弾かれる
    @current_user = AuthenticationService.verify_token(token)
    render_unauthorized unless @current_user
  end

  def current_user
    @current_user
  end

  def render_unauthorized
    render json: {
      success: false,
      error: 'Unauthorized',
      message: '認証が必要です'
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
      message: Rails.env.production? ? 'エラーが発生しました' : exception.message
    }, status: :internal_server_error
  end
end
