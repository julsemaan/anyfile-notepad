function DriveFile(id, options){
  var self = this;
  this.id = id
  this.folder_id = options["folder_id"]
  this.get_file_data()
  this.loaded = false
  this.title
  this.title_saved
  this.data
  this.data_saved
  this.loaded = options["loaded"]
  this._post_update_callback
}

DriveFile.prototype.get_file_data = function(){
  var self = this;
  var fields = "downloadUrl,id,mimeType,title,fileSize"
  var request = gapi.client.drive.files.get({
    'fileId': this.id
  });
  request.execute(function(resp) {
    self.mime_type = resp.mimeType
    self.title = resp.title
    self.title_saved = self.title

    $.ajax({
      url : resp.downloadUrl,
      headers : { 'Authorization' : 'Bearer '+gapi.auth.getToken().access_token },
      complete : function(data, status){
        self.data = data.responseText
        self.data_saved = self.data
        self.loaded()
      },
    })
  });
}

DriveFile.prototype.update = function(new_revision, callback) {
  var self = this;
  this._post_update_callback = callback

  if (this.did_content_change() ){
    self.update_data(new_revision, function(){
      self._post_update_callback()
    })
  }
  else{
    callback()
  }

}

DriveFile.prototype.update_metadata = function(callback){
  var self = this
  if (this.title != this.title_saved){
    var body = {'title': this.title };
    var request = gapi.client.drive.files.patch({
      'fileId': this.id,
      'resource': body
    });
    request.execute(function(){
      self.title_saved = self.title
      callback()
    })
  }
  else{
    callback()
  }
}

DriveFile.prototype.update_data = function(new_revision, callback){
  var self = this
  console.log(new_revision)
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  var data_blob = new Blob([this.data])

  var reader = new FileReader();
  reader.readAsBinaryString(data_blob);
  reader.onload = function(e) {
    // after the || should compute mime type automagically
    var contentType = self.mime_type || 'application/octet-stream';

    var base64Data = btoa(reader.result);
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify({fileId : self.id, title : self.title}) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files/' + self.id,
        'method': 'PUT',
        'params': { uploadType : 'multipart', alt : 'json', newRevision : new_revision, fileId : self.id},
        'headers': {
          'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
        'body': multipartRequestBody});
    if (!callback) {
      callback = function(file) {
        console.log(file)
      };
    }
    request.execute(function(){
      self.title_saved = self.title
      self.data_saved = self.data
      callback()
    });
  }
}

DriveFile.prototype.did_content_change = function(){
  var self = this;
  return (this.data != this.data_saved || this.title != this.title_saved)
}

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
