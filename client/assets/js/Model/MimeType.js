function MimeType(ledata){
  Model.call(this, ledata)
}

MimeType.prototype = new Model()

MimeType.rest_attributes = function(){
  return {
    model_name: "MimeType",
    url_name: "mime_types",
    base_url: "https://api.anyfile-notepad.semaan.ca",
  }
}
