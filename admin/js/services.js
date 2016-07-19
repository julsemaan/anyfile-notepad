angular.module('afnAdminApp.services', []).factory('MimeType', function($resource) {
  var res = $resource('http://devbox.home.semaan.ca:8080/mime_types/:id', {id: '@id'}, {
    update: {
      method: 'PUT'
    }
  });
  res.prototype.model_name = "MimeType";
  res.prototype.model_name_pl = "MimeTypes";

  res.prototype.snake_model_name = "mime_type";
  res.prototype.snake_model_name_pl = "mime_types";

  res.prototype.display_attr = "type_name";
  return res;
}).factory('Syntax', function($resource) {
  var res = $resource('http://devbox.home.semaan.ca:8080/syntaxes/:id', {id: '@id'}, {
    update: {
      method: 'PUT'
    }
  });
  res.prototype.model_name = "Syntax";
  res.prototype.model_name_pl = "Syntaxes";

  res.prototype.snake_model_name = "syntax";
  res.prototype.snake_model_name_pl = "syntaxes";

  res.prototype.display_attr = "display_name";
  res.prototype.type_name = "";
  return res;
}).service('$popup',function($window){
    this.showPopup=function(message){
        return $window.confirm(message);
    }
}).service('$flash', function($timeout){
  console.log(this)
  this.flash = [];
  
  this.add = function(type, msg, timeout) {
    var self = this;
    var o = {type:type, msg:msg};
    this.flash.push(o);
    if(timeout) {
      $timeout(function(){self.flash.splice(self.flash.indexOf(o), 1)}, timeout)
    }
  }
});

