class CartUsecase
  def initialize(cart)
    @cart = cart
    @service = CartService.new(cart)
  end

  def add_item(product_id:, quantity:)
    product = Product.active.find_by(id: product_id)
    return error('Product not found', :not_found) unless product

    unless product.sufficient_stock?(quantity)
      return error(
        "在庫が不足しています（残り#{product.stock_quantity}個）",
        :unprocessable_content
      )
    end

    @service.add_item(product_id: product.id, quantity: quantity)
  end

  def update_item(cart_item_id:, quantity:)
    cart_item = @cart.cart_items.find_by(id: cart_item_id)
    return error('Cart item not found', :not_found) unless cart_item

    unless cart_item.product.sufficient_stock?(quantity)
      return error(
        "在庫が不足しています（残り#{cart_item.product.stock_quantity}個）",
        :unprocessable_content
      )
    end

    @service.update_item(cart_item_id: cart_item.id, quantity: quantity)
  end

  def remove_item(cart_item_id:)
    cart_item = @cart.cart_items.find_by(id: cart_item_id)
    return error('Cart item not found', :not_found) unless cart_item

    @service.remove_item(cart_item.id)
  end

  def clear
    @service.clear
  end

  private

  def error(message, status)
    { success: false, error: message, http_status: status }
  end
end