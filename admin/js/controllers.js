angular.module('afnAdminApp.baseControllers', []).controller('AppController', function($scope, $sessionStorage, $http, $base64, $flash) {
  $scope.flash = $flash.flash;
  
  $scope.username = $sessionStorage.username;
  $scope.password = $sessionStorage.password;
  $scope.login = function() {
    $http.defaults.headers.common.Authorization = 'Basic ' + 
          $base64.encode($scope.username + ':' + $scope.password);
    $sessionStorage.username = $scope.username;
    $sessionStorage.password = $scope.password;
  }

  if($scope.username && $scope.password) $scope.login()

  $scope.loggedIn = function() {
    return $http.defaults.headers.common.Authorization;
  };

  $scope.logout = function() {
    $http.defaults.headers.common.Authorization = null;
    $sessionStorage.username = '';
    $sessionStorage.password = '';
    $scope.username = '';
    $scope.password = '';
  }

})

.controller('CRUDController', function($scope, $timeout, $state, $flash){
  if($scope.crud_model) {
    $scope.model_name = $scope.crud_model.prototype.model_name;
    $scope.model_name_pl = $scope.crud_model.prototype.model_name_pl;
    $scope.snake_model_name = $scope.crud_model.prototype.snake_model_name;
    $scope.snake_model_name_pl = $scope.crud_model.prototype.snake_model_name_pl;
  }
  $scope.form_errors = {};

  $scope.formatObject = function(object) {
    object["__display_attr__"] = object[object.__proto__.display_attr];
    return object;
  };

  $scope.hasError = function() {
    return (Object.keys($scope.form_errors).length > 0);
  }

  $scope.addError = function(error, timeout) {
    var rand = Math.random().toString(36).substring(7);
    $scope.form_errors[rand] = error;
    if(timeout) {
      $timeout(function(){delete $scope.form_errors[rand]}, timeout)
    }
  }

  $scope.pushObject = function(method, object) {
    // Emptying existing errors
    for(var e in $scope.form_errors) delete $scope.form_errors[e];

    var success = function() {
      $flash.add("success", $scope.model_name + " saved.", 5000);
      $state.go($scope.model_name);
    };
    var fail = function(e) {
      if(e.status == 401) {
        $scope.addError("Unauthorized, you need to login to modify stuff...", 5000);
      }
      else if(e.status == 412) {
        if(e.data.message) $scope.addError(e.data.message);
        $scope.addError("This usually means someone did a change at the same time you did. You should restart the edit and redo your changes. Otherwise, you can force the change by saving again but it will overwrite the change that was done prior to yours.");
      }
      else if(e.status == 422) {
        if(e.data.message) $scope.addError(e.data.message);

        var issues = e.data.issues;
        for(var field in issues) {
          $scope.addError("Field <i>"+field+"</i> has errors : "+issues[field].map(function(o){return '<b>'+o+'</b>'}).join(','));
        }
      }
      else {
        if(e.data.message) $scope.addError(e.data.message);
      }
    };
    if(method == "update") {
      delete object['__display_attr__'];
      delete object['__relations__'];
      object.$update(success,fail);
    }
    else if(method == "create") {
      object.$save(success,fail);
    }
  }

  $scope.isRelationshipKey = function(key) {
    return /_id$/.test(key);
  }
  
  $scope.relationshipURL = function(action, object) {
    if(!object) return;
    return $state.href(action+object.model_name, {id:object.id});
  }

  $scope.crud_loaded = $scope.crud_loaded || function(){}

}).controller('CRUDListController', function($scope, $controller, $popup, $flash, $state, $location, $anchorScroll){
  $controller('CRUDController', {$scope: $scope});

  $scope.objects = $scope.crud_model.query();

  $scope.deleteObject = function(o) {
    if ($popup.showPopup('Really delete this?')) {
      o.$delete(function() {
        $scope.objects.splice($scope.objects.indexOf(o), 1);
        $flash.add('success', "Deleted "+$scope.model_name+" '"+o.__display_attr__+"'", 5000);
        $location.hash('flash');
        $anchorScroll();
      });
    }
  };

}).controller('CRUDViewController', function($scope, $controller, $stateParams){
  $controller('CRUDController', {$scope: $scope});
  $scope.object = $scope.crud_model.get({ id: $stateParams.id });

}).controller('CRUDCreateController', function($scope, $controller) {
  $controller('CRUDController', {$scope: $scope});
  $scope.object = new $scope.crud_model();

  $scope.addObject = function() {
    $scope.pushObject("create", $scope.object);
  };
  
  $scope.relationOptions = {};
  for(var key in $scope.object.__proto__.relations) {
    $scope.relationOptions[key] = $scope.object.__proto__.relations[key].query();
  }

  
}).controller('CRUDEditController', function($scope, $controller, $stateParams){
  $controller('CRUDController', {$scope: $scope});
  
  $scope.updateObject = function() {
    $scope.pushObject("update", $scope.object);
  };

  $scope.object = $scope.crud_model.get({ id: $stateParams.id });
  
  $scope.relationOptions = {};
  for(var key in $scope.object.__proto__.relations) {
    $scope.relationOptions[key] = $scope.object.__proto__.relations[key].query();
  }

});

angular.module('afnAdminApp.controllers', [])
// Mime types
.controller('MimeTypeListController', function($scope, $controller, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDListController', {$scope: $scope});
}).controller('MimeTypeViewController', function($scope, $controller, $stateParams, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDViewController', {$scope: $scope});
}).controller('MimeTypeCreateController', function($scope, $controller, $state, $stateParams, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDCreateController', {$scope: $scope});
}).controller('MimeTypeEditController', function($scope, $controller, $stateParams, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDEditController', {$scope: $scope});
})
// Syntaxes
.controller('SyntaxListController', function($scope, $controller, Syntax) {
  $scope.crud_model = Syntax;
  $controller('CRUDListController', {$scope: $scope});
}).controller('SyntaxViewController', function($scope, $controller, $stateParams, Syntax) {
  $scope.crud_model = Syntax;
  $controller('CRUDViewController', {$scope: $scope});
}).controller('SyntaxCreateController', function($scope, $controller, $state, $stateParams, Syntax) {
  $scope.crud_model = Syntax;
  $controller('CRUDCreateController', {$scope: $scope});
}).controller('SyntaxEditController', function($scope, $controller, $stateParams, Syntax) {
  $scope.crud_model = Syntax;
  $controller('CRUDEditController', {$scope: $scope});
})
// Extensions
.controller('ExtensionListController', function($scope, $controller, Extension) {
  $scope.crud_model = Extension;
  $controller('CRUDListController', {$scope: $scope});
}).controller('ExtensionViewController', function($scope, $controller, $stateParams, Extension, $state) {
  $scope.crud_model = Extension;
  $controller('CRUDViewController', {$scope: $scope});
}).controller('ExtensionCreateController', function($scope, $controller, $state, $stateParams, Extension) {
  $scope.crud_model = Extension;
  $controller('CRUDCreateController', {$scope: $scope});
}).controller('ExtensionEditController', function($scope, $controller, $stateParams, Extension) {
  $scope.crud_model = Extension;
  $controller('CRUDEditController', {$scope: $scope});
})
// Settings
.controller('SettingListController', function($scope, $controller, Setting) {
  $scope.crud_model = Setting;
  $controller('CRUDListController', {$scope: $scope});
}).controller('SettingViewController', function($scope, $controller, $stateParams, Setting) {
  $scope.crud_model = Setting;
  $controller('CRUDViewController', {$scope: $scope});
}).controller('SettingCreateController', function($scope, $controller, $state, $stateParams, Setting) {
  $scope.crud_model = Setting;
  $controller('CRUDCreateController', {$scope: $scope});
}).controller('SettingEditController', function($scope, $controller, $stateParams, Setting) {
  $scope.crud_model = Setting;
  $controller('CRUDEditController', {$scope: $scope});
});
