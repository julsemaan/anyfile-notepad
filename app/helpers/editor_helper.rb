module EditorHelper
  def prefers_minimized
    if @preferences.get_preference('prefers_minimized').nil?
      false
    else
      @preferences.get_preference('prefers_minimized').to_bool
    end
  end
  
  def show_minimized?(g_file)
    #puts "Flash : "+flash
    #puts "Errors : "+g_file.errors
    if prefers_minimized
      if not g_file.errors.any?
        if flash.empty?
          return true
        elsif not flash[:notice].nil? and flash.keys.count == 1
          return true
        end
      end
    end
    return false
  end
end
