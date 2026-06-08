Class("Stat", ["Model"]);


Stat.prototype.post_init = function(args){
  if(!args["key"]) throw "Missing key for stat";
  this.key = "afn.app."+this.key;
}

Class("StatIncrement", ["Stat"]);

StatIncrement.hex_encode = function(str) {
  var hex = '';
  // Encode as UTF-8 bytes, then hex-encode each byte with zero-padding.
  // unescape(encodeURIComponent(str)) yields a string where each char is one UTF-8 byte (0-255).
  var bytes = unescape(encodeURIComponent(str));
  for (var i = 0; i < bytes.length; i++) {
    var code = bytes.charCodeAt(i);
    hex += ('0' + code.toString(16)).slice(-2);
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

