class JqueryfiletreeController < GOauthController
  protect_from_forgery :only => []
  
  skip_before_filter :execute_default
  before_filter :execute_default_smooth
  
  def execute_default_smooth
    @gapi.client.authorization.update_token!(session)
    @gapi.client.authorization.inspect
    @gapi.client.authorization.refresh_token
  end
   
  def content
    begin
      @root_id = params[:dir]
      @root_id.slice! '/'
      @dir = Jqueryfiletree.new(@root_id, @gapi).get_content
      render :layout => false
    rescue
      render :status => :forbidden, :text => "Authorization failed."
    end
  end
end