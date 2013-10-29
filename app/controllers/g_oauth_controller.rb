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
        redirect_to @gapi.get_authorization_uri.to_s
        return
      end
    end
    
    unless @gapi.authorized?
      redirect_to @gapi.get_authorization_uri.to_s
      return
    end
    
    begin
      @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get).data
    rescue
      redirect_to @gapi.get_authorization_uri.to_s 
    end
    
    @preferences = Preferences.new(@gapi, session[:preferences])
  end
  
  def execute_after
    api_client = @gapi.client
    
    session[:access_token] = api_client.authorization.access_token
    session[:refresh_token] = api_client.authorization.refresh_token
    session[:expires_in] = api_client.authorization.expires_in
    session[:issued_at] = api_client.authorization.issued_at
  end
end