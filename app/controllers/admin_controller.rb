class AdminController < ActionController::Base
  http_basic_authenticate_with :name => "super", :password => "man"
  layout 'common_website'
end