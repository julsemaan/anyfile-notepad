class AddGeneralMessageToSiteContent < ActiveRecord::Migration
  def change
    SiteContent.create!(:key => 'editor_general_message', :value => "")
  end
end
