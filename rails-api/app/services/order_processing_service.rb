# 注文処理サービス - 在庫の同時購入を防ぐためにトランザクションとロックを使う
class OrderProcessingService
  def initialize(user, params)
    @user = user
    @params = params
    @cart = user.active_cart
  end

  def execute
    # カートのバリデーション
    validation = CartService.new(@user).validate_cart
    unless validation[:valid]
      return { success: false, error: validation[:error] }
    end

    # 配送先住所のチェック
    unless @params[:shipping_address].present?
      return { success: false, error: 'Shipping address is required' }
    end

    begin
      order = nil

      ActiveRecord::Base.transaction do
        # 1. 在庫をロックして確認
        lock_and_validate_inventory

        # 2. 注文レコードを作成
        order = create_order

        # 3. 在庫を減らす
        deduct_inventory(order)

        # 4. 決済処理
        process_payment(order)

        # 5. カートをクリア
        @cart.checkout!
      end

      # トランザクション外でメール送信などを行う（今回はコメントアウト）
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

  # 在庫をロックして確認する（FOR UPDATEで同時に別の注文が来ても上書きされないようにする）
  def lock_and_validate_inventory
    @locked_products = {}
    @cart.cart_items.each do |item|
      product = Product.lock('FOR UPDATE').find(item.product_id)

      unless product.sufficient_stock?(item.quantity)
        raise InsufficientStockError,
              "Insufficient stock for #{product.name}. Only #{product.stock_quantity} available."
      end

      # ロック済みオブジェクトをキャッシュ（後でARクエリキャッシュを経由しないように）
      @locked_products[item.product_id] = product
    end
  end

  # 注文レコードを作成する
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

  # 在庫を減らす
  def deduct_inventory(order)
    order.order_items.each do |item|
      # ロック済みオブジェクトを使い、ARクエリキャッシュの古い値を避ける
      product = @locked_products[item.product_id]

      # SQLで直接デクリメント（在庫が足りる場合だけ更新される）
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

  # 決済処理（今回はモック）
  def process_payment(order)
    payment_method = @params[:payment_method] || 'credit_card'

    unless %w[credit_card debit_card paypal bank_transfer].include?(payment_method)
      raise ArgumentError, 'Invalid payment method'
    end

    payment = Payment.new(
      order: order,
      payment_method: payment_method,
      amount: order.total_amount,
      status: 'pending'
    )

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

  def send_confirmation_email(order)
    # 本来はバックグラウンドジョブで送る
    # OrderMailer.confirmation(order).deliver_later
    Rails.logger.info "Order confirmation email sent for order #{order.order_number}"
  end
end
