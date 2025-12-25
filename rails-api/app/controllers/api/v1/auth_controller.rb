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
          render json: {
            success: true,
            data: {
              user: user_json(result[:user]),
              access_token: result[:access_token]
            }
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Authentication failed',
            message: 'Invalid email or password'
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
            message: 'Registration successful'
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

        if token
          AuthenticationService.invalidate_token(token)
          render json: {
            success: true,
            message: 'Logged out successfully'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'No token provided'
          }, status: :bad_request
        end
      end

      # POST /api/v1/auth/refresh
      def refresh
        token = extract_token_from_header

        unless token
          render json: {
            success: false,
            error: 'No token provided'
          }, status: :unauthorized
          return
        end

        result = AuthenticationService.refresh_token(token)

        if result[:success]
          render json: {
            success: true,
            data: {
              access_token: result[:access_token]
            }
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
        params.require(:user).permit(:name, :email, :password, :password_confirmation, :address)
      end

      def user_json(user)
        {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      end

      def public_action?
        %w[login register].include?(action_name)
      end
    end
  end
end
