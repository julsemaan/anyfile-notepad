class EditorController < ApplicationController  
  require 'json'

  def app
    response.headers['X-Frame-Options'] = 'IDONTGIVEACRAP'
    render 'new'
  end

end
