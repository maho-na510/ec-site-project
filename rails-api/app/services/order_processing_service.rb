# OrderProcessingService - handles order creation with pessimistic locking for concurrency
class OrderProcessingService
  def initialize(user, params)
    @user = user
    @params = params
    @cart = user.active_cart
  end

  # Execute order processing
  def execute
    # Validate cart
    validation = CartService.new(@user).validate_cart
    unless validation[:valid]
      return { success: false, error: validation[:error] }
    end

    # Validate shipping address
    unless @params[:shipping_address].present?
      return { success: false, error: 'Shipping address is required' }
    end

    # Process order within transaction with pessimistic locking
    begin
      order = nil

      ActiveRecord::Base.transaction do
        # Step 1: Lock and validate inventory
        lock_and_validate_inventory

        # Step 2: Create order
        order = create_order

        # Step 3: Deduct inventory
        deduct_inventory(order)

        # Step 4: Process payment
        process_payment(order)

        # Step 5: Clear cart
        @cart.checkout!
      end

      # Step 6: Background jobs (outside transaction)
      # send_confirmation_email(order)

      {
        success: true,
        order: order.as_json,
        message: 'Order placed successfully'
      }
    rescue InsufficientStockError => e
      { success: false, error: e.message }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, error: e.message }
    rescue StandardError => e
      Rails.logger.error "Order processing failed: #{e.message}"
      Rails.logger.error e.backtrace.join("\n")
      { success: false, error: 'Order processing failed. Please try again.' }
    end
  end

  private

  # Lock products and validate stock (prevents concurrent modifications)
  # FOR UPDATE でDB行ロックを取得し、他トランザクションが同じ商品を同時変更できないようにする
  def lock_and_validate_inventory
    @locked_products = {}
    @cart.cart_items.each do |item|
      # SELECT FOR UPDATE: このトランザクションが終わるまで他トランザクションはこの行を変更できない
      product = Product.lock('FOR UPDATE').find(item.product_id)

      unless product.sufficient_stock?(item.quantity)
        raise InsufficientStockError,
              "Insufficient stock for #{product.name}. Only #{product.stock_quantity} available."
      end

      # ロック済みオブジェクトをキャッシュ（後でARクエリキャッシュを経由しないように）
      @locked_products[item.product_id] = product
    end
  end

  # Create order record
  def create_order
    order = Order.new(
      user: @user,
      shipping_address: @params[:shipping_address],
      status: 'pending'
    )

    # Create order items from cart items
    @cart.cart_items.each do |cart_item|
      # ロック済み商品から価格を取得（ここで最新価格を固定する）
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

  # Deduct inventory for ordered items
  def deduct_inventory(order)
    order.order_items.each do |item|
      # ロック済みオブジェクトを使い、ARクエリキャッシュの古い値を避ける
      product = @locked_products[item.product_id]

      # SQLレベルのアトミックデクリメント（FOR UPDATEに加えた二重保護）
      # stock_quantity >= quantity の条件を満たす行のみ更新し、更新行数で成否を判定
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

  # Process payment (mocked)
  def process_payment(order)
    payment_method = @params[:payment_method] || 'credit_card'

    unless %w[credit_card debit_card paypal bank_transfer].include?(payment_method)
      raise ArgumentError, 'Invalid payment method'
    end

    # Create payment record
    payment = Payment.new(
      order: order,
      payment_method: payment_method,
      amount: order.total_amount,
      status: 'pending'
    )

    # Mock payment processing
    # In production, integrate with real payment gateway
    payment_result = PaymentService.process_payment(payment)

    if payment_result[:success]
      payment.mark_completed!
      order.mark_processing!
    else
      payment.mark_failed!
      raise StandardError, 'Payment processing failed'
    end

    payment
  end

  # Send order confirmation email (placeholder for background job)
  def send_confirmation_email(order)
    # In production, use background job (Sidekiq, etc.)
    # OrderMailer.confirmation(order).deliver_later
    Rails.logger.info "Order confirmation email sent for order #{order.order_number}"
  end
end
