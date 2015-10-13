class PagesController < ApplicationController
  layout 'common_website'
  def home
    @title = "Home"
    @key = 'home'
    @content = SiteContent.find_by_key(@key).value
    render :template => 'site_content/home'
  end
  
  def news
    @title = "News"
    @key = 'news'
    @content = SiteContent.find_by_key(@key).value
    render :template => 'site_content/show'
  end
  
  def faq
    @title = "FAQ"
    @key = 'faq'
    @content = SiteContent.find_by_key(@key).value
    render :template => 'site_content/show'
  end
  
end
