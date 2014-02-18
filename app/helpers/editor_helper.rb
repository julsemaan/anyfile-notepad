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
  
  def themes_list
    themes = []
    Dir.foreach("#{Rails.root}/public/ace.js") do |filename|
      if filename.index("theme-")
        themes << filename
      end
    end
    themes.sort
  end
  
  def theme_display_name(filename)
    filename.slice!("theme-")
    filename.slice!(".js")
    filename.gsub! "_", " "
    filename.capitalize
  end
  
  def theme_name(filename)
    filename.slice!("theme-")
    filename.slice!(".js")
    "ace/theme/#{filename}"
  end
  
  def current_theme
    if @preferences.get_preference('theme').nil?
      return "ace/theme/dawn"
    else
      return @preferences.get_preference('theme')
    end
  end
end
