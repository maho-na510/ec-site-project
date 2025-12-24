# ProductImage model - stores multiple images per product
class ProductImage < ApplicationRecord
  # Associations
  belongs_to :product

  # Validations
  validates :image_url, presence: true, length: { maximum: 500 }
  validates :display_order, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :product, presence: true

  # Scopes
  scope :ordered, -> { order(:display_order) }

  # Callbacks
  before_create :set_default_display_order

  private

  def set_default_display_order
    self.display_order ||= (product.product_images.maximum(:display_order) || -1) + 1
  end
end
