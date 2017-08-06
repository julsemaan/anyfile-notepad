Class("PreferenceWidget", ["Model"]);

PreferenceWidget.prototype.post_init = function(options){
  var self = this;

  self.widgetName = self.constructor.name;

  self.initCache();
  
  self.bindEvents();
  
  self.initChild();

  self.refreshFromPreference();
}

PreferenceWidget.prototype.initCache = function() {
  var self = this;
  if(!$.preferenceWidgets) $.preferenceWidgets = {};
  if(!$.preferenceWidgets[self.widgetName]) $.preferenceWidgets[self.widgetName] = {};
}

// Used to execute a method once for all the widgets sharing the same preference class
PreferenceWidget.prototype.doOnce = function(key, f) {
  var self = this;
  if(!$.preferenceWidgets[self.widgetName][key]) {
    f();
    $.preferenceWidgets[self.widgetName][key] = true;
  }
}

PreferenceWidget.prototype.bindEvents = function() {
  var self = this;
  switch(self.widget().prop("tagName")) {
    case "INPUT":
      switch(self.widget().attr('type')) {
        case "text":
          self.inputType = "text";
          throw "Input text not implemented...";
          break;
        case "checkbox":
          self.inputType = "checkbox";
          self.doOnce('eventBind', function() {
            self.widget().one('change.'+self.widgetName, function(){
              self.handleChange($(this).prop('checked'))
            });
          });
          break;
      }
      break;
    case "SELECT":
      self.inputType = "select";
      self.doOnce('eventBind', function() {
        $('select').one('change.'+self.widgetName, function() {
          if($(this).attr('data-pref-widget') == self.widgetName){
            self.handleChange(this.value);
          }
        });
      });
      break;
    case "UL":
    case "DIV":
      self.inputType = "links";
      self.doOnce('eventBind', function() {
        self.widget().find('[data-val]').one('click.'+self.widgetName, function() {
          self.handleChange($(this).attr('data-val'));
        });
      });
      break;
    default:
      throw "bindEvents not implemented for type: "+self.widget().prop("tagName");
  }
}

PreferenceWidget.prototype.unbindEvents = function() {
  var self = this;
  switch(self.widget().prop("tagName")) {
    case "INPUT":
      switch(self.widget().attr('type')) {
        case "text":
          self.inputType = "text";
          throw "Input text not implemented...";
          break;
        case "checkbox":
          self.inputType = "checkbox";
          self.widget().off('change');
          break;
      }
      break;
    case "SELECT":
      $('select').off('change.'+self.widgetName);
      break;
    case "UL":
    case "DIV":
      self.widget().find('[data-val]').off('click.'+self.widgetName);
      break;
    default:
      throw "unbindEvents not implemented for type: "+self.widget().prop("tagName");
  }
  $.preferenceWidgets[self.widgetName]['eventBind'] = false
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
  return $("[data-pref-widget='"+self.widgetName+"']");
}

PreferenceWidget.prototype.getReadPreference = function() {
  var self = this;
  return self.preference();
}

PreferenceWidget.prototype.refreshFromPreference = function() {
  var self = this;
  var preference = self.getReadPreference();
  switch(self.inputType) {
    case "checkbox":
      self.widget().prop('checked', preference.getValue());
      break;
    case "links":
      self.widget().find('[data-val]').removeClass('btn-primary');
      self.widget().find('[data-val="'+preference.getValue()+'"]').addClass('btn-primary');
      break;
    default:
      self.widget().val(preference.getValue());
      break;
  }
  self.refreshFromPreferenceChild();
}

//Should be implemented in subclasses
PreferenceWidget.prototype.refreshFromPreferenceChild = function() {}

PreferenceWidget.prototype.disable = function() {
  var self = this;
  self.unbindEvents();
  switch(self.inputType) {
    case "links":
      self.widget().find('[data-val]').addClass('disabled');
    default:
      self.widget().prop('disabled', true);
  }
}

PreferenceWidget.prototype.enable = function() {
  var self = this;
  self.bindEvents();
  switch(self.inputType) {
    case "links":
      self.widget().find('[data-val]').removeClass('disabled');
    default:
      self.widget().prop('disabled', false);
  }
}

PreferenceWidget.prototype.handleChange = function(value) {
  var self = this;

  self.disable();
  $(document).trigger('preference-change-in-progress');

  value = self.widgetValToPrefVal(value);

  self.preference().refreshAndSet(value, application.controllers.editor, function(){application.controllers.editor.show_reauth()}).then(function() {
    self.refreshFromPreference();
    self.enable();
    $(document).trigger('preference-change-done');
  });
}

