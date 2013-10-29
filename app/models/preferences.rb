class Preferences
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming
  
  PREFERENCES = {
    'prefers_minimized' => 'false',
    'ace_js_font_size' => "1em", 
  }
  
  HASH_PREFERENCES = [
    'syntaxes'
  ]
  
  attr_accessor :preferences, :gapi
  
  def initialize(gapi, previous_preferences={})
    self.gapi = gapi
    init_preferences(previous_preferences)
  end
  
  def init_preferences(previous_preferences)
    if previous_preferences.nil?
      stored_preferences = @gapi.get_preferences
      if stored_preferences.nil?
        self.preferences = {}
      else
        self.preferences = ActiveSupport::JSON.decode(stored_preferences['content'])
      end
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
    
    HASH_PREFERENCES.each do |key|
      if not self.preferences.has_key?(key)
        self.preferences[key] = {}
      elsif not self.preferences[key].respond_to?('each')
        old_value = self.preferences[key]
        self.preferences[key] = {}
      end
    end
  end
  
  def save
    saved_preferences = @gapi.get_preferences
    content = ActiveSupport::JSON.encode(self.preferences)
    if saved_preferences.nil?
      
      file = GFile.new(:title => 'preferences.json', :content=> content , :type => 'text/plain',:new_revision => false, :folder_id => 'appdata', :gapi => self.gapi)
      file.create
    else
      file = GFile.new(:id => saved_preferences['id'], :title => saved_preferences['title'], :content => saved_preferences['content'], :type => 'text/plain',:new_revision => 0, :folder_id => 'appdata', :gapi => self.gapi)
      file.save
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
          end
        else
          self.preferences[key] = val
        end
      end
    end
  end
end