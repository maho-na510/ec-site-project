class PaymentProcessingJob < ApplicationJob
  queue_as :payments

  def perform(order_id, payment_method)
    order = Order.find(order_id)

    payment = Payment.create!(
      order: order,
      payment_method: payment_method,
      amount: order.total_amount,
      status: 'pending'
    )

    result = PaymentService.process_payment(payment)

    if result[:success]
      payment.mark_completed!
      order.mark_processing!
    else
      payment.mark_failed!
      order.cancel!
      Rails.logger.error "Payment failed for order #{order.id}: #{result[:error]}"
    end
  rescue => e
    Rails.logger.error "PaymentProcessingJob failed for order #{order_id}: #{e.message}"
    raise
  end
end