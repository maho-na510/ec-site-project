module Api
  module V1
    class CategoriesController < ApplicationController
      skip_before_action :authenticate_user!, only: [:index, :show]

      # GET /api/v1/categories
      def index
        categories = Category.includes(:products)
                            .order(:name)

        render json: {
          success: true,
          data: categories.map { |category| category_json(category) }
        }, status: :ok
      end

      # GET /api/v1/categories/:id
      def show
        category = Category.includes(:products).find(params[:id])

        render json: {
          success: true,
          data: category_detail_json(category)
        }, status: :ok
      end

      private

      def category_json(category)
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          product_count: category.products.active.count,
          created_at: category.created_at
        }
      end

      def category_detail_json(category)
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          product_count: category.products.active.count,
          created_at: category.created_at,
          updated_at: category.updated_at
        }
      end

      def public_action?
        true
      end
    end
  end
end
