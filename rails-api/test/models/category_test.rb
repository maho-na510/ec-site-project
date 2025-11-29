require "test_helper"

class CategoryTest < ActiveSupport::TestCase
  def setup
    @category = categories(:one)
  end

  test "should be valid with valid attributes" do
    assert @category.valid?
  end

  test "should require name" do
    @category.name = nil
    assert_not @category.valid?
    assert_includes @category.errors[:name], "can't be blank"
  end

  test "should require unique name" do
    duplicate_category = @category.dup
    @category.save
    assert_not duplicate_category.valid?
    assert_includes duplicate_category.errors[:name], "has already been taken"
  end

  test "should have many products" do
    assert_respond_to @category, :products
    assert @category.products.count > 0
  end

  test "should destroy associated products when destroyed" do
    product_count = @category.products.count
    assert product_count > 0

    @category.destroy

    assert_equal 0, Product.where(category_id: @category.id).count
  end
end
