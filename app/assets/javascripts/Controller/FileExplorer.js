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

FileExplorerController.prototype.render_directory = function(provider, folders, files){
  var self = this;
  var container = $("<ul class='jqueryFileTree' style='display: none;'></ul>")
  for(var i in folders){
    var folder = folders[i];
    var folder_element = $("<li class='directory collapsed'><a href='#' rel='"+provider+"/"+folder.id+"/'>"+folder.title+"</a></li>")      ;
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
  return container;
}

FileExplorerController.prototype.fetch_dropbox_directory = function(options, callback){
  var self = this;

  dropbox_oauth_controller.do_auth(function(){
    var r = new DropboxRequest({
      auth_handler:dropbox_oauth_controller,
      client:dropbox_oauth_controller.client,
      request : function(){
        var request = this;
        this.client.stat(options['dir'], {readDir:true}, function(e,r,ls){request.handle_response(e,r,ls)})
      },
      success : function(response, ls){
        var folders = [];
        var files = [];
        for(var i in ls){
          var element = ls[i];
          if(element.mimeType == "inode/directory"){
            folders.push({id:element.path.substring(1), title:element.name});
          }
          else {
            files.push({id:element.path.substring(1), title:element.name});
          }
        }
        console.log("doing dir callback")
        var container = self.render_directory("Dropbox", folders, files);
        callback(container);
      },
    })
    r.request();
  })
}

FileExplorerController.prototype.fetch_drive_directory = function(options, callback){
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

    var container = self.render_directory(provider, folders, files);
    callback(container)

  })

}

FileExplorerController.prototype.fetch_directory = function(options, callback){
  var self = this;
  console.log(options)

  if(options['dir'] == "AFN_ROOT"){

    var container = $("<ul class='jqueryFileTree' style='display: none;'></ul>");
    var providers = {
      "GoogleDrive" : { name: "Google Drive", root: "root" }, 
      "Dropbox": {name: "Dropbox", root: ""},
    };
    for(var provider in providers){
      var info = providers[provider];
      var folder_element = $("<li class='directory collapsed'><a href='#' rel='"+provider+"/"+info.root+"'>"+info.name+"</a></li>");
      container.append(folder_element);
    }
    callback(container);
  }
  else {
    var parts = options['dir'].split("/");
    if(parts[0] == "GoogleDrive"){
      parts.splice(0,1);
      options['dir'] = parts.join("/");
      self.fetch_drive_directory(options, callback)
    }
    else if(parts[0] == "Dropbox"){
      parts.splice(0,1);
      options['dir'] = parts.join("/");
      self.fetch_dropbox_directory(options, callback)
    }
  }
}

FileExplorerController.prototype.load = function(){
  var self = this;
  this.$.find('#fileTree').fileTree({ root: 'AFN_ROOT', script: function(options, callback){self.fetch_directory(options,callback)}});
  this.loaded = true
}
