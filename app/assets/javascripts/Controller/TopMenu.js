function TopMenuController(view, options){
  var self = this;
  this.$ = $('#'+view);
  this.flash = options['flash'];
  this.editor = options['editor'];

  this.mobile_size = 768;

  $(window).resize(function(){
    if($(window).width() >= self.mobile_size) self.open_mobile_menu();
  });
}

TopMenuController.prototype.toggle_mobile_menu = function(){
  var self = this;
  if(this.$.find('.extended_menu').is(":visible")){
    self.close_mobile_menu();
  }
  else {
    self.open_mobile_menu();
  }
} 

TopMenuController.prototype.open_mobile_menu = function() {
  var self = this;
  self.$.find('.extended_menu').slideDown();
}

TopMenuController.prototype.close_mobile_menu = function() {
  var self = this;
  // This only applies to windows that match the mobile styling in CSS
  if($(window).width() < this.mobile_size){
    self.$.find('.extended_menu').slideUp(function(){
      // ensure editor is properly placed in case window was resized with menu opened
      self.editor.$editor.css('top', self.$.height() + "px");
    });
  }
}
