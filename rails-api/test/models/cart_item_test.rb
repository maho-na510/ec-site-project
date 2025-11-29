require "test_helper"

class CartItemTest < ActiveSupport::TestCase
  def setup
    @cart_item = cart_items(:one)
    @user = users(:one)
    @product = products(:one)
  end

  test "should be valid with valid attributes" do
    assert @cart_item.valid?
  end

  test "should require user" do
    @cart_item.user = nil
    assert_not @cart_item.valid?
    assert_includes @cart_item.errors[:user], "must exist"
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

  test "should belong to user" do
    assert_respond_to @cart_item, :user
    assert_equal @user, @cart_item.user
  end

  test "should belong to product" do
    assert_respond_to @cart_item, :product
    assert_equal @product, @cart_item.product
  end

  test "should not allow duplicate product for same user" do
    duplicate_item = CartItem.new(
      user: @cart_item.user,
      product: @cart_item.product,
      quantity: 1
    )
    assert_not duplicate_item.valid?
    assert_includes duplicate_item.errors[:product_id], "has already been taken"
  end

  test "should allow same product for different users" do
    different_user = users(:two)
    new_item = CartItem.new(
      user: different_user,
      product: @cart_item.product,
      quantity: 1
    )
    assert new_item.valid?
  end

  test "should calculate subtotal" do
    expected_subtotal = @cart_item.quantity * @cart_item.product.price
    assert_equal expected_subtotal, @cart_item.subtotal
  end

  test "should validate quantity against stock" do
    out_of_stock_product = products(:out_of_stock)
    @cart_item.product = out_of_stock_product
    @cart_item.quantity = 1

    # This assumes you have stock validation
    # Adjust based on your actual implementation
    if @cart_item.respond_to?(:validate_stock_availability)
      assert_not @cart_item.valid?
    end
  end
end
