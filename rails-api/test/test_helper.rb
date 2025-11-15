ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"

class ActiveSupport::TestCase
  # Run tests in parallel with specified workers
  parallelize(workers: :number_of_processors)

  # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
  fixtures :all

  # Add more helper methods to be used by all tests here...

  def json_response
    JSON.parse(response.body)
  end

  def auth_headers(user)
    token = AuthenticationService.new(email: user.email, password: 'password123').authenticate[:access_token]
    { 'Authorization' => "Bearer #{token}" }
  end
end

class ActionDispatch::IntegrationTest
  def json_response
    JSON.parse(response.body)
  end

  def auth_headers(user)
    result = AuthenticationService.new(email: user.email, password: 'password123').authenticate
    { 'Authorization' => "Bearer #{result[:access_token]}" }
  end
end
