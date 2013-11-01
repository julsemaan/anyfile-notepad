class MimeType < ActiveRecord::Base
  attr_accessible :id, :type_name, :integrated
  
  default_scope order('type_name ASC')
   
  validates_presence_of :type_name
  validates :type_name, :uniqueness => true
   
  def self.add_if_not_known(type_name)
    if self.find_by_type_name type_name
      return
    else
      self.create(:type_name => type_name)
    end
  end
end
