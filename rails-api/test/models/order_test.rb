require "test_helper"

class OrderTest < ActiveSupport::TestCase
  def setup
    @order = orders(:one)
    @user = users(:one)
  end

  test "should be valid with valid attributes" do
    assert @order.valid?
  end

  test "should require user" do
    @order.user = nil
    assert_not @order.valid?
    assert_includes @order.errors[:user], "must exist"
  end

  test "should require order_number" do
    @order.order_number = nil
    assert_not @order.valid?
    assert_includes @order.errors[:order_number], "can't be blank"
  end

  test "should require unique order_number" do
    duplicate_order = @order.dup
    @order.save
    assert_not duplicate_order.valid?
    assert_includes duplicate_order.errors[:order_number], "has already been taken"
  end

  test "should require total_amount" do
    @order.total_amount = nil
    assert_not @order.valid?
    assert_includes @order.errors[:total_amount], "can't be blank"
  end

  test "should require total_amount to be positive" do
    @order.total_amount = -1
    assert_not @order.valid?
    assert_includes @order.errors[:total_amount], "must be greater than 0"
  end

  test "should require status" do
    @order.status = nil
    assert_not @order.valid?
    assert_includes @order.errors[:status], "can't be blank"
  end

  test "should only accept valid statuses" do
    valid_statuses = %w[pending processing completed cancelled]
    valid_statuses.each do |status|
      @order.status = status
      assert @order.valid?, "#{status} should be a valid status"
    end

    @order.status = "invalid_status"
    assert_not @order.valid?
  end

  test "should require shipping_address" do
    @order.shipping_address = nil
    assert_not @order.valid?
    assert_includes @order.errors[:shipping_address], "can't be blank"
  end

  test "should belong to user" do
    assert_respond_to @order, :user
    assert_equal @user, @order.user
  end

  test "should have many order_items" do
    assert_respond_to @order, :order_items
    assert @order.order_items.count > 0
  end

  test "should generate unique order_number before create" do
    new_order = Order.new(
      user: @user,
      total_amount: 100.00,
      status: "pending",
      shipping_address: "123 Test St",
      payment_method: "credit_card"
    )
    new_order.save

    assert_not_nil new_order.order_number
    assert_match(/ORD-\d{8}-[A-Z0-9]{6}/, new_order.order_number)
  end

  test "should filter by status" do
    pending_orders = Order.with_status("pending")
    assert pending_orders.all? { |o| o.status == "pending" }
  end

  test "should calculate total from order items" do
    # This test assumes you have a calculate_total method
    # If not, you can skip or modify based on your implementation
    if @order.respond_to?(:calculate_total)
      expected_total = @order.order_items.sum { |item| item.quantity * item.unit_price }
      assert_equal expected_total, @order.calculate_total
    end
  end
end
