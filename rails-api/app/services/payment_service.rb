# PaymentService - handles payment processing (mocked for MVP)
class PaymentService
  # Process payment through payment gateway (mocked)
  def self.process_payment(payment)
    # Mock payment processing
    # In production, integrate with real payment gateway (Stripe, PayPal, etc.)

    case payment.payment_method
    when 'credit_card', 'debit_card'
      process_card_payment(payment)
    when 'paypal'
      process_paypal_payment(payment)
    when 'bank_transfer'
      process_bank_transfer(payment)
    else
      { success: false, error: 'Unsupported payment method' }
    end
  end

  # Mock credit/debit card payment processing
  def self.process_card_payment(payment)
    # Simulate payment gateway API call
    # In production: Call Stripe, Square, or other payment processor

    # Mock: 95% success rate for testing
    if rand(100) < 95
      {
        success: true,
        transaction_id: payment.transaction_id,
        message: 'Payment processed successfully'
      }
    else
      {
        success: false,
        error: 'Card declined'
      }
    end
  end

  # Mock PayPal payment processing
  def self.process_paypal_payment(payment)
    # Simulate PayPal API call
    # In production: Use PayPal SDK

    {
      success: true,
      transaction_id: payment.transaction_id,
      message: 'PayPal payment processed successfully'
    }
  end

  # Mock bank transfer processing
  def self.process_bank_transfer(payment)
    # Bank transfers are typically pending and confirmed later
    # In production: Integrate with bank API or manual verification

    {
      success: true,
      transaction_id: payment.transaction_id,
      message: 'Bank transfer initiated. Awaiting confirmation.'
    }
  end

  # Process refund (for order cancellations)
  def self.process_refund(payment)
    unless payment.completed?
      return { success: false, error: 'Can only refund completed payments' }
    end

    # Mock refund processing
    # In production: Call payment gateway refund API

    {
      success: true,
      transaction_id: "REFUND-#{payment.transaction_id}",
      message: 'Refund processed successfully'
    }
  end

  # Verify payment status (for webhooks/callbacks)
  def self.verify_payment(transaction_id)
    # Mock verification
    # In production: Verify with payment gateway

    {
      verified: true,
      status: 'completed',
      transaction_id: transaction_id
    }
  end
end
