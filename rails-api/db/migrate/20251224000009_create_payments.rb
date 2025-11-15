class CreatePayments < ActiveRecord::Migration[7.1]
  def change
    create_table :payments do |t|
      t.references :order, null: false, foreign_key: true
      t.string :payment_method, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false
      t.string :status, null: false, default: 'pending'
      t.string :transaction_id

      t.timestamps
    end

    add_index :payments, :transaction_id
    add_index :payments, :status
  end
end
