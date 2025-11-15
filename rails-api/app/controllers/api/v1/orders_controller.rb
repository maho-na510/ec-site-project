module Api
  module V1
    class OrdersController < ApplicationController
      before_action :set_order, only: [:show, :cancel]

      # GET /api/v1/orders
      def index
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 10
        per_page = [per_page, 50].min

        orders = current_user.orders
                            .includes(order_items: { product: :product_images })
                            .order(created_at: :desc)
                            .page(page)
                            .per(per_page)

        render json: {
          success: true,
          data: orders.map { |order| order_json(order) },
          meta: pagination_meta(orders)
        }, status: :ok
      end

      # GET /api/v1/orders/:id
      def show
        render json: {
          success: true,
          data: order_detail_json(@order)
        }, status: :ok
      end

      # POST /api/v1/orders
      def create
        cart = current_user.carts.active.first

        unless cart&.cart_items&.any?
          render json: {
            success: false,
            error: 'Cart is empty',
            message: 'Please add items to cart before checkout'
          }, status: :unprocessable_entity
          return
        end

        # Validate shipping address
        unless params[:shipping_address].present?
          render json: {
            success: false,
            error: 'Shipping address is required'
          }, status: :unprocessable_entity
          return
        end

        # Process order
        result = OrderProcessingService.new(
          cart: cart,
          shipping_address: params[:shipping_address],
          payment_method: params[:payment_method] || 'credit_card'
        ).execute

        if result[:success]
          render json: {
            success: true,
            data: order_detail_json(result[:order]),
            message: 'Order created successfully'
          }, status: :created
        else
          render json: {
            success: false,
            error: 'Order creation failed',
            message: result[:error]
          }, status: :unprocessable_entity
        end
      rescue InsufficientStockError => e
        render json: {
          success: false,
          error: 'Insufficient stock',
          message: e.message
        }, status: :unprocessable_entity
      rescue StandardError => e
        Rails.logger.error "Order creation error: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")

        render json: {
          success: false,
          error: 'Order creation failed',
          message: 'An error occurred while processing your order'
        }, status: :internal_server_error
      end

      # POST /api/v1/orders/:id/cancel
      def cancel
        unless @order.can_be_cancelled?
          render json: {
            success: false,
            error: 'Cannot cancel order',
            message: "Orders with status '#{@order.status}' cannot be cancelled"
          }, status: :unprocessable_entity
          return
        end

        if @order.cancel!
          render json: {
            success: true,
            data: order_json(@order),
            message: 'Order cancelled successfully'
          }, status: :ok
        else
          render json: {
            success: false,
            error: 'Failed to cancel order',
            errors: @order.errors.messages
          }, status: :unprocessable_entity
        end
      end

      private

      def set_order
        @order = current_user.orders.find(params[:id])
      end

      def order_json(order)
        {
          id: order.id,
          status: order.status,
          total_amount: order.total_amount.to_f,
          shipping_address: order.shipping_address,
          payment_method: order.payment_method,
          item_count: order.order_items.sum(:quantity),
          created_at: order.created_at,
          updated_at: order.updated_at
        }
      end

      def order_detail_json(order)
        {
          id: order.id,
          status: order.status,
          total_amount: order.total_amount.to_f,
          shipping_address: order.shipping_address,
          payment_method: order.payment_method,
          items: order.order_items.includes(product: :product_images).map do |item|
            {
              id: item.id,
              product: {
                id: item.product.id,
                name: item.product.name,
                price: item.product.price.to_f,
                main_image: item.product.product_images.first&.image_url
              },
              quantity: item.quantity,
              unit_price: item.unit_price.to_f,
              subtotal: item.subtotal.to_f
            }
          end,
          created_at: order.created_at,
          updated_at: order.updated_at
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          per_page: collection.limit_value
        }
      end
    end
  end
end
