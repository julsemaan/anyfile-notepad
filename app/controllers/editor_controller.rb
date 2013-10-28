class EditorController < GOauthController
  require 'json'
  
  before_filter :init_file_explorer
  before_filter :check_preferences
  
  def init_file_explorer
    @dir = Jqueryfiletree.new('root', @gapi).get_content
  end
  
  def check_preferences
    if params[:prefers_minimized]
      session[:prefers_minimized] = params[:prefers_minimized]
    end
  end
  
  def set_syntax
    syntax_id = Syntax.find_by_ace_js_mode(params[:ace_syntax]).id
    file_id = params[:id]
    file_hash = @gapi.get_file_data(file_id)
    file_ext = GFile.new(:title => file_hash['title']).extension
    begin
      session[:syntaxes][file_ext] = syntax_id
    rescue
      session[:syntaxes] = {}
      session[:syntaxes][file_ext] = syntax_id
    end
    
    render text: "#{file_ext} : #{session[:syntaxes][file_id]}"
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
      redirect_to edit_g_file_path @file.id
    else
      render 'new'
    end
  end
  
	def edit
    begin
      file_hash = @gapi.get_file_data(params[:id])
      content = file_hash['content']
    rescue NoMethodError
      redirect_to new_g_file_path
      flash[:error]= "Document content was not downloaded. Files larger then 5M are not supported. Also note that Google docs are not currently supported."
      return
    rescue Google::APIClient::ClientError
      @file = GFile.new
      flash[:error] = "Couldn't get file. Are you sure it exists ?"
      redirect_to new_g_file_path
      return
    end
    
    begin
      content.encode("UTF-8")
    rescue
      content = content.force_encoding("UTF-8").unpack("C*").pack("U*")
      flash.now[:warn] = "Content encoding has been changed by force. This could corrupt your file. Think about it before saving."
    end
    
    @file = GFile.new(:id => params[:id], :title => file_hash['title'], :content=> content , :type => file_hash['mimeType'],:new_revision => false, :persisted => true,)
    begin
      syntax_id = session[:syntaxes][@file.extension]
      @file.syntax = Syntax.find(syntax_id)
    rescue
    end
    
    @title = @file.title
    
    MimeType.add_if_not_known file_hash['mimeType']
  end
  
  def update
    params[:g_file][:gapi] = @gapi
    @file = GFile.new(params[:g_file])
    @title = @file.title
    
    begin
      success = @file.save
    rescue Google::APIClient::ClientError
      @file.errors.add(:base, "An error occurred with Google Drive while saving the file.")
    end
    if success
      redirect_to edit_g_file_path params[:id]
    else
      render 'edit'
    end
    #render json: params
  end

end
