class MimeType < ActiveRecord::Base
  attr_accessible :id, :type_name, :integrated, :syntax_id
  
  default_scope order('type_name ASC')
  
  belongs_to :syntax
  
  validates_presence_of :type_name
  validates :type_name, :uniqueness => true
  
  before_save :default_values
  def default_values
    if self.syntax.nil?
      self.syntax = Syntax.find_by_ace_js_mode(:plain_text)
    end
  end
  
  def self.add_if_not_known(type_name)
    if self.find_by_type_name type_name
      return
    else
      self.create(:type_name => type_name)
    end
  end
end
