class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :capture_auth_and_commands
  
  def capture_auth_and_commands
    @gapi = GApi.new

    capture_auth_code
    #capture_drive_commands

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
    
    begin
      @preferences = Preferences.new(ActiveSupport::JSON.decode(cookies[:preferences]))
    rescue 
      @preferences = Preferences.new
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
    puts "hello"
    if params[:state]
      state = MultiJson.decode(params[:state] || '{}')
      puts state.nil?
      if state['folderId']
        begin
          redirect_to "/editor/new/#{state['folderId']}"
        rescue AbstractController::DoubleRenderError
          # a redirect flow is already initiated
        end
      else
        doc_id = state['ids'] ? state['ids'].first : ''
        begin
          redirect_to "/editor/edit/#{doc_id}"
        rescue AbstractController::DoubleRenderError
          # a redirect flow is already initiated
        end
      end
    end
  end
 
  def commit_preferences
    cookies[:preferences] = {:value => ActiveSupport::JSON.encode(@preferences.hash), :expires => 1.year.from_now}
  end  
 

end
