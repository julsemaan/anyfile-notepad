class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :execute_default
  after_filter :execute_after
  
  def execute_default
    @gapi = GApi.new
    api_client = @gapi.client
    
    begin
      api_client.authorization.update_token!(session)
      api_client.authorization.inspect
      if api_client.authorization.refresh_token &&
        api_client.authorization.expired?
        api_client.authorization.fetch_access_token!
    end
    rescue Signet::AuthorizationError
      redirect_to api_client.authorization.authorization_uri.to_s
      return
    end
    
    
    if params[:code]
      @to_store = @gapi.authorize_code(params[:code])
      @to_store.each do |key,value|
        session[key] = value
      end
    elsif params[:error]
      render :status => :forbidden, :text => "Authorization failed with Google API"
    end
    
    unless @gapi.authorized?
      redirect_to api_client.authorization.authorization_uri.to_s 
      return
    end
    
    if params[:state] and @gapi.authorized?
      state = MultiJson.decode(params[:state] || '{}')
      
      if state['folderId']
        redirect_to "/editor/new/#{state['folderId']}"
      else
        doc_id = state['ids'] ? state['ids'].first : ''
        redirect_to "/editor/edit/#{doc_id}"
      end
    end
    
    
  end
  
  def execute_after
    api_client = @gapi.client
    
    session[:access_token] = api_client.authorization.access_token
    session[:refresh_token] = api_client.authorization.refresh_token
    session[:expires_in] = api_client.authorization.expires_in
    session[:issued_at] = api_client.authorization.issued_at
  end
end
