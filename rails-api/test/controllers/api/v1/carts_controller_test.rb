require "test_helper"

class Api::V1::CartsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @user = users(:one)
    @product = products(:one)
  end

  test "should get cart for authenticated user" do
    get api_v1_cart_url, headers: auth_headers(@user), as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']['id']
  end

  test "should not get cart without authentication" do
    get api_v1_cart_url, as: :json

    assert_response :unauthorized
  end

  test "should add item to cart" do
    post api_v1_cart_items_url,
      headers: auth_headers(@user),
      params: { product_id: @product.id, quantity: 2 },
      as: :json

    assert_response :success
    assert json_response['success']
    assert json_response['data']['items'].any?
  end

  test "should not add item with insufficient stock" do
    post api_v1_cart_items_url,
      headers: auth_headers(@user),
      params: { product_id: @product.id, quantity: 99999 },
      as: :json

    assert_response :unprocessable_entity
    assert_not json_response['success']
  end

  test "should update cart item quantity" do
    cart = @user.carts.create!
    cart_item = cart.cart_items.create!(product: @product, quantity: 1)

    put api_v1_cart_url + "/items/#{cart_item.id}",
      headers: auth_headers(@user),
      params: { quantity: 3 },
      as: :json

    assert_response :success
    assert json_response['success']
  end

  test "should remove item from cart" do
    cart = @user.carts.create!
    cart_item = cart.cart_items.create!(product: @product, quantity: 1)

    delete api_v1_cart_url + "/items/#{cart_item.id}",
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    assert json_response['success']
  end

  test "should clear cart" do
    cart = @user.carts.create!
    cart.cart_items.create!(product: @product, quantity: 1)

    delete api_v1_cart_clear_url,
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    assert json_response['success']
  end
end
