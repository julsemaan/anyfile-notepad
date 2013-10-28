class CreateSiteContents < ActiveRecord::Migration
  def change
    create_table :site_contents do |t|
      t.string :key, :unique => true
      t.string :value, :default => ""

      t.timestamps
    end
  end
end
