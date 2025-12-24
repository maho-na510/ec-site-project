class CreateProductImages < ActiveRecord::Migration[7.1]
  def change
    create_table :product_images do |t|
      t.references :product, null: false, foreign_key: true
      t.string :image_url, null: false
      t.integer :display_order, null: false, default: 0

      t.timestamps
    end

    add_index :product_images, [:product_id, :display_order]
  end
end
