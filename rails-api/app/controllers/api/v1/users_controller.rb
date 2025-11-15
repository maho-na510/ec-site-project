module Api
  module V1
    class UsersController < ApplicationController
      before_action :set_user, only: [:show, :update]

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
            message: 'Profile updated successfully'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Update failed',
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
        params.require(:user).permit(:name, :address, :password, :password_confirmation)
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

      def order_json(order)
        {
          id: order.id,
          status: order.status,
          total_amount: order.total_amount.to_f,
          shipping_address: order.shipping_address,
          created_at: order.created_at,
          updated_at: order.updated_at,
          items: order.order_items.map do |item|
            {
              id: item.id,
              product: product_summary_json(item.product),
              quantity: item.quantity,
              unit_price: item.unit_price.to_f,
              subtotal: item.subtotal.to_f
            }
          end
        }
      end

      def product_summary_json(product)
        {
          id: product.id,
          name: product.name,
          price: product.price.to_f,
          main_image: product.product_images.first&.image_url
        }
      end
    end
  end
end
