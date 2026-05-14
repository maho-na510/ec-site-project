require 'test_helper'

class CartUsecaseTest < ActiveSupport::TestCase
  setup do
    @user  = users(:one)
    @cart  = @user.active_cart
    @usecase = CartUsecase.new(@cart)
  end

  # --- add_item ---

  test "add_item: 存在しない商品IDを渡すとエラーになる" do
    result = @usecase.add_item(product_id: 0, quantity: 1)
    assert_not result[:success]
    assert_equal :not_found, result[:http_status]
  end

  test "add_item: 在庫不足の場合はエラーになる" do
    product = products(:out_of_stock) 
    result = @usecase.add_item(product_id: product.id, quantity: 1)
    assert_not result[:success]
    assert_equal :unprocessable_content, result[:http_status]
  end

  test "add_item: 有効な商品と数量で成功する" do
    product = products(:three) 
    result = @usecase.add_item(product_id: product.id, quantity: 1)
    assert result[:success]
  end

  # --- update_item ---

  test "update_item: 存在しないカートアイテムIDはエラーになる" do
    result = @usecase.update_item(cart_item_id: 0, quantity: 1)
    assert_not result[:success]
    assert_equal :not_found, result[:http_status]
  end

  test "update_item: 在庫を超える数量はエラーになる" do
    item = cart_items(:one) 
    result = @usecase.update_item(cart_item_id: item.id, quantity: 99999)
    assert_not result[:success]
    assert_equal :unprocessable_content, result[:http_status]
  end

  # --- remove_item ---

  test "remove_item: 存在しないカートアイテムIDはエラーになる" do
    result = @usecase.remove_item(cart_item_id: 0)
    assert_not result[:success]
    assert_equal :not_found, result[:http_status]
  end

  test "remove_item: 正常に削除できる" do
    item = cart_items(:one)
    result = @usecase.remove_item(cart_item_id: item.id)
    assert result[:success]
  end
end