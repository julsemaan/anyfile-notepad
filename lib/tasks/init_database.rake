namespace :db do
  desc "Fills database with the base data"
  task :initdata => :environment do
    SiteContent.create!(:key => 'home', :value => "This content will be updated shortly. If it's not contact us.")
  end
  
end