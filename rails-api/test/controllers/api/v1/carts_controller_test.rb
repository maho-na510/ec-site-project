require "test_helper"

# カートコントローラーのテスト
# 注意：フィクスチャで既にカートが作られているので、テストで別のカートを作ると
# set_cart メソッドが最初のカートを返してしまい、新しく作ったアイテムを見つけられない
# → update/remove/clear のテストでは @user.carts.destroy_all で一度リセットする
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
    # 注意：products(:one) はフィクスチャのカートにすでに入っているので products(:three) を使う
    # 同じ商品をもう一度追加しようとすると数量が増えるだけで items.any? の確認はできる
    # でもフィクスチャの状態に依存するテストは壊れやすいので別商品を使う方が安全
    post api_v1_cart_items_url,
      headers: auth_headers(@user),
      params: { product_id: products(:three).id, quantity: 1 },
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
    # フィクスチャのカートと干渉しないよう一度削除してから作り直す
    @user.carts.destroy_all
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
    @user.carts.destroy_all
    cart = @user.carts.create!
    cart_item = cart.cart_items.create!(product: @product, quantity: 1)

    delete api_v1_cart_url + "/items/#{cart_item.id}",
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    assert json_response['success']
  end

  test "should clear cart" do
    @user.carts.destroy_all
    cart = @user.carts.create!
    cart.cart_items.create!(product: @product, quantity: 1)

    delete api_v1_cart_clear_url,
      headers: auth_headers(@user),
      as: :json

    assert_response :success
    assert json_response['success']
  end
end
