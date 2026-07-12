# RegistrationService - handles user registration
class RegistrationService
  def initialize(params)
    @params = params
  end

  # Register new user
  def register

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

end
