# Order model - completed purchase records
class Order < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :order_items, dependent: :destroy
  has_one :payment, dependent: :destroy

  # Validations
  validates :order_number, presence: true, uniqueness: true
  validates :total_amount, presence: true,
                           numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true,
                     inclusion: { in: %w[pending processing completed cancelled] }
  validates :shipping_address, presence: true
  validates :user, presence: true

  # Callbacks
  before_validation :generate_order_number, on: :create
  before_validation :calculate_total_amount, on: :create

  # Scopes
  scope :recent, -> { order(created_at: :desc) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_status, ->(status) { where(status: status) }
  scope :pending, -> { where(status: 'pending') }
  scope :processing, -> { where(status: 'processing') }
  scope :completed, -> { where(status: 'completed') }
  scope :cancelled, -> { where(status: 'cancelled') }

  # State transitions
  def can_cancel?
    %w[pending processing].include?(status)
  end

  def cancel!
    raise "Cannot cancel order in #{status} status" unless can_cancel?

    transaction do
      # Restore stock
      order_items.each do |item|
        item.product.add_stock!(item.quantity)
      end

      update!(status: 'cancelled')
    end
  end

  def mark_processing!
    update!(status: 'processing')
  end

  def mark_completed!
    update!(status: 'completed')
  end

  # Calculate total items
  def total_items
    order_items.sum(:quantity)
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        order_items: {
          include: {
            product: { only: [:id, :name] }
          }
        },
        payment: { only: [:payment_method, :status, :amount] }
      },
      methods: [:total_items]
    ))
  end

  private

  def generate_order_number
    # Generate unique order number: ORD-YYYYMMDD-XXXXXX
    date_part = Time.current.strftime('%Y%m%d')
    random_part = SecureRandom.hex(3).upcase

    self.order_number = "ORD-#{date_part}-#{random_part}"

    # Ensure uniqueness
    while Order.exists?(order_number: order_number)
      random_part = SecureRandom.hex(3).upcase
      self.order_number = "ORD-#{date_part}-#{random_part}"
    end
  end

  def calculate_total_amount
    return if order_items.empty?

    self.total_amount = order_items.sum { |item| item.quantity * item.price_at_purchase }
  end
end
