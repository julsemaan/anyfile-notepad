Class("Popup", ["Model"]);

Popup.prototype.init = function(args) {
  Model.call(this, args);
  var self = this;
  if(args) {
    self.callback = self.callback || function(){};
    self.confirm = self.confirm || false;
    if(!self.message) throw "No message specified for popup";

    self.popup_id = uniqueId();
    self.cancel_id = uniqueId();
    self.confirm_id = uniqueId();

    var $source = $("#popup-template");
    var source = $source.html();
    var template = Handlebars.compile(source);
    $(template(self)).insertAfter($source);
    $("#"+self.popup_id).modal({'show':true, keyboard:false});

    var post_click = function(result) {
      $("#"+self.popup_id).modal('hide');
      self.callback(result);
    }

    $('#'+self.cancel_id).click(function() {post_click(false)});
    $('#'+self.confirm_id).click(function() {post_click(true)});
  }
}
