# RegistrationService - handles user registration
class RegistrationService
  def initialize(params)
    @params = params
  end

  # Register new user
  def register
    # Validate parameters
    unless valid_params?
      return { success: false, errors: @errors }
    end

    # Check if user already exists
    if User.exists?(email: @params[:email]&.downcase)
      return { success: false, errors: { email: ['already exists'] } }
    end

    # Create user
    user = User.new(
      name: @params[:name],
      email: @params[:email],
      password: @params[:password],
      password_confirmation: @params[:password_confirmation],
      address: @params[:address],
      phone: @params[:phone]
    )

    if user.save
      # Generate authentication tokens
      auth_service = AuthenticationService.new(user: user)
      tokens = auth_service.generate_tokens(user)
      auth_service.store_session(user, tokens[:access_token])

      {
        success: true,
        user: user.as_json(except: [:password_digest]),
        access_token: tokens[:access_token],
        refresh_token: tokens[:refresh_token],
        message: 'Registration successful'
      }
    else
      { success: false, errors: user.errors.messages }
    end
  end

  private

  def valid_params?
    @errors = {}

    if @params[:name].blank?
      @errors[:name] = ['is required']
    end

    if @params[:email].blank?
      @errors[:email] = ['is required']
    elsif !@params[:email].match?(URI::MailTo::EMAIL_REGEXP)
      @errors[:email] = ['is invalid']
    end

    if @params[:password].blank?
      @errors[:password] = ['is required']
    elsif @params[:password].length < 8
      @errors[:password] = ['must be at least 8 characters']
    end

    if @params[:password] != @params[:password_confirmation]
      @errors[:password_confirmation] = ['does not match password']
    end

    @errors.empty?
  end
end
