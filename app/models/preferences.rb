class Preferences
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming
  
  PREFERENCES = {
    'prefers_minimized' => 'false',
    'ace_js_font_size' => "1em", 
  }
  
  ARRAY_PREFERENCES = [
    'syntaxes'
  ]
  
  attr_accessor :preferences
  
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
      if not self.preferences.has_key?(key)
        self.preferences[key] = default
      end
    end
    
    ARRAY_PREFERENCES.each do |key|
      if not self.preferences.has_key?(key)
        self.preferences[key] = []
      elsif not self.preferences[key].respond_to?('each')
        old_value = self.preferences[key]
        self.preferences[key] = []
        self.preferences[key] << old_value
      end
    end
  end
  
  def save
    
  end
  
  def get_preference(key)
    begin
      self.preferences[key]
    rescue
      nil
    end
  end
  
  def set_preferences(pref_hash)
    puts "Setting prefs #{pref_hash}"
    pref_hash.each do |key, val|
      if PREFERENCES.keys.include?(key) or ARRAY_PREFERENCES.include?(key)
        puts "Array includes key #{key}"
        if pref_hash[key].respond_to?('each')
          pref_hash[key].each do |ukey, val|
            self.preferences[key][ukey] = val
          end
        else
          self.preferences[key] = val
          puts "Setted pref #{key}"
        end
      end
    end
  end
end