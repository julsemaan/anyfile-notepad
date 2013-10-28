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
end
