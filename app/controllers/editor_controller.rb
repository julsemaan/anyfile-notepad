class EditorController < ApplicationController  
  require 'json'

  def app
    @device = current_device
    response.headers['X-Frame-Options'] = 'IDONTGIVEACRAP'
    render 'new'
  end

end
