function FileExplorerController(view, options){
  var self = this;
  this.parent = options["parent"]
  this.opened = false;
  this.loaded = false;
  this.reload_url = window.location.href;
  this.$ = $("#"+view)
  this.current_height;

  this.flash = options["flash"]
  
}

FileExplorerController.prototype.fetch_directory = function(options, callback){
  var self = this;
  var provider = "GoogleDrive";
  var directory_id = options['dir']
  directory_id = directory_id.replace('/', '')
  var request = gapi.client.drive.files.list({
    'q': "'"+directory_id+"' in parents and trashed=false",
    'fields' : 'items(id,mimeType,title)',
  });
  request.execute(function(response){
    var folders = []
    var files = []
    for(var i in response.items){
      var item = response.items[i]
      if(item.mimeType == "application/vnd.google-apps.folder"){
        folders.push(item)
      }
      else{
        files.push(item)
      } 
    }

    var container = $("<ul class='jqueryFileTree' style='display: none;'></ul>")
    for(var i in folders){
      var folder = folders[i];
      var folder_element = $("<li class='directory collapsed'><a href='#' rel='"+folder.id+"/'>"+folder.title+"</a></li>")      ;
      container.append(folder_element);
    }

    for(var i in files){
      var file = files[i];
      var file_element = $("<li></li>");
      var file_link = $("<a href='#edit/"+provider+"/"+file.id+"'>"+file.title+"</a>");
      file_element.addClass("file ext_"+CloudFile.file_extension(file.title).substr(1))
      file_element.append(file_link);
      file_link.attr('onclick', "javascript:menu_controller.hide_menu();window.location='#edit/"+provider+"/"+file.id+"'")
      container.append(file_element);
    }

    callback(container)

  })

}

FileExplorerController.prototype.load = function(){
  var self = this;
  this.$.find('#fileTree').fileTree({ root: 'root', script: self.fetch_directory});
  this.loaded = true
}
