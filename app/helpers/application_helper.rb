module ApplicationHelper
  def get_title
    if @title.nil?
      "Anyfile Notepad"
    else
      "#{@title} | Anyfile Notepad"
    end
  end
end
