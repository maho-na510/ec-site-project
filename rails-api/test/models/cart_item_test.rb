require "test_helper"

# CartItem は Cart に紐づく（User に直接紐づくわけではない）
# CartItem.cart_id がキーで、cart.user_id でユーザーを辿る
class CartItemTest < ActiveSupport::TestCase
  def setup
    @cart_item = cart_items(:one)
    @user = users(:one)
    @product = products(:one)
    @cart = carts(:one)
  end

  test "should be valid with valid attributes" do
    assert @cart_item.valid?
  end

  test "should require cart" do
    @cart_item.cart = nil
    assert_not @cart_item.valid?
    assert_includes @cart_item.errors[:cart], "must exist"
  end

  test "should require product" do
    @cart_item.product = nil
    assert_not @cart_item.valid?
    assert_includes @cart_item.errors[:product], "must exist"
  end

  test "should require quantity" do
    @cart_item.quantity = nil
    assert_not @cart_item.valid?
    assert_includes @cart_item.errors[:quantity], "can't be blank"
  end

  test "should require quantity to be positive" do
    @cart_item.quantity = 0
    assert_not @cart_item.valid?
    assert_includes @cart_item.errors[:quantity], "must be greater than 0"
  end

  test "should belong to cart" do
    assert_respond_to @cart_item, :cart
    assert_equal @cart, @cart_item.cart
  end

  test "should belong to product" do
    assert_respond_to @cart_item, :product
    assert_equal @product, @cart_item.product
  end

  test "should not allow duplicate product in same cart" do
    duplicate_item = CartItem.new(
      cart: @cart_item.cart,
      product: @cart_item.product,
      quantity: 1
    )
    assert_not duplicate_item.valid?
    assert_includes duplicate_item.errors[:product_id], "has already been taken"
  end

  test "should allow same product in different carts" do
    other_cart = carts(:two)
    new_item = CartItem.new(
      cart: other_cart,
      product: @cart_item.product,
      quantity: 1
    )
    assert new_item.valid?
  end

  test "should calculate subtotal" do
    expected_subtotal = @cart_item.quantity * @cart_item.product.price
    assert_equal expected_subtotal, @cart_item.subtotal
  end

  test "should reject out-of-stock product" do
    out_of_stock_product = products(:out_of_stock)
    @cart_item.product = out_of_stock_product
    @cart_item.quantity = 1

    assert_not @cart_item.valid?
    assert_includes @cart_item.errors[:product], "is not available for purchase"
  end
end
