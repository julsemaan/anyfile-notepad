class GApi
  

  class_attribute :client
  
  SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ]
  
  def initialize()
    @client = Google::APIClient.new
    @client.authorization.client_id = "449833954230-2t7rh19kj9n4cjb1t290ipq5m3meeja3.apps.googleusercontent.com"
    @client.authorization.client_secret = "iTEiPHBh7O5K5wxx7aKazAqn"
    if Rails.env.production?
      @client.authorization.redirect_uri = "http://anyfile-notepad.herokuapp.com"
    else
      @client.authorization.redirect_uri = "http://scentos2.wiprogram.info:3000"
    end
    @client.authorization.scope = SCOPES
  end
  
  def authorized?
    return @client.authorization.access_token
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