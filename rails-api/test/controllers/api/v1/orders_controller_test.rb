require "test_helper"

class Api::V1::OrdersControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @product = products(:one)
    @order = orders(:one)
  end

  test "should get orders for authenticated user" do
    get api_v1_orders_url, headers: auth_headers(@user), as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']
    assert_not_nil json_response['meta']
  end

  test "should get order details" do
    get api_v1_order_url(@order), headers: auth_headers(@user), as: :json

    assert_response :success
    assert json_response['success']
    assert_equal @order.id, json_response['data']['id']
    assert_not_nil json_response['data']['items']
  end

  test "should create order from cart" do
    cart = @user.carts.create!
    cart.cart_items.create!(product: @product, quantity: 1)

    assert_difference('Order.count', 1) do
      post api_v1_orders_url,
        headers: auth_headers(@user),
        params: {
          shipping_address: '123 Test St, Test City, TS 12345',
          payment_method: 'credit_card'
        },
        as: :json
    end

    assert_response :created
    assert json_response['success']
    assert_not_nil json_response['data']['order_number']
  end

  test "should not create order with empty cart" do
    @user.carts.destroy_all

    assert_no_difference('Order.count') do
      post api_v1_orders_url,
        headers: auth_headers(@user),
        params: { shipping_address: '123 Test St' },
        as: :json
    end

    assert_response :unprocessable_entity
    assert_not json_response['success']
  end

  test "should not create order without shipping address" do
    cart = @user.carts.create!
    cart.cart_items.create!(product: @product, quantity: 1)

    post api_v1_orders_url,
      headers: auth_headers(@user),
      params: { shipping_address: '' },
      as: :json

    assert_response :unprocessable_entity
    assert_not json_response['success']
  end

  test "should cancel pending order" do
    pending_order = @user.orders.create!(
      order_number: 'TEST-001',
      total_amount: 100,
      status: 'pending',
      shipping_address: '123 Test St'
    )

    post cancel_api_v1_order_url(pending_order),
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    assert json_response['success']
    assert_equal 'cancelled', json_response['data']['status']
  end

  test "should not cancel completed order" do
    completed_order = @user.orders.create!(
      order_number: 'TEST-002',
      total_amount: 100,
      status: 'completed',
      shipping_address: '123 Test St'
    )

    post cancel_api_v1_order_url(completed_order),
      headers: auth_headers(@user),
      as: :json

    assert_response :unprocessable_entity
    assert_not json_response['success']
  end
end
