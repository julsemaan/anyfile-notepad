class AddDiscoveredByToMimeTypes < ActiveRecord::Migration
  def change
    add_column :mime_types, :discovered_by, :string, :default => "John Doe"
    # Set default discoverer for previous mime types
    MimeType.update_all(:discovered_by => "John Doe")
  end
end
