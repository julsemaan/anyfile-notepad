namespace :db do
  desc "Fills database with the base data"
  task :initdata => :environment do
    # move this in migrations
    SiteContent.create!(:key => 'home', :value => "This content will be updated shortly. If it's not contact us.")
    Syntax.create!(:display_name => "Plain text", :ace_js_mode => "plain_text")
  end
  
end