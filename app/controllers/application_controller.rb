class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :capture_auth_and_commands
  
  def capture_auth_and_commands
    @gapi = GApi.new
    api_client = @gapi.client
    
    
    if params[:code]
      @to_store = @gapi.authorize_code(params[:code])
      @to_store.each do |key,value|
        session[key] = value
      end
    elsif params[:error]
      render :status => :forbidden, :text => "Authorization failed with Google API"
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
  

end
