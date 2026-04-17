module Api
  module V1
    class ProductsController < ApplicationController
      skip_before_action :authenticate_user!, only: [:index, :show, :search, :by_category, :popular]

      # GET /api/v1/products
      def index
        page     = params[:page]&.to_i || 1
        per_page = [params[:per_page]&.to_i || 20, 100].min

        products = Product.active.includes(:category, :product_images)

        # 検索フィルター
        if params[:search].present?
          q = "%#{params[:search]}%"
          products = products.where('name LIKE ? OR description LIKE ?', q, q)
        end

        # カテゴリフィルター
        if params[:category_id].present?
          products = products.where(category_id: params[:category_id])
        end

        # 並び替え
        products = case params[:sort_by]
                   when 'price_asc'  then products.order(price: :asc)
                   when 'price_desc' then products.order(price: :desc)
                   when 'name'       then products.order(name: :asc)
                   else                   products.order(created_at: :desc)
                   end

        products = products.page(page).per(per_page)

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

      # GET /api/v1/products/popular
      def popular
        limit = [params[:limit]&.to_i || 10, 20].min

        popular_product_ids = OrderItem
          .joins(:order)
          .where(orders: { status: 'completed' })
          .group(:product_id)
          .order('SUM(quantity) DESC')
          .limit(limit)
          .pluck(:product_id)

        products_by_id = Product.active
          .includes(:category, :product_images)
          .where(id: popular_product_ids)
          .index_by(&:id)

        products = popular_product_ids.filter_map { |id| products_by_id[id] }

        # 注文データが少ない場合は新着で補完
        if products.size < limit
          existing_ids = products.map(&:id)
          filler = Product.active
            .includes(:category, :product_images)
            .where.not(id: existing_ids)
            .order(created_at: :desc)
            .limit(limit - products.size)
          products += filler
        end

        render json: {
          success: true,
          data: products.map { |product| product_json(product) }
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
