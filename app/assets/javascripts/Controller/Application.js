function ApplicationController() {
  this.dev_mode_name = "dev";
  this.dev_mode = (getCookie("AFNVersion") == this.dev_mode_name); 
}

ApplicationController.prototype.try_dev_mode = function(){
  this.set_mode_and_reload(this.dev_mode_name);
}

ApplicationController.prototype.stop_dev_mode = function(){
  this.set_mode_and_reload("", "/app");
}

ApplicationController.prototype.set_mode_and_reload = function(mode, destination){
  if(confirm("This requires to restart the app. Proceed ?")){
    setCookie("AFNVersion", mode);
    if(destination){
      window.location = destination;
    }
    else {
      window.location.reload();
    }
  }
}
