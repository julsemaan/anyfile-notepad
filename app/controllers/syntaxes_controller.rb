class SyntaxesController < AdminController
  # GET /syntaxes
  # GET /syntaxes.json
  def index
    @syntaxes = Syntax.all

    respond_to do |format|
      format.html # index.html.erb
      format.json { render json: @syntaxes }
    end
  end

  # GET /syntaxes/1
  # GET /syntaxes/1.json
  def show
    @syntax = Syntax.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.json { render json: @syntax }
    end
  end

  # GET /syntaxes/new
  # GET /syntaxes/new.json
  def new
    @syntax = Syntax.new

    respond_to do |format|
      format.html # new.html.erb
      format.json { render json: @syntax }
    end
  end

  # GET /syntaxes/1/edit
  def edit
    @syntax = Syntax.find(params[:id])
  end

  # POST /syntaxes
  # POST /syntaxes.json
  def create
    @syntax = Syntax.new(params[:syntax])

    respond_to do |format|
      if @syntax.save
        format.html { redirect_to new_syntaxis_path, notice: 'Syntax was successfully created.' }
        format.json { render json: @syntax, status: :created, location: @syntax }
      else
        format.html { render action: "new" }
        format.json { render json: @syntax.errors, status: :unprocessable_entity }
      end
    end
  end

  # PUT /syntaxes/1
  # PUT /syntaxes/1.json
  def update
    @syntax = Syntax.find(params[:id])

    respond_to do |format|
      if @syntax.update_attributes(params[:syntax])
        format.html { redirect_to syntaxes_path, notice: 'Syntax was successfully updated.' }
        format.json { head :no_content }
      else
        format.html { render action: "edit" }
        format.json { render json: @syntax.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /syntaxes/1
  # DELETE /syntaxes/1.json
  def destroy
    @syntax = Syntax.find(params[:id])
    @syntax.destroy

    respond_to do |format|
      format.html { redirect_to syntaxes_url }
      format.json { head :no_content }
    end
  end
end
