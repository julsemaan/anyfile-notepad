class ExtensionsController < AdminController
  # GET /extensions
  # GET /extensions.json
  def index
    @title = "Extensions"
    @extensions = Extension.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @extensions }
    end
  end

  # GET /extensions/1
  # GET /extensions/1.json
  def show
    @extension = Extension.find(params[:id])
    @title = @extension.name
    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @extension }
    end
  end

  # GET /extensions/new
  # GET /extensions/new.json
  def new
    @title = "New extension"
    @extension = Extension.new
    
    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @extension }
    end
  end

  # GET /extensions/1/edit
  def edit
    @extension = Extension.find(params[:id])
    @title = "Edit #{@extension.name}"
  end

  # POST /extensions
  # POST /extensions.json
  def create
    @extension = Extension.new(params[:extension])
    
    respond_to do |format|
      if @extension.save
        format.html { redirect_to new_extension_path, notice: 'Extension was successfully created.' }
        format.json { render json: @extension, status: :created, location: @extension }
      else
        format.html { render action: "new" }
        format.json { render json: @extension.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /extensions/1
  # PUT /extensions/1.json
  def update
    @extension = Extension.find(params[:id])

    respond_to do |format|
      if @extension.update_attributes(params[:extension])
        format.html { redirect_to extensions_path, notice: 'Extension was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @extension.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /extensions/1
  # DELETE /extensions/1.json
  def destroy
    @extension = Extension.find(params[:id])
    @extension.destroy

    respond_to do |format|
      format.html { redirect_to extensions_url }
      format.json { head :no_content }
    end
  end
end
