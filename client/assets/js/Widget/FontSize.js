Class("FontSizeWidget", ["Model"]);

FontSizeWidget.prototype.init = function(options){
  var self = this;
  Model.call(this, options);
  if(!options) return;

  self.editor_controller = options["editor_controller"];
  if(!self.editor_controller) {
    throw("Missing editor controller for "+self.constructor.name);
  }
  
  self.widget_class = options["widget_class"];
  if(!self.widget_class) {
    throw("There is no widget class for "+self.constructor.name);
  }

  self.preference = StringPreference.find('ace_js_font_size');

  switch(self.widget().prop("tagName")) {
    case "INPUT":
      console.log("working on input")
      break;
    case "SELECT":
      console.log("working on select");

      $('select').on('change.'+self.constructor.name, function() {
        if($(this).hasClass(self.widget_class)){
          self.handleChange(this.value);
        }
      });
      break;
  }
  self.refreshFromPreference();
}

FontSizeWidget.prototype.prefValToWidgetVal = function(val) {
  return val;
}

FontSizeWidget.prototype.widgetValToPrefVal = function(val) {
  return val;
}

FontSizeWidget.prototype.widget = function() {
  var self = this;
  return $('.'+self.widget_class);
}

FontSizeWidget.prototype.refreshFromPreference = function() {
  var self = this;
  self.widget().val(self.prefValToWidgetVal(self.preference.getValue()));
  self.editor_controller.editor_view.setFontSize(self.preference.getValue());
}

FontSizeWidget.prototype.handleChange = function(value) {
  var self = this;

  self.widget().prop('disabled', true);

  value = self.widgetValToPrefVal(value);

  self.preference.refreshAndSet(value, self.editor_controller, function(){self.editor_controller.show_reauth()}).then(function() {
    self.refreshFromPreference();
    self.widget().prop('disabled', false);
  });
}
