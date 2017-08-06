Class("Popup", ["Model"]);

Popup.c = 0;

Popup.prototype.post_init = function(args) {
  var self = this;
  if(args) {
    self.callback = self.callback || function(){};
    self.confirm = self.confirm || false;
    if(!self.message && !self.hb_partial) throw "No message or partial specified for popup";
    self.global_context = context;

    if(self.hb_partial) {
      var $hb_source = $(self.hb_partial);
      var source = $hb_source.html();
      var template = Handlebars.compile(source);
      self.content = template(self);
    }

    self.popup_id = uniqueId();
    self.cancel_id = uniqueId();
    self.confirm_id = uniqueId();

    self.confirm_btn = self.confirm_btn || i18n("OK");
    self.cancel_btn = self.cancel_btn || i18n("Cancel");

    var $source = $("#popup-template");
    var source = $source.html();
    var template = Handlebars.compile(source);
    $(template(self)).insertAfter($source);
    $("#"+self.popup_id).modal({'show':true, keyboard:false});

    // Adding to the z-index everytime so the new popup always comes in front of any existing one.
    $('#'+self.popup_id).css('z-index', $('#'+self.popup_id).css('z-index')+Popup.c);
    Popup.c += 1;

    var post_click = function(result) {
      $("#"+self.popup_id).modal('hide');
      self.callback(result);
    }

    $('#'+self.cancel_id).click(function() {post_click(false)});
    $('#'+self.confirm_id).click(function() {post_click(true)});
  }
}
