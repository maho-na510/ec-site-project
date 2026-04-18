require "test_helper"

# 注意: GET リクエストに params と as: :json を同時に渡すと Rails が POST として扱うことがある
# GET + params の場合は as: :json を省略し、Accept ヘッダーを明示する
class Api::V1::ProductsControllerTest < ActionDispatch::IntegrationTest
  ACCEPT_JSON = { 'Accept' => 'application/json' }.freeze

  setup do
    @product = products(:one)
    @category = categories(:one)
  end

  test "should get index without authentication" do
    get '/api/v1/products', headers: ACCEPT_JSON

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['data']
    assert_not_nil json_response['meta']
  end

  test "should get product details" do
    get "/api/v1/products/#{@product.id}", headers: ACCEPT_JSON

    assert_response :success
    assert json_response['success']
    assert_equal @product.id, json_response['data']['id']
    assert_not_nil json_response['data']['images']
  end

  test "should search products" do
    get '/api/v1/products/search', params: { query: @product.name }, headers: ACCEPT_JSON

    assert_response :success
    assert json_response['success']
    assert json_response['data'].any?
  end

  test "should return error for empty search query" do
    get '/api/v1/products/search', params: { query: '' }, headers: ACCEPT_JSON

    assert_response :bad_request
    assert_not json_response['success']
  end

  test "should get products by category" do
    get "/api/v1/products/categories/#{@category.id}", headers: ACCEPT_JSON

    assert_response :success
    assert json_response['success']
    assert_not_nil json_response['meta']['category']
  end

  test "should paginate products" do
    get '/api/v1/products', params: { page: 1, per_page: 5 }, headers: ACCEPT_JSON

    assert_response :success
    assert json_response['meta']['per_page'] <= 5
  end
end
