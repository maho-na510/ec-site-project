class CreateCarts < ActiveRecord::Migration[7.1]
  def change
    create_table :carts do |t|
      t.references :user, null: false, foreign_key: true
      t.datetime :checked_out_at

      t.timestamps
    end

    add_index :carts, [:user_id, :checked_out_at]
  end
end
