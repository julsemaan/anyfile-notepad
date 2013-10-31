class Syntax < ActiveRecord::Base
  attr_accessible :display_name, :ace_js_mode
  
  default_scope order('display_name ASC')
  
  has_many :mime_types
  
end
