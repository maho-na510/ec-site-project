module Api
  module V1
    class WishlistsController < ApplicationController
      # GET /api/v1/wishlist/items
      def index
        items = current_user.wishlist_items
          .includes(product: [:category, :product_images])
          .order(created_at: :desc)

        render json: {
          success: true,
          data: items.map { |item| wishlist_item_json(item) }
        }, status: :ok
      end

      # POST /api/v1/wishlist/items
      def add
        product = Product.active.find(params[:product_id])
        item = current_user.wishlist_items.find_or_initialize_by(product: product)

        if item.persisted?
          render json: { success: false, message: 'すでにほしい物リストに追加済みです' }, status: :unprocessable_entity
        elsif item.save
          render json: {
            success: true,
            data: wishlist_item_json(item),
            message: 'ほしい物リストに追加しました'
          }, status: :created
        else
          render json: { success: false, errors: item.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/wishlist/items/:product_id
      def remove
        item = current_user.wishlist_items.find_by(product_id: params[:product_id])

        if item
          item.destroy
          render json: { success: true, message: 'ほしい物リストから削除しました' }, status: :ok
        else
          render json: { success: false, message: '該当する商品が見つかりません' }, status: :not_found
        end
      end

      private

      def wishlist_item_json(item)
        product = item.product
        {
          id: item.id,
          product_id: product.id,
          added_at: item.created_at,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price.to_f,
            stock_quantity: product.stock_quantity,
            is_active: product.is_active,
            is_suspended: product.is_suspended,
            category: product.category ? { id: product.category.id, name: product.category.name } : nil,
            images: product.product_images.map { |img|
              { id: img.id, image_url: img.image_url, display_order: img.display_order }
            }
          }
        }
      end
    end
  end
end
