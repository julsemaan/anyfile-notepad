class JqueryfiletreeController < ApplicationController
  protect_from_forgery :only => []
  def content
    @root_id = params[:dir]
    @root_id.slice! '/'
    @dir = Jqueryfiletree.new(@root_id, @gapi).get_content
  end
end