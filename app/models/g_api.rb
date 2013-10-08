class GApi
  

  class_attribute :client
  
  SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/drive.install'
  ]
  
  def initialize()
    @client = Google::APIClient.new
    if Rails.env.production?
      g_api_config = ActiveSupport::JSON.decode(File.read('config/client_secret_449833954230-2t7rh19kj9n4cjb1t290ipq5m3meeja3.apps.googleusercontent.com.json'))
    else
      g_api_config = ActiveSupport::JSON.decode(File.read('config/client_secret_449833954230-k0jhblecv85a48vc4e81pf1pf3sk25fe.apps.googleusercontent.com.json'))
    end
    web_config = g_api_config["web"]
    @client.authorization.client_id = web_config["client_id"]
    @client.authorization.client_secret = web_config["client_secret"]
    @client.authorization.redirect_uri = web_config["redirect_uris"].first

    @client.authorization.scope = SCOPES
  end
  
  def authorized?
    return @client.authorization.access_token
  end
  
  def get_file_data(id)
    result = @client.execute!(
    :api_method => drive_api.files.get,
    :parameters => { :fileId => id })
    file_hash = result.data.to_hash
    result = @client.execute(:uri => result.data.downloadUrl)
    file_hash['content'] = result.body
    file_hash
  end
  
  def authorize_code(code)
    api_client = @client
    api_client.authorization.code = code
    api_client.authorization.fetch_access_token!
    # put the tokens to the sesion
    return {:access_token => api_client.authorization.access_token, :refresh_token => api_client.authorization.refresh_token, :expires_in => api_client.authorization.expires_in, :issued_at => api_client.authorization.issued_at}
  end
  
  def oauth_api
    return @client.discovered_api('oauth2', 'v2')
  end
  
  def drive_api
    return @client.discovered_api('drive', 'v2')
  end

 end