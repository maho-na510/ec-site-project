# OrderItem model - individual products within an order
class OrderItem < ApplicationRecord
  # Associations
  belongs_to :order
  belongs_to :product

  # Validations
  validates :quantity, presence: true,
                       numericality: { only_integer: true, greater_than: 0 }
  validates :price_at_purchase, presence: true,
                                numericality: { greater_than_or_equal_to: 0 }
  validates :order, presence: true
  validates :product, presence: true

  # Callbacks
  before_validation :set_price_at_purchase, on: :create

  # Calculate subtotal
  def subtotal
    quantity * price_at_purchase
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        product: { only: [:id, :name] }
      },
      methods: [:subtotal]
    ))
  end

  private

  def set_price_at_purchase
    self.price_at_purchase ||= product.price if product
  end
end
