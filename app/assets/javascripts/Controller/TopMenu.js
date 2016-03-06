function TopMenuController(view, options){
  this.$ = $('#'+view);
  this.flash = options['flash'];
  this.editor = options['editor'];
}

TopMenuController.prototype.toggle_mobile_menu = function(){
  var self = this;
  if(self.full_menu_displayed){
    self.close_mobile_menu();
  }
  else {
    self.open_mobile_menu();
  }
  self.full_menu_displayed = !self.full_menu_displayed;

} 

TopMenuController.prototype.open_mobile_menu = function() {
  var self = this;
  self.$.find('.extended_menu').slideDown();
}

TopMenuController.prototype.close_mobile_menu = function() {
  var self = this;
  self.$.find('.extended_menu').slideUp(function(){
    // ensure editor is properly placed in case window was resized with menu opened
    self.editor.$editor.css('top', self.$.height() + "px");
  });
}
