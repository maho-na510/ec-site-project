module Api
  module V1
    class ProductsController < ApplicationController
      skip_before_action :authenticate_user!, only: [:index, :show, :search, :by_category]

      # GET /api/v1/products
      def index
        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min

        products = Product.active
                         .includes(:category, :product_images)
                         .order(created_at: :desc)
                         .page(page)
                         .per(per_page)

        render json: {
          success: true,
          data: products.map { |product| product_json(product) },
          meta: pagination_meta(products)
        }, status: :ok
      end

      # GET /api/v1/products/:id
      def show
        product = Product.active
                        .includes(:category, :product_images)
                        .find(params[:id])

        render json: {
          success: true,
          data: product_detail_json(product)
        }, status: :ok
      end

      # GET /api/v1/products/search
      def search
        query = params[:query] || params[:q]

        if query.blank?
          render json: { success: false, error: '検索キーワードを入力してください' }, status: :bad_request
          return
        end

        products = Product.active
                         .includes(:category, :product_images)
                         .where('name LIKE ? OR description LIKE ?', "%#{query}%", "%#{query}%")
                         .order(created_at: :desc)
                         .limit(50)

        render json: {
          success: true,
          data: products.map { |product| product_json(product) },
          meta: { count: products.size, query: query }
        }, status: :ok
      end

      # GET /api/v1/products/categories/:category_id
      def by_category
        category = Category.find(params[:category_id])

        page = params[:page]&.to_i || 1
        per_page = params[:per_page]&.to_i || 20
        per_page = [per_page, 100].min

        products = category.products
                          .active
                          .includes(:product_images)
                          .order(created_at: :desc)
                          .page(page)
                          .per(per_page)

        render json: {
          success: true,
          data: products.map { |product| product_json(product) },
          meta: pagination_meta(products).merge(category: category_json(category))
        }, status: :ok
      end

      private

      # 商品一覧用（画像配列を含む）
      def product_json(product)
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.to_f,
          stock_quantity: product.stock_quantity,
          category: category_json(product.category),
          images: product.product_images.map { |img| image_json(img) },
          is_active: product.is_active,
          is_suspended: product.is_suspended,
          created_at: product.created_at
        }
      end

      # 商品詳細用
      def product_detail_json(product)
        {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price.to_f,
          stock_quantity: product.stock_quantity,
          category: category_json(product.category),
          images: product.product_images.order(:display_order).map { |img| image_json(img) },
          is_active: product.is_active,
          is_suspended: product.is_suspended,
          created_at: product.created_at,
          updated_at: product.updated_at
        }
      end

      def image_json(image)
        {
          id: image.id,
          image_url: image.image_url,
          display_order: image.display_order
        }
      end

      def category_json(category)
        return nil unless category
        {
          id: category.id,
          name: category.name,
          description: category.description
        }
      end

      def pagination_meta(collection)
        {
          current_page: collection.current_page,
          total_pages: collection.total_pages,
          total_count: collection.total_count,
          per_page: collection.limit_value
        }
      end
    end
  end
end
