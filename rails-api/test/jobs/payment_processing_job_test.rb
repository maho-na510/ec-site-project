require 'test_helper'
require 'minitest/mock'

class PaymentProcessingJobTest < ActiveJob::TestCase
  setup do
    @order = orders(:one)
  end

  test "決済成功時にorderがprocessing状態になる" do
    PaymentService.stub(:process_payment, { success: true }) do
      PaymentProcessingJob.perform_now(@order.id, 'credit_card')
    end

    assert_equal 'processing', @order.reload.status
    assert_equal 'completed', @order.payment.status
  end

  test "決済失敗時にorderがcancelled状態になり在庫が戻る" do
    stock_before = @order.order_items.first.product.stock_quantity

    PaymentService.stub(:process_payment, { success: false, error: 'Card declined' }) do
      PaymentProcessingJob.perform_now(@order.id, 'credit_card')
    end

    assert_equal 'cancelled', @order.reload.status
    assert_equal 'failed', @order.payment.status
    assert_equal stock_before + @order.order_items.first.quantity,
                 @order.order_items.first.product.reload.stock_quantity
  end
end