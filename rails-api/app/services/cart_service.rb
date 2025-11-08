# CartService - handles shopping cart operations
class CartService
  def initialize(user)
    @user = user
    @cart = user.active_cart
  end

  # Get current cart
  def get_cart
    {
      success: true,
      cart: @cart.as_json
    }
  end

  # Add item to cart
  def add_item(product_id, quantity = 1)
    product = Product.active.find_by(id: product_id)

    unless product
      return { success: false, error: 'Product not found or not available' }
    end

    # Validate quantity
    unless quantity.positive?
      return { success: false, error: 'Quantity must be positive' }
    end

    # Check stock availability
    unless product.sufficient_stock?(quantity)
      return { success: false, error: "Only #{product.stock_quantity} items available in stock" }
    end

    begin
      @cart.add_product(product, quantity)

      {
        success: true,
        cart: @cart.reload.as_json,
        message: 'Item added to cart'
      }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, error: e.message }
    end
  end

  # Update item quantity
  def update_item(cart_item_id, quantity)
    cart_item = @cart.cart_items.find_by(id: cart_item_id)

    unless cart_item
      return { success: false, error: 'Cart item not found' }
    end

    # Validate quantity
    unless quantity >= 0
      return { success: false, error: 'Quantity cannot be negative' }
    end

    # Check stock availability
    if quantity > 0 && !cart_item.product.sufficient_stock?(quantity)
      return { success: false, error: "Only #{cart_item.product.stock_quantity} items available in stock" }
    end

    begin
      if quantity.zero?
        cart_item.destroy
        message = 'Item removed from cart'
      else
        cart_item.update!(quantity: quantity)
        message = 'Cart updated'
      end

      {
        success: true,
        cart: @cart.reload.as_json,
        message: message
      }
    rescue ActiveRecord::RecordInvalid => e
      { success: false, error: e.message }
    end
  end

  # Remove item from cart
  def remove_item(cart_item_id)
    cart_item = @cart.cart_items.find_by(id: cart_item_id)

    unless cart_item
      return { success: false, error: 'Cart item not found' }
    end

    cart_item.destroy

    {
      success: true,
      cart: @cart.reload.as_json,
      message: 'Item removed from cart'
    }
  end

  # Clear cart
  def clear_cart
    @cart.clear

    {
      success: true,
      cart: @cart.reload.as_json,
      message: 'Cart cleared'
    }
  end

  # Validate cart before checkout
  def validate_cart
    if @cart.empty?
      return { valid: false, error: 'Cart is empty' }
    end

    # Check each item for availability and stock
    @cart.cart_items.each do |item|
      unless item.product.available?
        return { valid: false, error: "Product '#{item.product.name}' is no longer available" }
      end

      unless item.product.sufficient_stock?(item.quantity)
        return {
          valid: false,
          error: "Insufficient stock for '#{item.product.name}'. Only #{item.product.stock_quantity} available"
        }
      end
    end

    { valid: true }
  end
end
