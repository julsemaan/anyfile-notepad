class ChangeSiteContentValueToText < ActiveRecord::Migration
  def up
    change_column :site_contents, :value, :text
  end

  def down
    change_column :site_contents, :value, :string
  end
end
