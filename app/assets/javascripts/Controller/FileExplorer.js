function FileExplorerController(view, options){
  var self = this;
  this.parent = options["parent"]
  this.opened = false;
  this.loaded = false;
  this.cached = options["cached"];
  this.reload_url = window.location.href;
  this.$ = $("#"+view)
  
  this.watch_tree_job = setInterval(function(){self.watch_tree()},1000)

  if(this.cached){
    this.open_from_cache()
  }
  else{
    this.create_dropdown()
  }
  
  this.initialize_html();
}

FileExplorerController.prototype.create_dropdown = function() {
  var self = this;

  $(document).ready(function(){
    self.$.find('#file_tree_panel').hide()
    self.$.find('#open_file_explorer').show()
    self.$.find('#open_file_explorer').show()
    self.$.find('#open_file_explorer_title').css('cursor', 'pointer')
  })

  self.$.find('#open_file_explorer_title').click( function() {
    if(!self.opened){
      self.open()
    }
    else{
      self.$.find('#file_tree_panel').slideUp()
      self.$.find('#open_file_explorer').attr("class", "glyphicon glyphicon-chevron-down")
      self.opened = false
    }
  });

}

FileExplorerController.prototype.initialize_html = function(){
  var self = this;
  this.$.find('#reauth_file_tree').attr('href', this.reload_url)
}

FileExplorerController.prototype.watch_tree = function(){
  var self = this;
  if( this.$.find('#fileTree').html() == "" ) {

  }
  else{
    this.$.find('#file_tree_loading_message').fadeOut()
    clearInterval(self.watch_tree_job);
  }  
}

FileExplorerController.prototype.show_loading = function(){
  var self = this;
  this.$.find('#file_explorer_progress_modal').modal('show')  
}

FileExplorerController.prototype.show_error = function(){
  var self = this;
  if( this.$.find('#fileTree').html() == "" ) {
    this.$.find('#loading_error').show()
  }
}

FileExplorerController.prototype.open = function(){
  var self = this;
  this.$.find('#open_file_explorer').attr("class", "glyphicon glyphicon-chevron-up")
  this.$.find('#file_tree_panel').slideDown()
  if(!this.loaded){
    this.load()
  }
  this.opened = true
  if(this.parent != null){
    this.parent.maximize_menu(false)
  }
}

FileExplorerController.prototype.load = function(){
  var self = this;
  this.$.find('#file_tree_loading_message').fadeIn()
  this.$.find('#fileTree').fileTree({ root: 'root', script: '/jqueryfiletree/content'});
  setTimeout(function(){self.show_error()}, 10000)
  this.loaded = true
}

FileExplorerController.prototype.cache = function(){
  var self = this;
  if(typeof(Storage)!=="undefined"){
    localStorage.setItem('cached_explorer', this.$.find('#fileTree').html())
    this.cached = true;
    return true;
  }
  else{
    alert("localStorage is not supported in this browser. This functionnality cannot work.")
    return false;
  }
}

FileExplorerController.prototype.load_from_cache = function(){
  var self = this;
  var cached_data = localStorage.getItem('cached_explorer')
  if(cached_data != ""){
    this.cached = true;
    this.$.find('#fileTree').html(cached_data)
    this.$.find('#fileTree').fileTree({ root: 'root', script: '/jqueryfiletree/content', existing: true});
    this.$.find('#refresh_file_explorer').show()
    this.$.find('#refresh_file_explorer').click(function(){self.refresh()})
  }
  else{
    this.load()
  }
  this.loaded = true
}

FileExplorerController.prototype.refresh = function(){
  var self = this;
  setInterval(function(){self.watch_tree()},1000)
  this.load()
}

FileExplorerController.prototype.open_from_cache = function(){
  var self = this;
  this.load_from_cache()
  this.open()
  setInterval(function(){self.cache()}, 1000)
}
