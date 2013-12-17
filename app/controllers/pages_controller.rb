class PagesController < ApplicationController
  layout 'common_website'
  def home
    @title = "Home"
    @content = SiteContent.find_by_key('home').value
  end
  
  def news
    @title = "News"
    @content = SiteContent.find_by_key('news').value
  end
  
end