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

  test "should restrict deletion when products exist" do
    # dependent: :restrict_with_error のため、商品がある場合はカテゴリを削除できない
    assert @category.products.count > 0
    @category.destroy
    assert @category.errors[:base].any?, "商品があるカテゴリは削除できないはず"
    assert Category.exists?(@category.id), "カテゴリはまだ存在するはず"
  end
end
