class MimeTypesController < AdminController
  
  
  # GET /mime_types
  # GET /mime_types.json
  def index
    @title = "Mimetypes"
    @integrated_mime_types = MimeType.find_all_by_integrated(true)
    @not_integrated_mime_types = MimeType.find_all_by_integrated(false)
    
    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: MimeType.all }
    end
  end

  # GET /mime_types/1
  # GET /mime_types/1.json
  def show 
    @mime_type = MimeType.find(params[:id])
    @title = @mime_type.type_name

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @mime_type }
    end
  end

  # GET /mime_types/new
  # GET /mime_types/new.json
  def new
    @title = "New Mimetype"
    @mime_type = MimeType.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @mime_type }
    end
  end

  # GET /mime_types/1/edit
  def edit
    @mime_type = MimeType.find(params[:id])
    @title = "Edit #{@mime_type.type_name}"
  end

  # POST /mime_types
  # POST /mime_types.json
  def create
    @mime_type = MimeType.new(params[:mime_type])

    respond_to do |format|
      if @mime_type.save
        format.html { redirect_to new_mime_type_path, notice: 'Mime type was successfully created.' }
        format.json { render json: @mime_type, status: :created, location: @mime_type }
      else
        format.html { render action: "new" }
        format.json { render json: @mime_type.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /mime_types/1
  # PUT /mime_types/1.json
  def update
    @mime_type = MimeType.find(params[:id])

    respond_to do |format|
      if @mime_type.update_attributes(params[:mime_type])
        format.html { redirect_to mime_types_path, notice: 'Mime type was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @mime_type.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /mime_types/1
  # DELETE /mime_types/1.json
  def destroy
    @mime_type = MimeType.find(params[:id])
    @mime_type.destroy

    respond_to do |format|
      format.html { redirect_to mime_types_url }
      format.json { head :no_content }
    end
  end
  
  def mark_integrated
    @mime_type = MimeType.find(params[:id])
    @mime_type.integrated = true
    @mime_type.save
    
    redirect_to mime_types_url
  end
end
