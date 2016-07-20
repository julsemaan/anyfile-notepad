angular.module('afnAdminApp.services', []).factory('MimeType', function($resource, $q) {
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

  res.formatObject = function(object) {
    object["__display_attr__"] = object[object.__proto__.display_attr];
    return object;
  };

  var super_query = res.query;
  res.query = function() {
    var self = this;
    var defer = $q.defer();
    super_query.call(self, arguments).$promise.then(function(objects){
      for(var i in objects) {
        objects[i] = res.formatObject(objects[i]);
      }
      defer.resolve(objects);
    });
    return {$promise:defer.promise};
  }

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
  return res;
}).factory('Extension', function($resource, Syntax, MimeType){
  var res = $resource('http://devbox.home.semaan.ca:8080/extensions/:id', {id: '@id'}, {
    update: {
      method: 'PUT'
    }
  });
  res.prototype.model_name = "Extension";
  res.prototype.model_name_pl = "Extensions";

  res.prototype.snake_model_name = "extension";
  res.prototype.snake_model_name_pl = "extensions";

  res.prototype.display_attr = "name";

  res.prototype.relations = {
    syntax_id : Syntax,
    mime_type_id : MimeType,
  };

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

