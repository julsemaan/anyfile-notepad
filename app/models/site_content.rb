class SiteContent < ActiveRecord::Base
  attr_accessible :key, :value
  
  validates_uniqueness_of :key
  
  def to_param
    key
  end
  
end
