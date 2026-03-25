module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:login, :register]

      # POST /api/v1/auth/login
      def login
        result = AuthenticationService.new(
          email: params[:email],
          password: params[:password]
        ).authenticate

        if result[:success]
          # result[:user] は as_json から返されたハッシュ（string keys）
          render json: {
            success: true,
            data: {
              user: format_user_hash(result[:user]),
              access_token: result[:access_token]
            }
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Authentication failed',
            message: 'メールアドレスまたはパスワードが正しくありません'
          }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/register
      def register
        user = User.new(user_params)

        if user.save
          result = AuthenticationService.new(
            email: user.email,
            password: params[:password]
          ).authenticate

          render json: {
            success: true,
            data: {
              user: user_json(user),
              access_token: result[:access_token]
            },
            message: '登録が完了しました'
          }, status: :created
        else
          render json: {
            success: false,
            error: 'Registration failed',
            errors: user.errors.messages
          }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/logout
      def logout
        token = extract_token_from_header

        if token && current_user
          AuthenticationService.logout(current_user, token)
          render json: { success: true, message: 'ログアウトしました' }, status: :ok
        else
          render json: { success: false, error: 'ログアウトに失敗しました' }, status: :bad_request
        end
      end

      # POST /api/v1/auth/refresh
      def refresh
        token = extract_token_from_header

        unless token
          render json: { success: false, error: 'No token provided' }, status: :unauthorized
          return
        end

        result = AuthenticationService.refresh_token(token)

        if result[:success]
          render json: {
            success: true,
            data: { access_token: result[:access_token] }
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Token refresh failed',
            message: result[:error]
          }, status: :unauthorized
        end
      end

      private

      def user_params
        params.permit(:name, :email, :password, :password_confirmation, :address, :phone)
      end

      # User モデルインスタンスからハッシュを生成
      def user_json(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          phone: user.phone,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      end

      # as_json で返ってきた string-keyed ハッシュを整形
      def format_user_hash(user_hash)
        {
          id: user_hash['id'],
          name: user_hash['name'],
          email: user_hash['email'],
          address: user_hash['address'],
          phone: user_hash['phone'],
          created_at: user_hash['created_at'],
          updated_at: user_hash['updated_at']
        }
      end

      def extract_token_from_header
        request.headers['Authorization']&.split(' ')&.last
      end
    end
  end
end
