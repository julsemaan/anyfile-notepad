class Administrator < ActiveRecord::Base
  attr_accessible :google_id
  
  def self.is_admin(google_id)
    if self.find_by_google_id(google_id).nil?
      return false
    else
      return true
    end
  end
end
