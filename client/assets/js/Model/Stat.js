Class("Stat", ["Model"]);


Stat.prototype.post_init = function(args){
  if(!args["key"]) throw "Missing key for stat";
  this.key = "afn.app."+this.key;
}

Class("StatIncrement", ["Stat"]);

StatIncrement.hex_encode = function(str) {
  var hex = '';
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    hex += code.toString(16);
  }
  return hex;
}

StatIncrement.record_file_edit_mime_type = function(mime_type) {
  StatIncrement.record("file-edit.mime-type.hex." + StatIncrement.hex_encode(mime_type));
}

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

