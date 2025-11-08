# Category model - organizes products into logical groups
class Category < ApplicationRecord
  # Associations
  has_many :products, dependent: :restrict_with_error

  # Validations
  validates :name, presence: true, uniqueness: true, length: { maximum: 100 }
  validates :description, length: { maximum: 500 }, allow_blank: true

  # Scopes
  scope :alphabetical, -> { order(:name) }
  scope :with_products, -> { joins(:products).distinct }

  # Instance methods
  def product_count
    products.active.count
  end
end
