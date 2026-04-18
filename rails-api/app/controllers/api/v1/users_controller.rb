module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_user, only: [:show, :update, :change_password]

      # GET /api/v1/users/me
      def show
        render json: {
          success: true,
          data: user_json(@user)
        }, status: :ok
      end

      # PUT /api/v1/users/me
      def update
        if @user.update(user_update_params)
          render json: {
            success: true,
            data: user_json(@user),
            message: 'プロフィールを更新しました'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Update failed',
            errors: @user.errors.messages
          }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/users/me/password
      def change_password
        current_password = params[:current_password]
        new_password = params[:new_password]
        new_password_confirmation = params[:new_password_confirmation]

        unless current_password.present? && new_password.present? && new_password_confirmation.present?
          render json: { success: false, error: 'All fields are required' }, status: :bad_request
          return
        end

        unless @user.authenticate(current_password)
          render json: { success: false, error: '現在のパスワードが正しくありません' }, status: :unprocessable_entity
          return
        end

        unless new_password == new_password_confirmation
          render json: { success: false, error: '新しいパスワードが一致しません' }, status: :unprocessable_entity
          return
        end

        if @user.update(password: new_password, password_confirmation: new_password_confirmation)
          render json: { success: true, message: 'パスワードを変更しました' }, status: :ok
        else
          render json: {
            success: false,
            error: 'Password update failed',
            errors: @user.errors.messages
          }, status: :unprocessable_entity
        end
      end

      # GET /api/v1/users/me/orders
      def orders
        orders = current_user.orders
                            .includes(order_items: { product: :product_images })
                            .order(created_at: :desc)

        render json: {
          success: true,
          data: orders.map { |order| order_json(order) }
        }, status: :ok
      end

      private

      def set_user
        @user = current_user
      end

      def user_update_params
        params.permit(:name, :address, :phone, :password, :password_confirmation)
      end

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

      def order_json(order)
        {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          total_amount: order.total_amount.to_f,
          shipping_address: order.shipping_address,
          created_at: order.created_at,
          updated_at: order.updated_at,
          items: order.order_items.map { |item| order_item_json(item) }
        }
      end

      def order_item_json(item)
        {
          id: item.id,
          product_name: item.product&.name,
          quantity: item.quantity,
          unit_price: item.unit_price.to_f,
          subtotal: item.subtotal.to_f
        }
      end
    end
  end
end
