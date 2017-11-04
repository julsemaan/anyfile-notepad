
function Endpoint(result){
  var self = this;
  self.name = result['device']['name'];
  self.version = result['version'];
  self.score = result['score'];

  self.parents = [];
  for(var i in result['device']['parents']){  
    self.parents.push(result['device']['parents'][i]['name']);
  }
}
// Tests run through node so we need to export it
if(typeof(requireGlobal) == "function") exports.Endpoint = Endpoint;

Endpoint.prototype.hasParent = function(name){
  var self = this;
  return self.parents.indexOf(name) > -1;
}

Endpoint.prototype.is = function(name){
  var self = this;
  return (self.name == name || self.hasParent(name));
}

Endpoint.prototype.isAndroid = function(){
  var self = this;
  return self.is("Generic Android");
}

Endpoint.prototype.isIos = function(){
  var self = this;
  return self.is("Apple iPod, iPhone or iPad");
}

Endpoint.prototype.isWindows = function(){
  var self = this;
  return self.is("Windows");
}

Endpoint.prototype.isMac = function(){
  var self = this;
  return self.is("Macintosh");
}

Endpoint.prototype.isWindowsPhone = function(){
  var self = this;
  return self.is("Windows Phone");
}

Endpoint.prototype.isBlackberry = function(){
  var self = this;
  return self.is("RIM BlackBerry");
}


function FingerbankClient(){
  var self = this;
  self.key = "javascript-lib";
}
// Tests run through node so we need to export it
if(typeof(requireGlobal) == "function") exports.FingerbankClient = FingerbankClient;

FingerbankClient.prototype.endpointFromCurrentUserAgent = function(callback){
  var self = this;
  return self.endpointFromUserAgent(navigator.userAgent, callback);
}

FingerbankClient.prototype.endpointFromUserAgent = function(userAgent, callback){
  var self = this;
  $.ajax({
    type:"get",
    url:"https://fingerbank.inverse.ca/api/v1/combinations/interogate",
    beforeSend: function(request){
      request.setRequestHeader("X-Fingerbank-Lib", "Inverse-Javascript-Lib");
    },
    data:{
      user_agent: userAgent,
      key: self.key,
    },
    success: function(data){
      callback(new Endpoint(data));
    },
    error: function(response){
      if(response.status == 404){
        callback();
      }
      else {
        console.error("Fingerbank API call failed with error : "+response.status+", Response text : "+response.responseText);
        var error = {status : response.status, message : response.responseText};
        callback(null,error);
      }
    }
  });
}

