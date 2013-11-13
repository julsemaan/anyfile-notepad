class EditorController < GOauthController
  require 'json'
  
  def get_file_flow
    begin
      file_hash = @gapi.get_file_data(params[:id])
      content = file_hash['content']
    rescue NoMethodError
      redirect_to new_g_file_path
      flash[:error]= "Document content was not downloaded. Google docs are not currently supported."
      return
    rescue Exceptions::FileTooBigError
      redirect_to new_g_file_path
      flash[:error]= "Document content was not downloaded. Files larger then 1M are not supported."
      return
    rescue Google::APIClient::ClientError
      flash[:error] = "Couldn't get file. Are you sure it exists ?"
      redirect_to new_g_file_path
      return
    rescue Google::APIClient::ServerError
      flash[:error] = "A fatal error occured when communicating with Google's servers. We tried our best to recover it."
      redirect_to :back
    end
    
    begin
      content.encode("UTF-8")
    rescue
      content = content.force_encoding("UTF-8").unpack("C*").pack("U*")
      flash.now[:warn] = "Content encoding has been changed by force. This could corrupt your file. Think about it before saving."
    end
    
    @file = GFile.new(:id => params[:id], :title => file_hash['title'], :content=> content , :type => file_hash['mimeType'],:new_revision => false, :persisted => true,)
    
    syntax_mode = @preferences.get_preference('syntaxes')[@file.extension]
    if not syntax_mode.nil?
      @file.syntax = Syntax.find_by_ace_js_mode(syntax_mode)
    end

    
    @title = @file.title
    
    MimeType.add_if_not_known file_hash['mimeType'], @user.name
  end
  
  def new
    @title = "New file"
    if params[:folder_id]
      @file = GFile.new(:type => 'text/plain', :persisted => false, :folder_id => params[:folder_id])
    else
      @file = GFile.new(:type => 'text/plain', :persisted => false, :folder_id => 'root')
    end
  end
  
  def create
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    success = @file.create
    #render text: @file.id
    if success
      flash[:notice] = "Your file has been created."
      redirect_to edit_g_file_path @file.id
    else
      render 'new'
    end
  end
  
  def show
    get_file_flow
  end
  
	def edit
    get_file_flow
  end
  
  def update
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    @title = @file.title
    
    success = @file.save
    if success
      flash[:notice] = "Your file has been saved."
      redirect_to edit_g_file_path params[:id]
    else
      render 'edit'
    end
    #render json: params
  end

end
