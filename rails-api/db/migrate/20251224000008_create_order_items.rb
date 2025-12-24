class CreateOrderItems < ActiveRecord::Migration[7.1]
  def change
    create_table :order_items do |t|
      t.references :order, null: false, foreign_key: true
      t.references :product, null: false, foreign_key: true
      t.integer :quantity, null: false
      t.decimal :price_at_purchase, precision: 10, scale: 2, null: false

      t.timestamps
    end

    add_index :order_items, :order_id
    add_index :order_items, :product_id
  end
end
