class RemoveSiteContents < ActiveRecord::Migration
  def up
    drop_table :site_contents
  end

  def down
  end
end
