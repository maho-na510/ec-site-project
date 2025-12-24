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
  def lock_and_validate_inventory
    @cart.cart_items.each do |item|
      # Use pessimistic locking (FOR UPDATE) to prevent concurrent modifications
      product = Product.lock('FOR UPDATE').find(item.product_id)

      unless product.sufficient_stock?(item.quantity)
        raise InsufficientStockError,
              "Insufficient stock for #{product.name}. Only #{product.stock_quantity} available."
      end
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
      order.order_items.build(
        product: cart_item.product,
        quantity: cart_item.quantity,
        price_at_purchase: cart_item.product.price
      )
    end

    order.save!
    order
  end

  # Deduct inventory for ordered items
  def deduct_inventory(order)
    order.order_items.each do |item|
      product = item.product

      # Deduct stock
      product.deduct_stock!(item.quantity)

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
