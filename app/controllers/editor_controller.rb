class EditorController < ApplicationController
  require 'json'
  def new
  
  end
  
  def new
    @file = GFile.new(:type => 'text/plain', :persisted => false, :folder_id => params[:folder_id])
  end
  
  def create
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    @file.create
    #render text: @file.id
    redirect_to edit_g_file_path @file.id
  end
  
	def edit
    file_hash = @gapi.get_file_data(params[:id])
    #render json: JSON.pretty_generate(file_hash)
    @file = GFile.new(:id => params[:id], :title => file_hash['title'], :content=> file_hash['content'].force_encoding("UTF-8").unpack("C*").pack("U*") , :type => file_hash['mimeType'],:new_revision => false, :persisted => true)
  end
  
  def update
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    @file.save
    redirect_to edit_g_file_path params[:id]
    #render json: params
  end

end
