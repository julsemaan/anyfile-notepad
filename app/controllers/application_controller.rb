class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :capture_auth
  
  def capture_auth
    @gapi = GApi.new
    api_client = @gapi.client
    
    
    if params[:code]
      @to_store = @gapi.authorize_code(params[:code])
      @to_store.each do |key,value|
        session[key] = value
      end
    elsif params[:error]
      render :status => :forbidden, :text => "Authorization failed with Google API"
    end
  end

end
