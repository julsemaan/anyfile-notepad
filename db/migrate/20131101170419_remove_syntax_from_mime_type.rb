class RemoveSyntaxFromMimeType < ActiveRecord::Migration
  def up
    remove_column :mime_types, :syntax_id
  end

  def down
    add_column :mime_types, :syntax_id, :integer
  end
end
