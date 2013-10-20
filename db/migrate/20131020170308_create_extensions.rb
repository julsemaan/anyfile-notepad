class CreateExtensions < ActiveRecord::Migration
  def change
    create_table :extensions do |t|
      t.string :name
      t.integer :syntax_id
      t.timestamps
    end
  end
end
