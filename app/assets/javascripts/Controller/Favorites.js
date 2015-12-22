Class("FavoritesController", ["Model"]);

FavoritesController.prototype.init = function(args){
  var self = this;
  Model.call(this,args);
  self.refresh();
}

FavoritesController.prototype.add_favorite = function(file_id) {
  var self = this;
  for(var i in self.favorites_pref.array){
    if(self.favorites_pref.array[i].file_id == file_id){
      alert("A favorite with the same file ID already exists ("+self.favorites_pref.array[i].alias+")");
      return;
    }
  }
  var alias = prompt("Enter an alias for this favorite");
  if(alias.length){
    for(var i in self.favorites_pref.array){
      if(self.favorites_pref.array[i].alias == alias){
        alert("A favorite with this name already exists.");
        return;
      }
    }
    self.favorites_pref.array.push({ file_id:file_id, alias:alias });
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

FavoritesController.prototype.refresh = function(){
  var self = this;
  if($("ul.favorites")){
    $("ul.favorites").empty();
    
    var add_favorite = $('<li><a href="javascript:void(0)">Favorite this file</a></li>');
    add_favorite.click(function(e){
      e.preventDefault();
      self.add_favorite(self.parent.file.id);
    })
    $("ul.favorites").append(add_favorite);
    
    $.each(self.favorites_pref.array, function(i){
      var element = self.favorites_pref.array[i];
      var delete_button = $('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
      delete_button.click(function(e){
        e.preventDefault();
        self.remove_favorite(element.alias);
      });
      var link = $('<a href="#edit/'+element.file_id+'">'+element.alias+'</a>');
      var li = $('<li></li>');
      li.append(link);
      link.append(delete_button);
      $("ul.favorites").append(li);
    });
  }
}
