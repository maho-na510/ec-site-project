class CreateOrders < ActiveRecord::Migration[7.1]
  def change
    create_table :orders do |t|
      t.references :user, null: false, foreign_key: true
      t.string :order_number, null: false
      t.decimal :total_amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'pending'
      t.text :shipping_address, null: false

      t.timestamps
    end

    add_index :orders, :order_number, unique: true
    add_index :orders, [:user_id, :created_at]
    add_index :orders, :status
    add_index :orders, :created_at
  end
end
