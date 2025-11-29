require "test_helper"

class ProductTest < ActiveSupport::TestCase
  def setup
    @product = products(:one)
    @category = categories(:one)
  end

  test "should be valid with valid attributes" do
    assert @product.valid?
  end

  test "should require name" do
    @product.name = nil
    assert_not @product.valid?
    assert_includes @product.errors[:name], "can't be blank"
  end

  test "should require price" do
    @product.price = nil
    assert_not @product.valid?
    assert_includes @product.errors[:price], "can't be blank"
  end

  test "should require price to be positive" do
    @product.price = -1
    assert_not @product.valid?
    assert_includes @product.errors[:price], "must be greater than or equal to 0"
  end

  test "should accept zero price" do
    @product.price = 0
    assert @product.valid?
  end

  test "should require stock_quantity" do
    @product.stock_quantity = nil
    assert_not @product.valid?
    assert_includes @product.errors[:stock_quantity], "can't be blank"
  end

  test "should require stock_quantity to be non-negative" do
    @product.stock_quantity = -1
    assert_not @product.valid?
    assert_includes @product.errors[:stock_quantity], "must be greater than or equal to 0"
  end

  test "should belong to category" do
    assert_respond_to @product, :category
    assert_equal @category, @product.category
  end

  test "should have many images" do
    assert_respond_to @product, :images
  end

  test "should have many order_items" do
    assert_respond_to @product, :order_items
  end

  test "should have many cart_items" do
    assert_respond_to @product, :cart_items
  end

  test "should be in stock when stock_quantity is positive" do
    @product.stock_quantity = 10
    assert @product.in_stock?
  end

  test "should not be in stock when stock_quantity is zero" do
    @product.stock_quantity = 0
    assert_not @product.in_stock?
  end

  test "should be available when active and not suspended" do
    @product.is_active = true
    @product.is_suspended = false
    assert @product.available?
  end

  test "should not be available when inactive" do
    @product.is_active = false
    @product.is_suspended = false
    assert_not @product.available?
  end

  test "should not be available when suspended" do
    @product.is_active = true
    @product.is_suspended = true
    assert_not @product.available?
  end

  test "should filter active products" do
    active_products = Product.active
    assert active_products.all?(&:is_active)
  end

  test "should filter available products" do
    available_products = Product.available
    available_products.each do |product|
      assert product.is_active
      assert_not product.is_suspended
    end
  end

  test "should filter in_stock products" do
    in_stock_products = Product.in_stock
    assert in_stock_products.all? { |p| p.stock_quantity > 0 }
  end

  test "should search by name" do
    results = Product.search("Wireless")
    assert_includes results, @product
    assert results.all? { |p| p.name.downcase.include?("wireless") || p.description.downcase.include?("wireless") }
  end

  test "should filter by category" do
    products = Product.by_category(@category.id)
    assert products.all? { |p| p.category_id == @category.id }
  end
end
