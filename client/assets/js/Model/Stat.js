Class("Stat", ["Model"]);


Stat.prototype.init = function(args){
  Model.call(this, args);
  if(args){
    if(!args["key"]) throw "Missing key for stat";
    this.key = "afn.app."+this.key;
  }
}

Class("StatIncrement", ["Stat"]);

StatIncrement.record = function(key) {
  var self = new StatIncrement({key:key});
  self.type = "increment";
  $.post(
    AFN_VARS["afn_api_uri"] + "/stats",
    JSON.stringify({
      type: self.type,
      key: self.key,
    })
  );
}

