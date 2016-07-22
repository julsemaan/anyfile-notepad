function Extension(ledata){
  Model.call(this, ledata)
}

Extension.prototype = new Model()

Extension.rest_attributes = function(){
  return {
    model_name: "Extension",
    url_name: "extensions",
    base_url: "https://api.anyfile-notepad.semaan.ca",
  }
}
