class GApiController < ApplicationController
  
  def welcome
    @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get).data
    if params[:code]
      redirect_to g_api_welcome
    end
  end
  
  def user
    @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get)
    render json: @user.data
  end
  
  def about
    @about = @gapi.client.execute!(:api_method => @gapi.drive_api.about.get)
    render json: @about.data
  end
  
  
end
