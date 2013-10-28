class AdminController < ActionController::Base
  
  layout 'common_website'
  http_basic_authenticate_with :name => "super", :password => "man", :except => :index
  before_filter :remember_auth, :except => :index
  
  def remember_auth 
    session[:logged_in] = true
  end
end