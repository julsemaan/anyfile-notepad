class AdminController < GOauthController
  
  layout 'common_website'
  #http_basic_authenticate_with :name => "super", :password => "man", :except => :index
  skip_before_filter :execute_default, :only => :index
  before_filter :authenticate_admin, :except => [:index, :logout]
  
  def authenticate_admin 
    if Administrator.is_admin(@user["id"])
      session[:logged_in] = true
    else
      render :status => :forbidden, :text => "Nice try #{@user['given_name']}... but you're not a registered admin. The FBI and your mother have been alerted. Find your own way back to the app."
    end
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
  
  def menu
    
  end
  
  def long_query_test
    sleep(10)
    render text: 'Done.'
  end
end