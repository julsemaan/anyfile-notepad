desc "Create a new admin (with google id)"
task :create_admin, [:google_id] => :environment do |t, args|
  Administrator.create!(:google_id => args[:google_id])
end
