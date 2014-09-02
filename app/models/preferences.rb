class Preferences
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming
  
  PREFERENCES = {
    'prefers_minimized' => 'false',
    'ace_js_font_size' => "1em", 
    'ace_js_tab_size' => 4,
    'theme' => nil,
    'word_wrap' => false,
    'cache_file_explorer_enabled' => false,
    'file_explorer_height' => "300px", 
    'menu_width' => '280px',
    'saw_v2_notice' => false,
  }
  
  HASH_PREFERENCES = [
    'syntaxes'
  ]
  
  attr_accessor :preferences, :has_changed
  
  def initialize(previous_preferences={})
    init_preferences(previous_preferences)
  end
  
  def init_preferences(previous_preferences)
    if previous_preferences.nil? 
      self.preferences = {}
    else
      self.preferences = previous_preferences
    end
    validate_defaults
    
  end
  
  def hash
    self.preferences
  end
  
  def validate_defaults
    PREFERENCES.each do |key, default|
      puts key
      if not self.preferences.has_key?(key)
        self.preferences[key] = default
        self.has_changed = true
      end
    end
    
    HASH_PREFERENCES.each do |key|
      if not self.preferences.has_key?(key)
        self.preferences[key] = {}
        self.has_changed = true
      elsif not self.preferences[key].respond_to?('each')
        old_value = self.preferences[key]
        self.preferences[key] = {}
        self.has_changed = true
      end
    end
  end
  
  def get_preference(key)
    begin
      self.preferences[key]
    rescue
      nil
    end
  end
  
  def set_preferences(pref_hash)
    pref_hash.each do |key, val|
      if PREFERENCES.keys.include?(key) or HASH_PREFERENCES.include?(key)
        if pref_hash[key].respond_to?('each')
          pref_hash[key].each do |ukey, val|
            self.preferences[key][ukey] = val
            self.has_changed = true
          end
        else
          self.preferences[key] = val
          self.has_changed = true
        end
      end
    end
  end
end
