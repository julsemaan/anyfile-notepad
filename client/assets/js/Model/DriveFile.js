Class("DriveFile", ["CloudFile"]);

DriveFile.prototype.post_init_child = function(options) {
  this.set("provider", "GoogleDrive");
}

DriveFile.prototype.get_file_data = function(){
  var self = this;
  var fields = "downloadUrl,id,mimeType,title,fileSize"
  var request = gapi.client.drive.files.get({
    'fileId': this.id
  });
  callback = function(resp) {
    self.set("mime_type", resp.mimeType)
    self.set("title", resp.title)
    self.set("title_saved", self.title)

    if(!resp.downloadUrl){
      self.loaded("Can't find your file. This is probably a Google document or another unsupported file.")
      return
    }

    $.ajax({
      url : resp.downloadUrl,
      headers : { 'Authorization' : 'Bearer '+gapi.auth.getToken().access_token },
      complete : function(data, status){
        if(data.status == 200){
          self.set("data", data.responseText)
          self.set("data_saved", self.data)
          self.compute_syntax()
          self.loaded()
        }
        else{
          console.log(data)
          self.loaded("Fatal error! The file couldn't load from Google's server. Response was : "+status+". If this happens again, file a bug on the community.");
          return
        }
      },
    })

  };
  application.controllers.google_oauth.execute_request(request, callback)
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
      self.set("title_saved", self.title)
      callback()
    })
  }
  else{
    callback()
  }
}

DriveFile.prototype.update_data = function(new_revision, callback){
  var self = this

  var boundary = '-------314159265358979323846';
  var delimiter = "\r\n--" + boundary + "\r\n";
  var close_delim = "\r\n--" + boundary + "--";

  this.set("_tmp_title_saved", this.title)
  this.set("_tmp_data_saved", this.data)

  var data_blob = new Blob([this.data])

  var reader = new FileReader();
  reader.readAsBinaryString(data_blob);
  reader.onload = function(e) {
    var contentType = self.mime_type || self.mime_type_from_extension();
    self.check_for_unknown_mime_type(contentType)

    var metadata = {fileId : self.id, title : self.title}
    if(self.folder_id){
      metadata['parents'] = [{id:self.folder_id}]
    }

    var base64Data = btoa(reader.result);
    var multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' +
        base64Data +
        close_delim;

    var url = self.persisted ? '/upload/drive/v2/files/' + self.id : '/upload/drive/v2/files/'
    var method = self.persisted ? "PUT" : "POST"

    var request = gapi.client.request({
        'path': url,
        'method': method,
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
    application.controllers.google_oauth.execute_request(request, function(file){
      if(!file.error){
        //set id if it's not persisted and set persisted
        if(!self.persisted){
          self.set("persisted", true)
          self.set("id", file.id)
        }
        self.set("title_saved", self._tmp_title_saved)
        self.set("data_saved", self._tmp_data_saved)
      }
      callback(file)
    });
  }
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
