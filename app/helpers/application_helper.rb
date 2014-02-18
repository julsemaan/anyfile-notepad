module ApplicationHelper
  def get_title
    if @title.nil?
      "Anyfile Notepad"
    else
      "#{@title} | Anyfile Notepad"
    end
  end
  
  def is_admin
    session[:logged_in]
  end
  
  def g_plus_url
    "https://plus.google.com/communities/109168786116242892967"
  end
  
  def chrome_store_url
    "https://chrome.google.com/webstore/detail/anyfile-notepad/ghlichmdnegmcpafgmmlpkegmcndlndi"
  end
end
