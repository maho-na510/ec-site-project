class OrderProcessingService
  def initialize(user, params, payment_job: PaymentProcessingJob)
    @user = user
    @params = params
    @cart = user.active_cart
    @payment_job = payment_job
  end

  def execute
    unless @cart.cart_items.any?
      return { success: false, error: 'Cart is empty' }
    end

    unless @params[:shipping_address].present?
      return { success: false, error: 'Shipping address is required' }
    end
    
    payment_method = @params[:payment_method] || 'credit_card'
    unless %w[credit_card debit_card paypal bank_transfer].include?(payment_method)
      return { success: false, error: 'Invalid payment method' }
    end

    begin
      order = nil

      ActiveRecord::Base.transaction do
        lock_and_validate_inventory
        order = create_order
        deduct_inventory(order)
        @cart.checkout!
      end

      @payment_job.perform_later(order.id, payment_method)

      # send_confirmation_email(order)

      {
        success: true,
        order: order,
        message: 'Order placed successfully'
      }
    rescue InsufficientStockError => e
      { success: false, error: e.message }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, error: e.message }
    rescue StandardError => e
      # 決済失敗など: 注文が作成済みであればキャンセルして在庫を戻す
      if order
        begin
          order.cancel!
        rescue => cancel_error
          Rails.logger.error "Failed to cancel order #{order.id}: #{cancel_error.message}"
        end
      end
      Rails.logger.error "Order processing failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { success: false, error: 'Order processing failed. Please try again.' }
    end
  end

  private

  def lock_and_validate_inventory
    @locked_products = {}

    # 常にID昇順でロック → 全トランザクションが同じ順序でロックするのでデッドロックが起きない
    sorted_items = @cart.cart_items.sort_by(&:product_id)
    sorted_items.each do |item|
      product = Product.lock('FOR UPDATE').find(item.product_id)

      unless product.sufficient_stock?(item.quantity)
        raise InsufficientStockError,
              "Insufficient stock for #{product.name}. Only #{product.stock_quantity} available."
      end

      @locked_products[item.product_id] = product
    end
  end

  def create_order
    order = Order.new(
      user: @user,
      shipping_address: @params[:shipping_address],
      status: 'pending'
    )

    @cart.cart_items.each do |cart_item|
      product = @locked_products[cart_item.product_id] || cart_item.product
      order.order_items.build(
        product: product,
        quantity: cart_item.quantity,
        price_at_purchase: product.price
      )
    end

    order.save!
    order
  end

  def deduct_inventory(order)
    order.order_items.each do |item|
      product = @locked_products[item.product_id]

      rows_updated = Product.where(id: product.id)
                            .where('stock_quantity >= ?', item.quantity)
                            .update_all("stock_quantity = stock_quantity - #{item.quantity.to_i}")

      if rows_updated == 0
        raise InsufficientStockError,
              "Insufficient stock for #{product.name} (concurrent order may have taken the last item)"
      end

      Rails.logger.info "Deducted #{item.quantity} units of product #{product.id} (#{product.name})"
    end
  end

  def send_confirmation_email(order)
    # OrderMailer.confirmation(order).deliver_later
    Rails.logger.info "Order confirmation email sent for order #{order.order_number}"
  end
end