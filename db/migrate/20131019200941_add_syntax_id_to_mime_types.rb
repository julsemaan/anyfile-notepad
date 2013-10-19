class AddSyntaxIdToMimeTypes < ActiveRecord::Migration
  def change
    add_column :mime_types, :syntax_id, :integer
  end
end
