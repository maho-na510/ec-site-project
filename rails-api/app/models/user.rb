# User model - represents customer accounts
class User < ApplicationRecord
  # Secure password handling
  has_secure_password

  # Associations
  has_many :carts, dependent: :destroy
  has_many :orders, dependent: :destroy
  has_many :password_reset_tokens, dependent: :destroy

  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true,
                    uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { password.present? }
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
