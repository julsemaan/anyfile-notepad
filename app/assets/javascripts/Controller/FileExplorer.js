function FileExplorerController(view, options){
  this.opened = false;
  this.loaded = false;
  this.reload_url = window.location.href;
  this.$ = $(view)
  
  this.watch_tree_job = setInterval(this.watch_tree,1000)
}

FileExplorerController.prototype.initialize_html = function(){
  this.$.find('#reauth_file_tree').attr('href', this.reload_url)
}

FileExplorerController.prototype.watch_tree = function(){
  if( this.$.find('#fileTree').html() == "" ) {

  }
  else{
    this.$.find('#file_tree_loading_message').fadeOut()
    clearInterval(this.watch_tree_job);
  }  
}

FileExplorerController.prototype.show_loading = function(){
  this.$.find('#file_explorer_progress_modal').modal('show')  
}

FileExplorerController.prototype.show_error = function(){
  if( this.$.find('#fileTree').html() == "" ) {
    this.$.find('#loading_error').show()
  }
}

FileExplorerController.prototype.open = function(){
  this.$.find('#open_file_explorer').attr("class", "glyphicon glyphicon-chevron-up")
  this.$.find('#file_tree_panel').slideDown()
  if(!this.loaded){
    this.load_explorer()
  }
  this.opened = true
}

FileExplorerController.prototype.load = function(){
  this.$.find('#file_tree_loading_message').fadeIn()
  this.$.find('#fileTree').fileTree({ root: 'root', script: '/jqueryfiletree/content'});
  setTimeout(this.show_error, 10000)
  this.loaded = true
}

FileExplorerController.prototype.cache = function(){
  if(typeof(Storage)!=="undefined"){
    localStorage.setItem('cached_explorer', this.$.find('#fileTree').html())
    return true;
  }
  else{
    alert("localStorage is not supported in this browser. This functionnality cannot work.")
    return false;
  }
}

FileExplorerController.prototype.load_from_cache = function(){
  var cached = localStorage.getItem('cached_explorer')
  if(this.cached != ""){
    this.$.find('#fileTree').html(cached)
    this.$.find('#fileTree').fileTree({ root: 'root', script: '/jqueryfiletree/content', existing: true});
    this.$.find('#refresh_file_explorer').show()
    this.$.find('#refresh_file_explorer').click(this.refresh)
  }
  else{
    this.load_explorer()
  }
  this.loaded = true
}

FileExplorerController.prototype.refresh = function(){
  this.setInterval(this.watch_tree,1000)
  this.load_explorer()
}
