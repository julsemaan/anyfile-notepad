class PagesController < ApplicationController
  layout 'common_website'
  def home
    @title = "Home"
  end
  
end