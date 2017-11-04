Class("UserWidget", ["Model"]);

UserWidget.prototype.post_init = function(args) {
  var self = this;

  var selector = args["selector"];
  if(!selector) throw("Missing selector for the UserWidget");

  self.view = $(selector);
  self.details = self.view.find('.details');

  self.view.on({
    mouseenter: function() {self.userHoverIn()},
    mouseleave: function() {self.userHoverOut()},
  });

}

UserWidget.prototype.userHoverIn = function(){
  var self = this;

  var orig = $.data(self.view, 'dimensions');
  if(!orig) $.data(self.view, 'dimensions', { width: self.view.outerWidth(), height: self.view.outerHeight() });
  // clear the other things to do and open it
  self.view.stop()
  self.view.animate({width:"500px"}, function(){
  self.details.show()
  self.view.animateAuto('width')
});
}

UserWidget.prototype.userHoverOut = function(){
  var self = this;

  var orig = $.data(self.view, 'dimensions')
  self.view.stop()
  self.details.hide()
  self.view.animate({width:orig.width+"px", height:orig.height+"px"});
}

