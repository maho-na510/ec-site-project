# Configure sensitive parameters which will be filtered from the log file.
# Use this to prevent sensitive data like passwords from appearing in logs.

Rails.application.config.filter_parameters += [
  :passw, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn,
  :password, :password_confirmation, :password_digest,
  :credit_card, :cvv, :card_number
]
