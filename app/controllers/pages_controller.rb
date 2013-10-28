class PagesController < ApplicationController
  layout 'common_website'
  def home
    @title = "Home"
    @content = SiteContent.find_by_key('home').value
  end
  
end