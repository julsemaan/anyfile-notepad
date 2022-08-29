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
    var folder_element = $("<li class='directory collapsed'><a href='#' rel='"+provider+"/"+folder.id+"/'>"+sanitize(folder.title)+"</a></li>")      ;
    container.append(folder_element);
  }

  for(var i in files){
    var file = files[i];
    var file_element = $("<li></li>");
    var file_link = $("<a href='#edit/"+provider+"/"+file.id+"'>"+sanitize(file.title)+"</a>");
    file_element.addClass("file ext_"+CloudFile.file_extension(file.title).substr(1))
    file_element.append(file_link);
    file_link.attr('onclick', "javascript:application.controllers.editor.top_menu.menu.hide_menu();window.location='#edit/"+provider+"/"+file.id+"'")
    container.append(file_element);
  }
  return container;
}

FileExplorerController.prototype.fetch_dropbox_directory = function(options, callback){
  var self = this;

  var r = new DropboxRequest({
    auth_handler:application.controllers.dropbox_oauth,
    client:application.controllers.dropbox_oauth.client,
    //NOTE: This request may ask us to continue reading directories if it hasn't sent them all.
    //      This feature is unimplemented and should be implemented only if necessary. Not sure we'll really want to render so many directories and files in a simple explorer
    request : application.controllers.dropbox_oauth.client.filesListFolder({path:options['dir']}),
    success : function(response){
      console.log("doing dir callback", response)
      var folders = [];
      var files = [];
      for(var i in response.entries){
        var element = response.entries[i];
        if(element['.tag'] == "folder"){
          folders.push({id:element['path_display'], title:element['name']});
        }
        else {
          files.push({id:element['path_display'].substr(1), title:element['name']});
        }
      }
      var container = self.render_directory("Dropbox", folders, files);
      callback(container);
    },
  })
  r.perform();
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
  application.controllers.google_oauth.execute_request(request, function(response){
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
      var folder_element = $("<li class='provider directory collapsed'><a class='provider-btn' href='#' rel='"+provider+"/"+info.root+"'><img src='"+provider+".png'></a></li>");
      container.append(folder_element);
    }
    callback(container);
  }
  else {
    var parts = options['dir'].split("/");
    if(parts[0] == "GoogleDrive"){
      var picker = new google.picker.PickerBuilder()
            .addView(google.picker.ViewId.DOCS)
            .setOAuthToken(gapi.client.getToken()["access_token"])
            .setAppId(AFN_VARS['google_client_id'])
            .setDeveloperKey(AFN_VARS['google_picker_api_key'])
            .setCallback(function(response){
              if(response.action == "picked") {
                window.location.href = "#edit/GoogleDrive/"+response.docs[0].id
              }
            })
            .build();
      picker.setVisible(true);
      application.controllers.editor.top_menu.menu.hide_menu();
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
