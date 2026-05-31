require 'test_helper'

class RegistrationServiceTest < ActiveSupport::TestCase
  def valid_params
    {
      name:                  'Test User',
      email:                 'new_registration@example.com',
      password:              'Password1',
      password_confirmation: 'Password1'
    }
  end

  test 'registers successfully with valid params' do
    result = RegistrationService.new(valid_params).register
    assert result[:success]
    assert_equal 'new_registration@example.com', result[:user]['email']
  end

  test 'fails when name is blank' do
    result = RegistrationService.new(valid_params.merge(name: '')).register
    assert_not result[:success]
    assert result[:errors][:name].present?
  end

  test 'fails when email is blank' do
    result = RegistrationService.new(valid_params.merge(email: '')).register
    assert_not result[:success]
    assert result[:errors][:email].present?
  end

  test 'fails when email format is invalid' do
    result = RegistrationService.new(valid_params.merge(email: 'invalid-email')).register
    assert_not result[:success]
    assert result[:errors][:email].present?
  end

test 'fails when email already exists' do
  RegistrationService.new(valid_params.merge(email: 'duplicate@example.com')).register
  result = RegistrationService.new(valid_params.merge(email: 'duplicate@example.com')).register
  assert_not result[:success]
  assert result[:errors][:email].present?
end

  test 'fails when password is too short' do
    result = RegistrationService.new(
      valid_params.merge(password: 'short1', password_confirmation: 'short1')
    ).register
    assert_not result[:success]
    assert result[:errors][:password].present?
  end

  test 'fails when passwords do not match' do
    result = RegistrationService.new(
      valid_params.merge(password_confirmation: 'DifferentPass1')
    ).register
    assert_not result[:success]
    assert result[:errors][:password_confirmation].present?
  end
end