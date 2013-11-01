class GApi
  

  class_attribute :client
  class_attribute :authorization_uri_param
  
  PREFERENCE_FILE_NAME = "preferences.json"
  
  FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder'
  
  SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.install',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
    'https://www.googleapis.com/auth/drive.appdata',
    'https://www.googleapis.com/auth/drive.apps.readonly'
    
  ]
  
  def MAX_GET_FILE_SIZE
    1048576
  end
  
  def initialize()
    @client = Google::APIClient.new(:application_name => "Anyfile Notepad", :application_version => "0.1")
    
    @client.authorization.client_id = ENV["GOOGLE_CLIENT_ID"]
    @client.authorization.client_secret = ENV["GOOGLE_CLIENT_SECRET"]
    @client.authorization.redirect_uri = ENV["GOOGLE_REDIRECT_URI"]

    @client.authorization.scope = SCOPES
  end
  
  def authorized?
    return @client.authorization.access_token
  end
  
  def get_authorization_uri
    return @client.authorization.authorization_uri(:approval_prompt => :auto,)
  end
  
  def get_file_data(id)
    fields = "downloadUrl,id,mimeType,title,fileSize"
    result = @client.execute!(
    :api_method => drive_api.files.get,
    :parameters => { :fileId => id, :fields => fields })
    file_hash = result.data.to_hash
    puts "SIZE : " + result.data.fileSize.to_s
    if result.data.fileSize < self.MAX_GET_FILE_SIZE
      result = @client.execute(:uri => result.data.downloadUrl)
      file_hash['content'] = result.body
      file_hash
    else
      raise Exceptions::FileTooBigError.new
    end
  end
  
  def root_folder_id
    about_user['rootFolderId']
  end
  
  def get_folder_files(folder_id)
    query = "'#{folder_id}' in parents and trashed = false"
    fields = "items(id,mimeType,title)"
    parameters = {'q' => query, 'fields' => fields}
    result = client.execute(
        :api_method => drive_api.files.list,
        :parameters => parameters)

    children = result.data

    folders = []
    files = []
    
    children.items.each do |child|
      if child.mimeType == FOLDER_MIME_TYPE
        folders << GFolder.new(:id => child.id, :title => child.title, :persisted => true)
      else
        files << GFile.new(:id => child.id, :title => child.title)
      end
    end
    {:folders => folders, :files => files}
  end
  
  def authorize_code(code)
    api_client = @client
    api_client.authorization.code = code
    api_client.authorization.fetch_access_token!
    return {:access_token => api_client.authorization.access_token, :refresh_token => api_client.authorization.refresh_token, :expires_in => api_client.authorization.expires_in, :issued_at => api_client.authorization.issued_at}
  end
  
  def get_preferences
    query = "'appdata' in parents and trashed = false"
    fields = "items(id,mimeType,title,downloadUrl)"
    parameters = {'q' => query, 'fields' => fields}
    result = client.execute(
        :api_method => drive_api.files.list,
        :parameters => parameters)
    result.data.items.each do |child|
      if child.title == PREFERENCE_FILE_NAME
        return self.get_file_data(child.id)
      end
    end
    return nil
  end
  
  def count_preferences
    query = "'appdata' in parents and trashed = false"
    fields = "items(id,mimeType,title,downloadUrl)"
    parameters = {'q' => query, 'fields' => fields}
    result = client.execute(
        :api_method => drive_api.files.list,
        :parameters => parameters)
    return result.data.items.size
  end
  
  def about_user
    @client.execute!(:api_method => drive_api.about.get).data
  end
  
  def oauth_api
    return @client.discovered_api('oauth2', 'v2')
  end
  
  def drive_api
    return @client.discovered_api('drive', 'v2')
  end

 end