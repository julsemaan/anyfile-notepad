class JqueryfiletreeController < GOauthController
  protect_from_forgery :only => []
    
  def content
    @root_id = params[:dir]
    if @root_id.nil?
      @root_id = 'root'
    else
      @root_id.slice! '/'
    end
    
    @dir = Jqueryfiletree.new(@root_id, @gapi).get_content
    render :layout => false
  end
end