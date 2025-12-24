# PasswordResetToken model - manages password reset workflow
class PasswordResetToken < ApplicationRecord
  # Associations
  belongs_to :user

  # Validations
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true
  validates :user, presence: true

  # Callbacks
  before_validation :generate_token, on: :create
  before_validation :set_expiry, on: :create

  # Scopes
  scope :active, -> { where('expires_at > ?', Time.current).where(used_at: nil) }
  scope :expired, -> { where('expires_at <= ?', Time.current) }
  scope :used, -> { where.not(used_at: nil) }

  # Token validity
  def valid_token?
    expires_at > Time.current && used_at.nil?
  end

  def expired?
    expires_at <= Time.current
  end

  def used?
    used_at.present?
  end

  # Mark token as used
  def mark_as_used!
    update!(used_at: Time.current)
  end

  # Class method to find and validate token
  def self.find_valid_token(token_string)
    token = find_by(token: token_string)
    return nil unless token&.valid_token?

    token
  end

  private

  def generate_token
    # Generate a secure random token
    self.token = SecureRandom.urlsafe_base64(32)

    # Ensure uniqueness
    while PasswordResetToken.exists?(token: token)
      self.token = SecureRandom.urlsafe_base64(32)
    end
  end

  def set_expiry
    # Token expires in 1 hour
    self.expires_at = 1.hour.from_now
  end
end
