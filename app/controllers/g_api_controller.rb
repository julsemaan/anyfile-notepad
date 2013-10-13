class GApiController < ApplicationController
  require 'json'
  def welcome
    @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get).data
    if params[:code]
      redirect_to g_api_welcome_path
    end
  end
  
  def user
    @user = @gapi.client.execute!(:api_method => @gapi.oauth_api.userinfo.get)
    data = JSON.pretty_generate(@user.data)
    render json: data
  end
  
  def about
    #@about = @gapi.client.execute!(:api_method => @gapi.drive_api.about.get)
    #render text: @about.data
    @root_id = @gapi.root_folder_id
    @gapi.get_folder_files @root_id
    
    render text: @root_id
  end
  
  
end
