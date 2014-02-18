class CreateAdministrators < ActiveRecord::Migration
  def change
    create_table :administrators do |t|
      t.string :google_id
      t.timestamps
    end
  end
end
