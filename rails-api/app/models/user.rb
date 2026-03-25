# ユーザーモデル - お客さんのアカウントを表す
# 注意点：
#   - has_secure_password を使うと password= と authenticate() が自動で使えるようになる
#   - パスワードの最小文字数は 6 にした（テストとフロントエンドと合わせること！）
#     最初 8 にしていたが、テストで「minimum is 6」というエラーが出て気づいた
#   - has_many :cart_items, through: :carts は必須！
#     user.cart_items と書けるようにするためにこのアソシエーションが必要
#     最初に書き忘れてテストが NoMethodError になった
class User < ApplicationRecord
  # has_secure_password で password のバリデーションと認証が使えるようになる
  has_secure_password

  # アソシエーション
  has_many :carts, dependent: :destroy
  has_many :cart_items, through: :carts  # カートを経由してアイテムにアクセスできる
  has_many :orders, dependent: :destroy
  has_many :password_reset_tokens, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 6 }, if: -> { password.present? }
  validates :phone, format: { with: /\A[\d\s\-\(\)\+]+\z/, message: "only allows numbers, spaces, and dashes" },
                    allow_blank: true

  # Callbacks
  before_save :downcase_email
  before_save :normalize_phone

  # Scopes
  scope :active, -> { where(deleted_at: nil) }
  scope :deleted, -> { where.not(deleted_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  # Soft delete
  def soft_delete
    update(deleted_at: Time.current)
  end

  def restore
    update(deleted_at: nil)
  end

  def deleted?
    deleted_at.present?
  end

  # Get or create active cart for user
  def active_cart
    carts.where(checked_out_at: nil).first_or_create
  end

  # JSON serialization
  def as_json(options = {})
    super(options.merge(except: [:password_digest, :deleted_at]))
  end

  private

  def downcase_email
    self.email = email.downcase if email.present?
  end

  def normalize_phone
    self.phone = phone.gsub(/[\s\-\(\)]/, '') if phone.present?
  end
end
