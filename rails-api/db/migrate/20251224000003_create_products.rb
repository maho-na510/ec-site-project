class CreateProducts < ActiveRecord::Migration[7.1]
  def change
    create_table :products do |t|
      t.references :category, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.integer :stock_quantity, null: false, default: 0
      t.boolean :is_active, null: false, default: true
      t.boolean :is_suspended, null: false, default: false

      t.timestamps
      t.datetime :deleted_at
    end

    add_index :products, :name
    add_index :products, [:is_active, :is_suspended]
    add_index :products, :deleted_at
    add_index :products, :created_at
  end
end
