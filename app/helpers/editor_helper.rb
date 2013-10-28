module EditorHelper
  def prefers_minimized
    if session[:prefers_minimized].nil?
      false
    else
      session[:prefers_minimized].to_bool
    end
  end
  
  def show_minimized?(g_file)
    #puts "Flash : "+flash
    #puts "Errors : "+g_file.errors
    if prefers_minimized
      if flash.empty?
        if not g_file.errors.any?
          return true
        end
      end
    end
    return false
  end
end
