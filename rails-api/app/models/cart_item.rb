# CartItem model - individual products in a cart
class CartItem < ApplicationRecord
  # Associations
  belongs_to :cart
  belongs_to :product

  # Validations
  validates :quantity, presence: true,
                       numericality: { only_integer: true, greater_than: 0 }
  validates :product_id, uniqueness: { scope: :cart_id }
  validates :cart, presence: true
  validates :product, presence: true
  validate :product_must_be_available
  validate :quantity_must_not_exceed_stock

  # Calculate subtotal for this item
  def subtotal
    quantity * product.price
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        product: {
          only: [:id, :name, :price, :stock_quantity],
          methods: [:available?]
        }
      },
      methods: [:subtotal]
    ))
  end

  private

  def product_must_be_available
    unless product&.available?
      errors.add(:product, "is not available for purchase")
    end
  end

  def quantity_must_not_exceed_stock
    if product && quantity && quantity > product.stock_quantity
      errors.add(:quantity, "cannot exceed available stock (#{product.stock_quantity} available)")
    end
  end
end
