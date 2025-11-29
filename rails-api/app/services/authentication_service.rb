# AuthenticationService - handles user login and token generation
class AuthenticationService
  # JWT configuration
  JWT_SECRET = ENV.fetch('JWT_SECRET', Rails.application.credentials.secret_key_base)
  JWT_ALGORITHM = 'HS256'
  ACCESS_TOKEN_EXPIRY = 1.hour
  REFRESH_TOKEN_EXPIRY = 30.days

  def initialize(email: nil, password: nil, user: nil)
    @email = email
    @password = password
    @user = user
  end

  # Authenticate user and generate tokens
  def authenticate
    user = User.active.find_by(email: @email&.downcase)

    unless user&.authenticate(@password)
      return { success: false, error: 'Invalid email or password' }
    end

    tokens = generate_tokens(user)
    store_session(user, tokens[:access_token])

    {
      success: true,
      user: user.as_json(except: [:password_digest]),
      access_token: tokens[:access_token],
      refresh_token: tokens[:refresh_token],
      expires_in: ACCESS_TOKEN_EXPIRY.to_i
    }
  end

  # Refresh access token using refresh token
  def self.refresh_token(refresh_token)
    payload = decode_token(refresh_token)
    return { success: false, error: 'Invalid or expired refresh token' } unless payload

    user = User.active.find_by(id: payload['user_id'])
    return { success: false, error: 'User not found' } unless user

    service = new(user: user)
    tokens = service.generate_tokens(user)
    service.store_session(user, tokens[:access_token])

    {
      success: true,
      access_token: tokens[:access_token],
      refresh_token: tokens[:refresh_token],
      expires_in: ACCESS_TOKEN_EXPIRY.to_i
    }
  end

  # Verify and decode access token
  def self.verify_token(token)
    payload = decode_token(token)
    return nil unless payload

    # Check if session exists in Redis
    session_key = "session:user:#{payload['user_id']}:#{token[0..15]}"
    return nil unless $redis.exists?(session_key)

    User.active.find_by(id: payload['user_id'])
  end

  # Logout user
  def self.logout(user, token)
    # Remove session from Redis
    session_key = "session:user:#{user.id}:#{token[0..15]}"
    $redis.del(session_key)

    { success: true, message: 'Logged out successfully' }
  end

  # Generate access and refresh tokens
  def generate_tokens(user)
    {
      access_token: encode_token(user, ACCESS_TOKEN_EXPIRY),
      refresh_token: encode_token(user, REFRESH_TOKEN_EXPIRY, token_type: 'refresh')
    }
  end

  # Store session in Redis
  def store_session(user, token)
    session_key = "session:user:#{user.id}:#{token[0..15]}"
    session_data = {
      user_id: user.id,
      email: user.email,
      created_at: Time.current.to_s,
      last_accessed: Time.current.to_s
    }

    $redis.setex(session_key, 24.hours.to_i, session_data.to_json)
  end

  private

  def encode_token(user, expiry, token_type: 'access')
    payload = {
      user_id: user.id,
      email: user.email,
      token_type: token_type,
      exp: expiry.from_now.to_i,
      iat: Time.current.to_i
    }

    JWT.encode(payload, JWT_SECRET, JWT_ALGORITHM)
  end

  def self.decode_token(token)
    JWT.decode(token, JWT_SECRET, true, { algorithm: JWT_ALGORITHM })[0]
  rescue JWT::DecodeError, JWT::ExpiredSignature
    nil
  end
end
