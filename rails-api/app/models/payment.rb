# Payment model - payment transaction records
class Payment < ApplicationRecord
  # Associations
  belongs_to :order

  # Validations
  validates :payment_method, presence: true,
                             inclusion: { in: %w[credit_card debit_card paypal bank_transfer] }
  validates :amount, presence: true,
                     numericality: { greater_than: 0 }
  validates :status, presence: true,
                     inclusion: { in: %w[pending completed failed refunded] }
  validates :order, presence: true
  validate :amount_matches_order_total

  # Callbacks
  before_create :generate_transaction_id

  # Scopes
  scope :pending, -> { where(status: 'pending') }
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :refunded, -> { where(status: 'refunded') }

  # State checks
  def pending?
    status == 'pending'
  end

  def completed?
    status == 'completed'
  end

  def failed?
    status == 'failed'
  end

  def refunded?
    status == 'refunded'
  end

  # State transitions
  def mark_completed!
    update!(status: 'completed')
  end

  def mark_failed!
    update!(status: 'failed')
  end

  def mark_refunded!
    raise "Cannot refund payment that is not completed" unless completed?
    update!(status: 'refunded')
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(except: [:transaction_id]))
  end

  private

  def generate_transaction_id
    # Generate unique transaction ID: TXN-TIMESTAMP-RANDOM
    timestamp = Time.current.to_i
    random = SecureRandom.hex(4).upcase

    self.transaction_id = "TXN-#{timestamp}-#{random}"
  end

  def amount_matches_order_total
    if order && amount && (amount - order.total_amount).abs > 0.01
      errors.add(:amount, "must match order total amount")
    end
  end
end
