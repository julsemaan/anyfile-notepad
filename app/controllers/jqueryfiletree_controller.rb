class JqueryfiletreeController < ApplicationController 
  protect_from_forgery :only => []
    
  def content
    @root_id = params[:dir]
    if @root_id.nil?
      @root_id = 'root'
    else
      @root_id.slice! '/'
    end
    
    @dir = Jqueryfiletree.new(@root_id, cookies[:access_token]).get_content
    render :layout => false
  end
end
