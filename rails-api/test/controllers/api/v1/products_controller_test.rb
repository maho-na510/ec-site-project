require "test_helper"

class Api::V1::ProductsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @product = products(:one)
    @category = categories(:one)
  end

  test "should get index without authentication" do
    get api_v1_products_url, as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']
    assert_not_nil json_response['meta']
  end

  test "should get product details" do
    get api_v1_product_url(@product), as: :json

    assert_response :success
    assert json_response['success']
    assert_equal @product.id, json_response['data']['id']
    assert_not_nil json_response['data']['images']
  end

  test "should search products" do
    get search_api_v1_products_url, params: { query: @product.name }, as: :json

    assert_response :success
    assert json_response['success']
    assert json_response['data'].any?
  end

  test "should return error for empty search query" do
    get search_api_v1_products_url, params: { query: '' }, as: :json

    assert_response :bad_request
    assert_not json_response['success']
  end

  test "should get products by category" do
    get api_v1_products_url + "/categories/#{@category.id}", as: :json

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['meta']['category']
  end

  test "should paginate products" do
    get api_v1_products_url, params: { page: 1, per_page: 5 }, as: :json

    assert_response :success
    assert json_response['meta']['per_page'] <= 5
  end
end
