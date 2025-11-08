# Product model - represents items for sale
class Product < ApplicationRecord
  # Associations
  belongs_to :category
  has_many :product_images, dependent: :destroy
  has_many :cart_items, dependent: :restrict_with_error
  has_many :order_items, dependent: :restrict_with_error

  # Validations
  validates :name, presence: true, length: { maximum: 200 }
  validates :description, presence: true, length: { maximum: 2000 }
  validates :price, presence: true,
                    numericality: { greater_than_or_equal_to: 0 }
  validates :stock_quantity, presence: true,
                             numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :category, presence: true

  # Scopes
  scope :active, -> { where(is_active: true, is_suspended: false, deleted_at: nil) }
  scope :suspended, -> { where(is_suspended: true) }
  scope :in_stock, -> { where('stock_quantity > ?', 0) }
  scope :out_of_stock, -> { where(stock_quantity: 0) }
  scope :by_category, ->(category_id) { where(category_id: category_id) }
  scope :search, ->(query) { where('name LIKE ? OR description LIKE ?', "%#{query}%", "%#{query}%") }
  scope :price_range, ->(min, max) { where(price: min..max) }
  scope :recent, -> { order(created_at: :desc) }
  scope :popular, -> { joins(:order_items).group(:id).order('COUNT(order_items.id) DESC') }

  # Callbacks
  before_save :ensure_price_precision

  # Check if product is available for purchase
  def available?
    is_active && !is_suspended && deleted_at.nil? && stock_quantity > 0
  end

  # Check if sufficient stock is available
  def sufficient_stock?(quantity)
    stock_quantity >= quantity
  end

  # Deduct stock (use within transaction with lock)
  def deduct_stock!(quantity)
    raise InsufficientStockError, "Insufficient stock for #{name}" unless sufficient_stock?(quantity)

    update!(stock_quantity: stock_quantity - quantity)
  end

  # Add stock
  def add_stock!(quantity)
    update!(stock_quantity: stock_quantity + quantity)
  end

  # Soft delete
  def soft_delete
    update(deleted_at: Time.current, is_active: false)
  end

  def restore
    update(deleted_at: nil, is_active: true)
  end

  def deleted?
    deleted_at.present?
  end

  # Primary image
  def primary_image
    product_images.order(:display_order).first
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(
      include: {
        category: { only: [:id, :name] },
        product_images: { only: [:id, :image_url, :display_order] }
      },
      methods: [:available?]
    ))
  end

  private

  def ensure_price_precision
    self.price = price.round(2) if price.present?
  end
end

# Custom error class
class InsufficientStockError < StandardError; end
