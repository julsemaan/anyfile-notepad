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
}

ApplicationController.prototype.try_dev_mode = function(){
  StatIncrement.record("try-dev-mode");
  this.set_mode_and_reload(this.dev_mode_name);
}

ApplicationController.prototype.stop_dev_mode = function(){
  StatIncrement.record("stop-dev-mode");
  this.set_mode_and_reload("");
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
