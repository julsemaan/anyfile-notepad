class GOauthController < ApplicationController
  before_filter :execute_default
  after_filter :execute_after
  
  def execute_default
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
    
    begin
      @preferences = Preferences.new(ActiveSupport::JSON.decode(cookies[:preferences]))
    rescue 
      @preferences = Preferences.new
    end
  end
  
  def do_g_oauth
    redirect_to @gapi.get_authorization_uri.to_s 
    session[:afn_redirect_to]=request.original_url
  end
  
  def execute_after
    api_client = @gapi.client
    
    session[:access_token] = api_client.authorization.access_token
    session[:refresh_token] = api_client.authorization.refresh_token
    session[:expires_in] = api_client.authorization.expires_in
    session[:issued_at] = api_client.authorization.issued_at
  end
end