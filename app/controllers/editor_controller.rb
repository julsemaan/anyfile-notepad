class EditorController < ApplicationController
  require 'json'
  
  before_filter :init_file_explorer
  
  def init_file_explorer
    @dir = Jqueryfiletree.new('root', @gapi).get_content
  end
  
  
  def new
    @file = GFile.new(:type => 'text/plain', :persisted => false, :folder_id => params[:folder_id])
  end
  
  def create
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    success = @file.create
    #render text: @file.id
    if success
      redirect_to edit_g_file_path @file.id
    else
      render 'new'
    end
  end
  
	def edit
    begin
      file_hash = @gapi.get_file_data(params[:id])
      @file = GFile.new(:id => params[:id], :title => file_hash['title'], :content=> file_hash['content'] , :type => file_hash['mimeType'],:new_revision => false, :persisted => true)
    rescue NoMethodError
      @file = GFile.new
      @file.errors.add(:base, "Document content was not downloaded. Note that Google docs are not currently supported.")
    end
    #render json: JSON.pretty_generate(file_hash)
    # .force_encoding("UTF-8").unpack("C*").pack("U*")
  end
  
  def update
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    success = @file.save
    if success
      redirect_to edit_g_file_path params[:id]
    else
      render 'edit'
    end
    #render json: params
  end

end
