class AdminController < ActionController::Base
  
  layout 'common_website'
  http_basic_authenticate_with :name => "super", :password => "man", :except => :index
  before_filter :remember_auth, :except => [:index, :logout]
  
  def remember_auth 
    session[:logged_in] = true
  end
  
  def forget_auth
    session[:logged_in] = false
  end
 
  def login
    render 'shared/login'
  end
  
  def logout
    forget_auth
    render 'shared/logout'
  end
end