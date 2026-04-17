class WishlistItem < ApplicationRecord
  belongs_to :user
  belongs_to :product

  validates :user, presence: true
  validates :product, presence: true
  validates :product_id, uniqueness: { scope: :user_id, message: 'はすでにほしい物リストに追加されています' }
end
