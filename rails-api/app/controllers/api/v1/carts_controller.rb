module Api
  module V1
    class CartsController < ApplicationController
      before_action :set_cart

      # GET /api/v1/cart
      def show
        render json: { success: true, data: cart_json(@cart) }, status: :ok
      end

      # POST /api/v1/cart/items
       def add_item
        result = CartUsecase.new(@cart).add_item(
          product_id: params[:product_id],
          quantity: params[:quantity].to_i
        )
        render_result(result, 'カートに追加しました')
      end

      # PUT /api/v1/cart/items/:id
      def update_item
        result = CartUsecase.new(@cart).update_item(
          cart_item_id: params[:id],
          quantity: params[:quantity].to_i
        )
        render_result(result, 'カートを更新しました')
      end

      # DELETE /api/v1/cart/items/:id
      def remove_item
        result = CartUsecase.new(@cart).remove_item(cart_item_id: params[:id])
        render_result(result, '商品を削除しました')
      end

      # DELETE /api/v1/cart
      def clear
        result = CartUsecase.new(@cart).clear
        render_result(result, 'カートをクリアしました')
      end

      private

      def set_cart
        @cart = current_user.carts.active.first_or_create
      end

      def render_result(result, success_message)
        if result[:success]
          render json: {
            success: true,
            data: cart_json(@cart.reload),
            message: success_message
          }, status: :ok
        else
          render json: {
            success: false,
            error: result[:error]
          }, status: result[:http_status] || :unprocessable_content
        end
      end


      def cart_json(cart)
        {
          id: cart.id,
          items: cart.cart_items.includes(product: :product_images).map { |item| cart_item_json(item) },
          total_amount: cart.total_amount.to_f,
          item_count: cart.cart_items.sum(:quantity),
          created_at: cart.created_at,
          updated_at: cart.updated_at
        }
      end

      def cart_item_json(item)
        product = item.product
        {
          id: item.id,
          product_id: product.id,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.to_f,
            stock_quantity: product.stock_quantity,
            images: product.product_images.order(:display_order).map do |img|
              { id: img.id, image_url: img.image_url, display_order: img.display_order }
            end,
            is_active: product.is_active,
            is_suspended: product.is_suspended
          },
          quantity: item.quantity,
          subtotal: item.subtotal.to_f
        }
      end
    end
  end
end
