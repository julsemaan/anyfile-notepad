class Extension < ActiveRecord::Base
  attr_accessible :name, :syntax_id
  
  belongs_to :syntax
end
