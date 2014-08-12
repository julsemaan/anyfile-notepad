class GOauthController < ApplicationController
  before_filter :execute_default
  after_filter :execute_after
  
  def execute_default
    # if it's an ajax request
    if request.xhr?
      smooth_flow
    else
      enforced_flow
    end
        
    begin
      @preferences = Preferences.new(ActiveSupport::JSON.decode(cookies[:preferences]))
    rescue 
      @preferences = Preferences.new
    end
  end
  
  def smooth_flow
    @gapi.client.authorization.update_token!(session)
    @gapi.client.authorization.inspect
    @gapi.client.authorization.refresh_token
    
    unless @gapi.authorized?
      render :status => :forbidden, :text => "Authorization failed."
      return
    end
    
    begin
      @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get).data
    rescue
      render :status => :forbidden, :text => "Authorization failed."
      return
    end
    
  end
  
  def enforced_flow
    api_client = @gapi.client

    api_client.authorization.update_token!(session)
    api_client.authorization.inspect
    if api_client.authorization.refresh_token &&
      api_client.authorization.expired?
      begin
        api_client.authorization.fetch_access_token!
      rescue Signet::AuthorizationError
        do_g_oauth
        return
      end
    end
    
    unless @gapi.authorized?
      do_g_oauth
      return
    end
    
    begin
      @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get).data
    rescue
      do_g_oauth
      return
    end
  end
  
  def do_g_oauth
    redirect_to @gapi.get_authorization_uri.to_s 
    register_redirect_to
  end
  
  def keep_alive
    render :text => "Success #{@user['name']} is still authentificated."
  end
  
  def execute_after
    api_client = @gapi.client
    
    session[:access_token] = api_client.authorization.access_token
    session[:refresh_token] = api_client.authorization.refresh_token
    session[:expires_in] = api_client.authorization.expires_in
    session[:issued_at] = api_client.authorization.issued_at

    commit_preferences

  end

  def commit_preferences
    cookies[:preferences] = {:value => ActiveSupport::JSON.encode(@preferences.hash), :expires => 1.year.from_now}
  end  
end
