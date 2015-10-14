class EditorController < ApplicationController  
  require 'json'
  before_filter :check_browser

  def app
    @device = current_device
    response.headers['X-Frame-Options'] = 'IDONTGIVEACRAP'
    render 'new'
  end

end
