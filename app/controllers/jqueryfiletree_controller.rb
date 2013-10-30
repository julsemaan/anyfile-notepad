class JqueryfiletreeController < GOauthController
  protect_from_forgery :only => []
  
  def content
    @root_id = params[:dir]
    @root_id.slice! '/'
    @dir = Jqueryfiletree.new(@root_id, @gapi).get_content
    render :layout => false
  end
end