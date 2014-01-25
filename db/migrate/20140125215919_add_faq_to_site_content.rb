class AddFaqToSiteContent < ActiveRecord::Migration
  def change
    SiteContent.create!(:key => 'faq', :value => "")
  end
end
