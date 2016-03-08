class RemoveUselessTables < ActiveRecord::Migration
  def up
    drop_table :administrators
  end

  def down
  end
end
