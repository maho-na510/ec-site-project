module Api
  module V1
    class CartsController < ApplicationController
      before_action :set_cart

      # GET /api/v1/cart
      def show
        render json: {
          success: true,
          data: cart_json(@cart)
        }, status: :ok
      end

      # POST /api/v1/cart/items
      def add_item
        product = Product.active.find(params[:product_id])

        unless product.sufficient_stock?(params[:quantity].to_i)
          render json: {
            success: false,
            error: 'Insufficient stock',
            message: "在庫が不足しています（残り#{product.stock_quantity}個）"
          }, status: :unprocessable_entity
          return
        end

        result = CartService.new(@cart).add_item(
          product_id: product.id,
          quantity: params[:quantity].to_i
        )

        if result[:success]
          render json: {
            success: true,
            data: cart_json(@cart.reload),
            message: 'カートに追加しました'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Failed to add item',
            message: result[:error]
          }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/cart/items/:id
      def update_item
        cart_item = @cart.cart_items.find(params[:id])
        product = cart_item.product
        new_quantity = params[:quantity].to_i

        unless product.sufficient_stock?(new_quantity)
          render json: {
            success: false,
            error: 'Insufficient stock',
            message: "在庫が不足しています（残り#{product.stock_quantity}個）"
          }, status: :unprocessable_entity
          return
        end

        result = CartService.new(@cart).update_item(
          cart_item_id: cart_item.id,
          quantity: new_quantity
        )

        if result[:success]
          render json: {
            success: true,
            data: cart_json(@cart.reload),
            message: 'カートを更新しました'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Failed to update item',
            message: result[:error]
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/cart/items/:id
      def remove_item
        cart_item = @cart.cart_items.find(params[:id])

        result = CartService.new(@cart).remove_item(cart_item.id)

        if result[:success]
          render json: {
            success: true,
            data: cart_json(@cart.reload),
            message: '商品を削除しました'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Failed to remove item',
            message: result[:error]
          }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/cart
      def clear
        result = CartService.new(@cart).clear

        if result[:success]
          render json: {
            success: true,
            data: cart_json(@cart.reload),
            message: 'カートをクリアしました'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Failed to clear cart',
            message: result[:error]
          }, status: :unprocessable_entity
        end
      end

      private

      def set_cart
        @cart = current_user.carts.active.first_or_create
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
