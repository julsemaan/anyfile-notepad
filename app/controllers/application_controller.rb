class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :capture_auth_and_commands
  
  def capture_auth_and_commands
    @gapi = GApi.new
    
    capture_auth_code
    capture_drive_commands

    unless session[:afn_redirect_to].nil?
      redirect_to session[:afn_redirect_to]
      if session[:afn_lost_changes]
        flash[:error] = "You have been reauthenticated with Google. All your changes were discarded."
      else
        flash[:notice] = "You have been reauthenticated with Google." 
      end
      session[:afn_redirect_to] = nil
      session[:afn_lost_changes]=nil
    end
    
  end
  
  def capture_auth_code
    if params[:code]
      begin
        @to_store = @gapi.authorize_code(params[:code])
        @to_store.each do |key,value|
          session[key] = value
        end
      rescue Signet::AuthorizationError
      end
    elsif params[:error]
      render :status => :forbidden, :text => "Authorization failed with Google API"
    end
  end
  
  def capture_drive_commands
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
