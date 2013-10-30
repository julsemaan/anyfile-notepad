class Extension < ActiveRecord::Base
  attr_accessible :name, :syntax_id, :mime_type_id
  
  belongs_to :syntax
  belongs_to :mime_type
  
  validates_presence_of :syntax_id
  validates_presence_of :mime_type_id
  
end
