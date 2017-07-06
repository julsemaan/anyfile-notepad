Class("RecentFilesController", ["Model"]);

RecentFilesController.prototype.init = function(args){
  var self = this;
  Model.call(this,args);
  self.max_size = self.max_size || 5;
  self.render();
}

RecentFilesController.prototype.add_file = function(file) {
  var self = this;
  var provider = file.provider;
  var alias = file.title;
  var file_id = file.id;
  for(var i in self.preference.array){
    if(self.preference.array[i].file_id == file_id){
      self.preference.array.splice(i,1)
    }
  }
  self.preference.array.unshift({ file_id:file_id, alias:alias, provider: provider });
  self.preference.array = self.preference.array.splice(0, self.max_size)
  self.preference.commit(self.parent, self.parent.show_reauth);
  self.render();
}

RecentFilesController.prototype.render = function(){
  var self = this;
  if(self.view){
    self.view.empty();
    self.view.append($('<li>'+i18n("Recent files")+'</li>'));
    $.each(self.preference.array, function(i){
      var element = self.preference.array[i];
      var provider = element.provider || DEFAULT_PROVIDER;
      var link = $('<a href="#edit/'+provider+"/"+element.file_id+'">'+element.alias+" ("+element.provider+")"+'</a>');
      link.click(function(){
        application.controllers.editor.top_menu.menu.hide_menu();
      });
      var li = $('<li></li>');
      li.append(link);
      self.view.append(li);
    });
  }
}
