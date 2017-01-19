Class("UserWidget", ["Model"]);

UserWidget.prototype.init = function(args) {
  var self = this;

  var selector = args["selector"];
  if(!selector) throw("Missing selector for the UserWidget");

  $(selector).on({
    mouseenter: self.userHoverIn,
    mouseleave: self.userHoverOut,
  });

}

UserWidget.prototype.userHoverIn = function(){
  //$(this).find("#user_details").show();
  var orig = $.data(this, 'dimensions');
  if(!orig) $.data(this, 'dimensions', { width: $(this).outerWidth(), height: $(this).outerHeight() });
  // clear the other things to do and open it
  $("#current_user").stop()
  $("#current_user").animate({width:"500px"}, function(){
  $("#user_details").show()
  $("#current_user").animateAuto('width')
});
}

UserWidget.prototype.userHoverOut = function(){
  //$(this).find("#user_details").hide();
  var orig = $.data(this, 'dimensions')
  $("#current_user").stop()
  $("#user_details").hide()
  $("#current_user").animate({width:orig.width+"px", height:orig.height+"px"});
}

