function ApplicationController() {
  this.dev_mode_name = "dev";
  this.dev_mode = (getCookie("AFNVersion") == this.dev_mode_name); 
  this.tour_controller = new TourController({});
  this.is_mobile();
  StatIncrement.record("app-load");
  if(this.is_mobile()) {
    StatIncrement.record("mobile-device");
  }
  if(this.dev_mode) {
    StatIncrement.record("dev-mode");
  }

  this.controllers = {};
}

ApplicationController.prototype.startLoading = function() {
  $("#app_load_modal").modal({'show':true,backdrop: true,backdrop: 'static', keyboard:false});
  $('.modal-backdrop.fade.in').css('opacity', '1.0')
}

ApplicationController.prototype.try_dev_mode = function(){
  StatIncrement.record("try-dev-mode");
  this.set_mode_and_reload(this.dev_mode_name);
}

ApplicationController.prototype.stop_dev_mode = function(){
  StatIncrement.record("stop-dev-mode");
  this.set_mode_and_reload("");
}


ApplicationController.prototype.setupDevModeFlash = function() {
  var self = this;
  if(self.dev_mode){
    self.controllers.editor.flash.sticky_warning("<a href='javascript:void(0)' onclick='javascript:application.stop_dev_mode()'>You are using the BETA version of the app. Bugs may occur. Click here to go back to the stable version</a>");
    self.controllers.editor.flash.sticky_success("<a target='_blank' href='http://bit.ly/afn-community'>Found a bug in the BETA version ?<br/>Click here to report it on the community</a>");
  }
  else {
    AppSetting.find("beta-available").then(function(setting) {
      if(setting["value"] == "true") {
        self.controllers.editor.flash.sticky_success("<a href='javascript:void(0)' onclick='javascript:application.try_dev_mode()'>Click here to try out the BETA version!</a>");
      }
    }, function(error) {
      console.log("Cannot find beta-available variable to display BETA access.", error)
    });
  }
}

ApplicationController.prototype.setupLocaleFlash = function() {
  var self = this;
  if(!String.locale.match('^en')){
    editor_controller.flash.sticky_success("<a target='_blank' href='http://bit.ly/afn-community'>You are using a translated version of the app. Report bad translations by clicking here</a>");
  }
} 

ApplicationController.prototype.is_mobile = function() {
  this._is_mobile = $('#editor_menu .navbar-toggle').is(":visible");
}

ApplicationController.prototype.set_mode_and_reload = function(mode, destination){
  new Popup({ message : "This action requires to restart the app. Proceed ?", confirm: true, callback: function(result){
    if(result) { 
      setCookie("AFNVersion", mode);
      if(destination){
        window.location = destination;
      }
      else {
        window.location.reload();
      }
    }
  }});
}
