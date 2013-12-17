class AddNewsPageToSiteContent < ActiveRecord::Migration
  def change
    SiteContent.create!(:key => 'news', :value => "")
  end
end
