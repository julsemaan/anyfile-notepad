class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :capture_auth_and_commands
  
  def capture_auth_and_commands
    @gapi = GApi.new
    
    capture_auth_code
    capture_drive_commands

    unless session[:afn_redirect_to].nil?
      begin
        redirect_to session[:afn_redirect_to]
      rescue AbstractController::DoubleRenderError
        # a redirect flow has already been initiated
      end
      if session[:afn_lost_changes]
        flash[:error] = "You have been reauthenticated with Google. All your changes were discarded."
      else
        flash[:notice] = "You have been reauthenticated with Google." 
      end
      session[:afn_redirect_to] = nil
      session[:afn_lost_changes]=nil
    end
    
  end
  
  def register_redirect_to
    if request.put?
      session[:afn_redirect_to]=request.original_url+"/edit"
      session[:afn_lost_changes]=true
    elsif request.post?
      session[:afn_redirect_to]=request.original_url+"/new"
      session[:afn_lost_changes]=true
    else
      session[:afn_redirect_to]=request.original_url
      session[:afn_lost_changes]=false
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
