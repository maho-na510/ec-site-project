require "test_helper"

class UserTest < ActiveSupport::TestCase
  def setup
    @user = users(:one)
  end

  test "should be valid with valid attributes" do
    assert @user.valid?
  end

  test "should require name" do
    @user.name = nil
    assert_not @user.valid?
    assert_includes @user.errors[:name], "can't be blank"
  end

  test "should require email" do
    @user.email = nil
    assert_not @user.valid?
    assert_includes @user.errors[:email], "can't be blank"
  end

  test "should require unique email" do
    duplicate_user = @user.dup
    duplicate_user.email = @user.email.upcase
    @user.save
    assert_not duplicate_user.valid?
    assert_includes duplicate_user.errors[:email], "has already been taken"
  end

  test "should normalize email to lowercase" do
    mixed_case_email = "TeSt@ExAmPlE.CoM"
    @user.email = mixed_case_email
    @user.save
    assert_equal mixed_case_email.downcase, @user.reload.email
  end

  test "should validate email format" do
    invalid_emails = %w[user@example user.example.com @example.com user@]
    invalid_emails.each do |invalid_email|
      @user.email = invalid_email
      assert_not @user.valid?, "#{invalid_email} should be invalid"
    end

    valid_emails = %w[user@example.com USER@foo.COM A_US-ER@foo.bar.org first.last@foo.jp]
    valid_emails.each do |valid_email|
      @user.email = valid_email
      assert @user.valid?, "#{valid_email} should be valid"
    end
  end

  test "should require password on create" do
    user = User.new(name: "Test", email: "new@example.com", address: "123 Main St")
    assert_not user.valid?
  end

  test "should require password with minimum length" do
    user = User.new(
      name: "Test User",
      email: "new@example.com",
      password: "short",
      password_confirmation: "short",
      address: "123 Main St"
    )
    assert_not user.valid?
    assert_includes user.errors[:password], "is too short (minimum is 6 characters)"
  end

  test "should authenticate with correct password" do
    user = User.create!(
      name: "Test User",
      email: "auth@example.com",
      password: "password123",
      password_confirmation: "password123",
      address: "123 Main St"
    )
    assert user.authenticate("password123")
    assert_not user.authenticate("wrong_password")
  end

  test "should have many orders" do
    assert_respond_to @user, :orders
    assert_equal 2, @user.orders.count
  end

  test "should have many cart_items" do
    assert_respond_to @user, :cart_items
    assert_equal 2, @user.cart_items.count
  end

  test "should soft delete user" do
    @user.destroy
    assert_not_nil @user.deleted_at
    assert_not User.find_by(id: @user.id)
    assert User.with_deleted.find_by(id: @user.id)
  end

  test "should exclude deleted users from default scope" do
    deleted_user = users(:deleted)
    assert_not_nil deleted_user.deleted_at
    assert_not User.all.include?(deleted_user)
  end
end
