class AddMimeTypeToExtension < ActiveRecord::Migration
  def change
    add_column :extensions, :mime_type_id, :integer
    Extension.update_all(:mime_type_id => MimeType.find_by_type_name('text/plain'))
  end
end
