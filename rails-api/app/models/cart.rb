# Cart model - shopping cart for user sessions
class Cart < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :cart_items, dependent: :destroy
  has_many :products, through: :cart_items

  # Validations
  validates :user, presence: true

  # Scopes
  scope :active, -> { where(checked_out_at: nil) }
  scope :checked_out, -> { where.not(checked_out_at: nil) }

  # Calculate total amount
  def total_amount
    cart_items.includes(:product).sum { |item| item.quantity * item.product.price }
  end

  # Calculate total items
  def total_items
    cart_items.sum(:quantity)
  end

  # Check if cart is empty
  def empty?
    cart_items.empty?
  end

  # Add product to cart
  def add_product(product, quantity = 1)
    current_item = cart_items.find_by(product_id: product.id)

    if current_item
      current_item.quantity += quantity
      current_item.save!
    else
      cart_items.create!(product: product, quantity: quantity)
    end
  end

  # Update product quantity
  def update_product(product, quantity)
    item = cart_items.find_by(product_id: product.id)
    return false unless item

    if quantity <= 0
      item.destroy
    else
      item.update(quantity: quantity)
    end
  end

  # Remove product from cart
  def remove_product(product)
    cart_items.find_by(product_id: product.id)&.destroy
  end

  # Clear all items
  def clear
    cart_items.destroy_all
  end

  # Mark cart as checked out
  def checkout!
    update!(checked_out_at: Time.current)
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        cart_items: {
          include: {
            product: {
              only: [:id, :name, :price, :stock_quantity],
              include: { product_images: { only: [:image_url] } }
            }
          }
        }
      },
      methods: [:total_amount, :total_items]
    ))
  end
end
