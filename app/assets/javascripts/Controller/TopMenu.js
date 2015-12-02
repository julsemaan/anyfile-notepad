function TopMenuController(view, options){
  this.$ = $('#'+view);
  this.flash = options['flash'];
  this.editor = options['editor'];
}

TopMenuController.prototype.toggle_mobile_menu = function(){
  var self = this;
  if(self.full_menu_displayed){
    self.$.find('.extended_menu').slideUp(function(){
      // ensure editor is properly placed in case window was resized with menu opened
      self.editor.$editor.css('top', self.$.height() + "px");
      self.flash.view.fadeIn();
    });
  }
  else {
    self.flash.view.hide(function(){
      self.$.find('.extended_menu').slideDown();
    });
  }
  self.full_menu_displayed = !self.full_menu_displayed;

} 
