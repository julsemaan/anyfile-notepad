class GFile
  include ActiveModel::Validations
  include ActiveModel::Conversion
  extend ActiveModel::Naming
  
  
  
  attr_accessor :id, :title, :type, :content, :new_revision, :persisted, :gapi, :folder_id, :syntax
  
  validates :title, :presence => true
  
  def MAX_FILE_SIZE 
    1048576
  end
  
  
  
  def self.attr_accessor(*vars)
    @attributes ||= []
    @attributes.concat( vars )
    super
  end

  def self.attributes
    @attributes
  end
  
  def extension
    if self.title.nil?
      ""
    else
      File.extname(self.title) 
    end
    
  end

  def initialize(attributes={})
    # set the corresponding syntax or default syntax if not specified
    
    if attributes[:syntax].nil?
      begin
        extension_tmp = File.extname(attributes[:title])
        attributes[:syntax] = Extension.find_by_name(extension_tmp).syntax
      rescue
        attributes[:syntax] = Syntax.find_by_ace_js_mode :plain_text
      end
    end
    
    attributes && attributes.each do |name, value|
      send("#{name}=", value) if respond_to? name.to_sym 
    end
  end


  def self.inspect
    "#<#{ self.to_s} #{ self.attributes.collect{ |e| ":#{ e }" }.join(', ') }>"
  end
  
  def create
    if not self.valid? 
      return false 
    end
    
    extension_obj = Extension.find_by_name(extension)
    mime_type = "text/plain"
    unless extension_obj.nil?
      mime_type = extension_obj.mime_type.type_name
    end
    
    file_hash = gapi.drive_api.files.insert.request_schema.new({"title" => title, "mimeType" => mime_type, "parents" => [{"kind" => "drive#fileLink", "id" => folder_id}]}).to_hash

    
    temp = Tempfile.new "temp.tmp"
    temp.write content
    temp.rewind
    media = Google::APIClient::UploadIO.new(temp, mime_type)
    if temp.size > self.MAX_FILE_SIZE
      return false
    end
    
    result = gapi.client.execute!(
      :api_method => gapi.drive_api.files.insert,
      :body_object => file_hash,
      :media => media,
      :parameters => {
        'folderId' => folder_id,
        'uploadType' => 'multipart',
        'alt' => 'json'})
    
    self.id = result.data.to_hash['id']
    true
  end
  
  def save
    if not self.valid? 
      return false 
    end
    file_hash = gapi.drive_api.files.update.request_schema.new({"id" => id, "title" => title}).to_hash

    temp = Tempfile.new "temp.tmp"
    temp.write content
    temp.rewind
    media = Google::APIClient::UploadIO.new(temp, type)
    if temp.size > self.MAX_FILE_SIZE
      return false
    end

    result = @gapi.client.execute!(
      :api_method => gapi.drive_api.files.update,
      :body_object => file_hash,
      :media => media,
      :parameters => {
        'fileId' => id,
        'newRevision' => !new_revision.to_i.zero? || false,
        'uploadType' => 'multipart',
        'alt' => 'json' }
    )
    true
  end
  
  def persisted?
    persisted
  end

end