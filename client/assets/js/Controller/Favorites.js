Class("FavoritesController", ["Model"]);

FavoritesController.prototype.init = function(args){
  var self = this;
  Model.call(this,args);
  self.refresh();
}

FavoritesController.prototype.add_favorite = function(provider, file_id) {
  var self = this;
  for(var i in self.favorites_pref.array){
    if(self.favorites_pref.array[i].file_id == file_id){
      new Popup({ message : i18n("A favorite with the same file ID already exists")+"("+self.favorites_pref.array[i].alias+")" });
      return;
    }
  }
  var alias = prompt(i18n("Enter an alias for this favorite"));
  if(alias.length){
    for(var i in self.favorites_pref.array){
      if(self.favorites_pref.array[i].alias == alias){
        new Popup({ message : i18n("A favorite with this name already exists.") });
        return;
      }
    }
    self.favorites_pref.array.push({ file_id:file_id, alias:alias, provider: provider });
    self.favorites_pref.array.sort(self.sort_favorites);
    self.favorites_pref.commit(self.parent, self.parent.show_reauth);
    self.refresh();
  }
}

FavoritesController.prototype.remove_favorite = function(alias){
  var self = this;
  for(var i in self.favorites_pref.array){
    if(self.favorites_pref.array[i].alias == alias){
      self.favorites_pref.array.splice(i,1);
      self.favorites_pref.commit(self.parent, self.parent.show_reauth);
      self.refresh();
      return true;
    }
  }
  return false;
}

FavoritesController.prototype.sort_favorites = function(a,b){
  var self = this;
  if(a.alias < b.alias) return -1;
  if(a.alias > b.alias) return 1;
  return 0;
}

FavoritesController.prototype.refresh = function(){
  var self = this;
  if(self.view){
    self.view.empty();
    
    self.view.append($('<li><h5 class="menu_header">'+i18n("Favorites")+'</h5></li>'));
    var add_favorite = $('<li><a href="javascript:void(0)">'+i18n("Favorite this file")+'</a></li>');
    add_favorite.click(function(e){
      e.preventDefault();
      application.controllers.editor.top_menu.menu.hide_menu();
      if(self.parent.file.id){
        self.add_favorite(self.parent.file.provider, self.parent.file.id);
      }
      else {
        new Popup({ message : i18n("Can't favorite file as it is not saved yet...") });
      }
    })
    self.view.append(add_favorite);

    self.view.append($("<hr>"));
    
    $.each(self.favorites_pref.array, function(i){
      var element = self.favorites_pref.array[i];
      var delete_button = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
      delete_button.click(function(e){
        e.preventDefault();
        self.remove_favorite(element.alias);
        application.controllers.editor.top_menu.menu.hide_menu();
        return false;
      });
      var provider = element.provider || DEFAULT_PROVIDER;
      var link = $('<a href="#edit/'+provider+"/"+element.file_id+'">'+element.alias+'</a>');
      link.click(function(){
        application.controllers.editor.top_menu.menu.hide_menu();
      });
      var li = $('<li></li>');
      li.append(link);
      link.append(delete_button);
      self.view.append(li);
    });
  }
}
