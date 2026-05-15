require "test_helper"

class PaymentTest < ActiveSupport::TestCase
  def setup
    @order = orders(:one)
    @payment = Payment.new(
      order: @order,
      payment_method: 'credit_card',
      amount: @order.total_amount,
      status: 'pending'
    )
  end

  test "transaction_id is generated on create" do
    @payment.save!
    assert_not_nil @payment.transaction_id
  end

  test "transaction_id starts with TXN-" do
    @payment.save!
    assert_match /\ATXN-/, @payment.transaction_id
  end

  test "transaction_id is unique" do
    @payment.save!
    duplicate = Payment.new(
      order: @order,
      payment_method: 'credit_card',
      amount: @order.total_amount,
      status: 'pending'
    )
    duplicate.save!
    assert_not_equal @payment.transaction_id, duplicate.transaction_id
  end
end