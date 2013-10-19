class Syntax < ActiveRecord::Base
  attr_accessible :display_name, :ace_js_mode
  
  has_many :mime_types
  
  default_scope order('display_name ASC')
  
end
