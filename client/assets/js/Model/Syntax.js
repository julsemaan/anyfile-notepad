function Syntax(ledata){
  Model.call(this, ledata)
}

Syntax.prototype = new Model()

Syntax.rest_attributes = function(){
  return {
    model_name: "Syntax",
    url_name: "syntaxes",
    base_url: "https://api.anyfile-notepad.semaan.ca",
  }
}
