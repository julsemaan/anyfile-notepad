class EditorController < ApplicationController  
  require 'json'
  before_filter :check_browser

  def check_browser
    if !browser.modern?
      redirect_to '/upgrade.html'      
    elsif browser.safari? && browser.version < '6'
      redirect_to '/upgrade.html'
    end
  end

  def app
    response.headers['X-Frame-Options'] = 'IDONTGIVEACRAP'
    render 'new'
  end

  def print 
    @title = params[:title]
    @content = params[:content]    
    render 'show'
  end

end
