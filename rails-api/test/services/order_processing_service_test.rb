require 'test_helper'
require 'minitest/mock'

class OrderProcessingServiceTest < ActiveSupport::TestCase

  class FakePaymentJob
    def self.perform_later(order_id, payment_method); end
  end

  setup do
    @user = users(:one)
    @product_one = products(:one)  # stock_quantity: 50
    @product_two = products(:two)  # stock_quantity: 100

    # フィクスチャのカートと混在しないよう、既存カートをすべて削除してから1つ作る
    @user.carts.destroy_all
    @cart = @user.carts.create!
    @cart.cart_items.create!(product: @product_one, quantity: 2)

    @params = {
      shipping_address: '123 Test St, Test City',
      payment_method: 'credit_card'
    }
  end

  # ---- 正常系 ----

  test "注文が正常に作成される" do
    result = OrderProcessingService.new(@user, @params, payment_job: FakePaymentJob).execute
    assert result[:success], result[:error]
    assert_not_nil result[:order]
  end

  test "注文後に在庫が減る" do
    stock_before = @product_one.stock_quantity
    OrderProcessingService.new(@user, @params, payment_job: FakePaymentJob).execute
    assert_equal stock_before - 2, @product_one.reload.stock_quantity
  end

  # ---- バリデーション ----

  test "カートが空の場合はエラーを返す" do
    @cart.cart_items.destroy_all
    result = OrderProcessingService.new(@user, @params, payment_job: FakePaymentJob).execute
    assert_not result[:success]
    assert_equal 'Cart is empty', result[:error]
  end

  test "配送先住所がない場合はエラーを返す" do
    result = OrderProcessingService.new(@user, @params.merge(shipping_address: ''), payment_job: FakePaymentJob).execute
    assert_not result[:success]
  end

  # ---- 在庫不足 ----

  test "在庫不足の場合は注文が作成されず在庫も変わらない" do
    @cart.cart_items.first.update_columns(quantity: 9999)
    stock_before = @product_one.reload.stock_quantity

    assert_no_difference('Order.count') do
      result = OrderProcessingService.new(@user, @params, payment_job: FakePaymentJob).execute
      assert_not result[:success]
    end

    assert_equal stock_before, @product_one.reload.stock_quantity
  end

  # ---- #10: デッドロック防止（ロック順序） ----

  test "複数商品がID昇順でロックされる" do
    @user.carts.destroy_all
    cart = @user.carts.create!

    # IDが大きい商品を先にカートに入れる（逆順）
    larger  = [@product_one, @product_two].max_by(&:id)
    smaller = [@product_one, @product_two].min_by(&:id)
    cart.cart_items.create!(product: larger,  quantity: 1)
    cart.cart_items.create!(product: smaller, quantity: 1)

    service = OrderProcessingService.new(@user, @params, payment_job: FakePaymentJob)
    service.execute

    locked_ids = service.instance_variable_get(:@locked_products).keys
    assert_equal locked_ids.sort, locked_ids, "ロックがID昇順になっていない"
  end
end