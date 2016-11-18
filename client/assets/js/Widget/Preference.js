Class("PreferenceWidget", ["Model"]);

PreferenceWidget.prototype.init = function(options){
  var self = this;
  Model.call(this, options);
  if(!options) return;

  self.editor_controller = options["editor_controller"];
  if(!self.editor_controller) {
    throw("Missing editor controller for "+self.constructor.name);
  }
  
  switch(self.widget().prop("tagName")) {
    case "INPUT":
      switch(self.widget().attr('type')) {
        case "text":
          self.inputType = "text";
					throw "Input text not implemented...";
          break;
        case "checkbox":
          self.inputType = "checkbox";
          self.widget().on('change', function(){
            self.handleChange($(this).prop('checked'))
          });
          break;
      }
      break;
    case "SELECT":
      self.inputType = "select";
      $('select').on('change.'+self.constructor.name, function() {
        if($(this).attr('data-pref-widget') == self.constructor.name){
          self.handleChange(this.value);
        }
      });
      break;
  }
  
  self.initChild();

  self.refreshFromPreference();
}

//Should be implemented in subclasses
PreferenceWidget.prototype.initChild = function() {}

//Should be implemented in subclasses
PreferenceWidget.prototype.preference = function() {}

PreferenceWidget.prototype.prefValToWidgetVal = function(val) {
  return val;
}

PreferenceWidget.prototype.widgetValToPrefVal = function(val) {
  return val;
}

PreferenceWidget.prototype.widget = function() {
  var self = this;
  return $("[data-pref-widget='"+self.constructor.name+"']");
}

PreferenceWidget.prototype.refreshFromPreference = function() {
  var self = this;
  switch(self.inputType) {
    case "checkbox":
      self.widget().prop('checked', self.preference().getValue());
      break;
    default:
      self.widget().val(self.prefValToWidgetVal(self.preference().getValue()));
      break;
  }
  self.refreshFromPreferenceChild();
}

//Should be implemented in subclasses
PreferenceWidget.prototype.refreshFromPreferenceChild = function() {}

PreferenceWidget.prototype.handleChange = function(value) {
  var self = this;

  self.widget().prop('disabled', true);

  value = self.widgetValToPrefVal(value);

  self.preference().refreshAndSet(value, self.editor_controller, function(){self.editor_controller.show_reauth()}).then(function() {
    self.refreshFromPreference();
    self.widget().prop('disabled', false);
  });
}

