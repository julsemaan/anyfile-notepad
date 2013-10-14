class CreateMimeTypes < ActiveRecord::Migration
  def change
    create_table :mime_types do |t|
      t.string :type_name
      t.boolean :integrated, :default => false
      t.timestamps
    end
  end
end
