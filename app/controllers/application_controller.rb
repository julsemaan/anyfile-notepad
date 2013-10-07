class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :execute_default
  
  def execute_default
    @gapi = GApi.new
    api_client = @gapi.client
    
    api_client.authorization.update_token!(session)
    if api_client.authorization.refresh_token &&
      api_client.authorization.expired?
      api_client.authorization.fetch_access_token!
    end
    
    
    if params[:code]
      @to_store = @gapi.authorize_code(params[:code])
      @to_store.each do |key,value|
        session[key] = value
      end
    elsif params[:error]
      render :status => :forbidden, :text => "Authorization failed with Google API"
    end
    
    redirect_to api_client.authorization.authorization_uri.to_s unless @gapi.authorized?
    
    if params[:state]
      state = MultiJson.decode(params[:state] || '{}')
      if state['parentId']
        redirect_to "/editor/new/#{state['parentId']}"
      else
        doc_id = state['ids'] ? state['ids'].first : ''
        redirect_to "/editor/edit/#{doc_id}"
      end
    end
    
    
  end
end
