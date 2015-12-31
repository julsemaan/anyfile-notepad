class PagesController < ApplicationController
  layout 'common_website'
  def home
    @title = "Home"
    @key = 'home'
    @columns = 3
    render :template => 'site_content/show'
  end
  
  def news
    @title = "News"
    @key = 'news'
    render :template => 'site_content/show'
  end
  
  def faq
    @title = "FAQ"
    @key = 'faq'
    render :template => 'site_content/show'
  end
  
  def help_translate
    @title = "Help in the translation"
    @key = 'help_translate'
    render :template => 'site_content/show'
  end
  
end
