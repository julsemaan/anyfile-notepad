class SiteContentController < AdminController
  def edit
    @site_content = SiteContent.find_by_key(params[:id])
  end
  
  def update
    @site_content = SiteContent.find_by_key(params[:id])
    if @site_content.update_attributes(params[:site_content])
      redirect_to edit_site_content_path(@site_content), :notice => "Saved"
    else
      
    end
  end
end