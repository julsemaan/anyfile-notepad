class EditorController < ApplicationController  
  require 'json'
  before_filter :check_browser

  def check_browser
#    if !browser.modern?
#      redirect_to '/upgrade.html'      
#    end
  end

  def app
    @device = current_device
    response.headers['X-Frame-Options'] = 'IDONTGIVEACRAP'
    render 'new'
  end

  def print 
    @title = params[:title]
    @content = params[:content]    
    if @content.nil?
      render :text => "This request is invalid (no content parameter), you are probably lost or the developper is doing a poor job. Most likely the first one.",:status => 400
    else
      render 'show'
    end
  end

end
