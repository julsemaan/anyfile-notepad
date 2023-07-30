function ApplicationController() {
  this.dev_mode_name = "dev";
  this.dev_mode = (getCookie("AFNVersion") == this.dev_mode_name); 
  this.dev_mode_available = false;
  this.tour_controller = new TourController({});
  this.is_mobile();
  StatIncrement.record("app-load");
  if(this.is_mobile()) {
    StatIncrement.record("mobile-device");
  }
  else {
    this.display_desktop_ads();
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

ApplicationController.prototype.try_dev_mode = function(force){
  var stat = force ? "try-dev-mode" : "try-dev-mode-forced";
  StatIncrement.record(stat);
  this.set_mode_and_reload(this.dev_mode_name, force);
}

ApplicationController.prototype.stop_dev_mode = function(force){
  var stat = force ? "stop-dev-mode" : "stop-dev-mode-forced";
  StatIncrement.record(stat);
  this.set_mode_and_reload("", force);
}


ApplicationController.prototype.setupDevMode = function() {
  var self = this;
  AppSetting.find("beta-available").then(function(setting) {
    self.dev_mode_available = (setting["value"] == "true");
    self.actOnDevModeSettings();
  }, function(error) {
    console.error("Cannot find beta-available variable to display BETA access.", error);
    //Assume its available if we can't reach the API
    self.dev_mode_available = true;
    self.actOnDevModeSettings();
  });
}

ApplicationController.prototype.actOnDevModeSettings = function() {
  var self = this;
  if(self.dev_mode){
    if(self.dev_mode_available) {
      var msg = "<a href='javascript:void(0)' onclick='javascript:application.stop_dev_mode()'>You are using the BETA version of the app. Bugs may occur. Click here to go back to the stable version</a>"
      self.controllers.editor.flash.sticky_warning(msg, {msg_uid:msg+self.build_id});
      self.controllers.editor.flash.sticky_success("<a target='_blank' href='https://github.com/julsemaan/anyfile-notepad/issues'>Found a bug in the BETA version ?<br/>Click here to report it on Github</a>");
    }
    else {
      new Popup({ message : i18n("The BETA version is not available anymore and has become the official release. Next time a BETA is available you will be notified and will have the choice to opt in. Thank you for your participation to the BETA try out. When you will press OK, you will be brought back to the stable version of the app."), callback : function(result) {self.stop_dev_mode(true)} });
    }
  }
  else if(self.dev_mode_available) {
    self.controllers.editor.flash.sticky_success("<a href='javascript:void(0)' onclick='javascript:application.try_dev_mode()'>Click here to try out the BETA version!</a>");
  }
}

ApplicationController.prototype.setupLocaleFlash = function() {
  var self = this;
  if(!String.locale.match('^en')){
    self.controllers.editor.flash.sticky_success("<a target='_blank' href='http://bit.ly/afn-community-fb'>You are using a translated version of the app. Report bad translations by clicking here</a>");
  }
} 

ApplicationController.prototype.is_mobile = function() {
  this._is_mobile = $('#editor_menu .navbar-toggle').is(":visible");
  return this._is_mobile;
}

ApplicationController.prototype.set_mode_and_reload = function(mode, force){
  var action = function() {
      setCookie("AFNVersion", mode);
      window.location.reload();
  }

  if(force) {
    action();
  }
  new Popup({ message : i18n("This action requires to restart the app. Proceed ?"), confirm: true, callback: function(result){
    if(result) { 
      action();
    }
  }});
}

ApplicationController.prototype.display_desktop_ads = function() {
  var self = this;
  setTimeout(function() {
    if($(window).width() < 768) $('.desktop-ads').remove();
    else $('.desktop-ads').show();
  }, 100);
}

ApplicationController.prototype.popup_upgrade = function() {
  new Popup({title : i18n('Upgrade to Anyfile Notepad ++'), hb_partial : '#upgrade', popup_name: 'upgrade',confirm_btn: 'Cancel'});
}

ApplicationController.prototype.propose_upgrade = function() {
  var self = this;

  if(!self.with_ads || $(window).width() < 768) {
    return;
  }

  var count = parseInt(getCookie("propose-upgrade-count"));
  if(!count) {
    count = 0;
  }
  count += 1;

  // If we reach the rotation count, we reset the counter + show the popup
  // Otherwise, we save the current count
  if(count % 3 == 0) {
    setCookie("propose-upgrade-count", 0);
    new Popup({ 
      title : i18n('Upgrade!'), 
      hb_partial : '#propose-upgrade', 
      popup_name: 'propose-upgrade', 
      confirm_btn: 'Continue',
    });
  }
  else {
    setCookie("propose-upgrade-count", count);
  }
}
