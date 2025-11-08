class CreateUsers < ActiveRecord::Migration[7.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :email, null: false
      t.string :password_digest, null: false
      t.text :address
      t.string :phone

      t.timestamps
      t.datetime :deleted_at
    end

    add_index :users, :email, unique: true
    add_index :users, :deleted_at
  end
end
