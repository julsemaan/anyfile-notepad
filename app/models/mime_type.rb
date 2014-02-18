class MimeType < ActiveRecord::Base
  attr_accessible :id, :type_name, :integrated, :discovered_by
  
  default_scope order('type_name ASC')
   
  validates_presence_of :type_name
  validates :type_name, :uniqueness => true
   
  def self.add_if_not_known(type_name, discovered_by)
    if self.find_by_type_name type_name
      return
    else
      self.create(:type_name => type_name, :discovered_by => discovered_by)
    end
  end
end
