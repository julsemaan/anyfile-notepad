angular.module('afnAdminApp.baseControllers', []).controller('CRUDController', function($scope, $sessionStorage, $http, $base64, $timeout, $state){
  if($scope.crud_model) {
    $scope.model_name = $scope.crud_model.prototype.model_name;
    $scope.model_name_pl = $scope.crud_model.prototype.model_name_pl;
    $scope.snake_model_name = $scope.crud_model.prototype.snake_model_name;
    $scope.snake_model_name_pl = $scope.crud_model.prototype.snake_model_name_pl;
  }
  $scope.form_errors = {};

  $scope.username = $sessionStorage.username;
  $scope.password = $sessionStorage.password;
  $scope.login = function() {
    console.log("Login!")
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

  $scope.formatObject = function(object) {
    object["__display_attr__"] = object[$scope.crud_model.prototype.display_attr];
    return object;
  };

  $scope.hasError = function() {
    return (Object.keys($scope.form_errors).length > 0);
  }

  $scope.addError = function(error, timeout) {
    var rand = Math.random().toString(36).substring(7);
    $scope.form_errors[rand] = error;
    if(timeout) {
      $timeout(function(){delete $scope.form_errors[rand]}, 5000)
    }
  }

  $scope.pushObject = function(method, object) {
    // Emptying existing errors
    for(var e in $scope.form_errors) delete $scope.form_errors[e];

    var success = function() {
      $state.go($scope.model_name);
    };
    var fail = function(e) {
      console.log(e);
      if(e.status == 401) {
        $scope.addError("Unauthorized, you need to login to modify stuff...", 5000);
      }
      else if(e.status == 422) {
        var issues = e.data.issues;
        for(var field in issues) {
          $scope.addError("Field <i>"+field+"</i> has errors : "+issues[field].map(function(o){return '<b>'+o+'</b>'}).join(','));
        }
      }
    };
    if(method == "update") {
      object.$update(success,fail);
    }
    else if(method == "create") {
      object.$save(success,fail);
    }
  }
}).controller('CRUDListController', function($scope, $controller, popupService, $window){
  $controller('CRUDController', {$scope: $scope});

  $scope.crud_model.query().$promise.then(function(objects) {
    $scope.objects = objects;
    for(var k in $scope.objects) {
      $scope.objects[k] = $scope.formatObject($scope.objects[k]);
    }
  });

  $scope.deleteObject = function(o) {
    if (popupService.showPopup('Really delete this?')) {
      o.$delete(function() {
        $window.location.href = '';
      });
    }
  };

}).controller('CRUDViewController', function($scope, $controller, $stateParams){
  $controller('CRUDController', {$scope: $scope});
  $scope.crud_model.get({ id: $stateParams.id }).$promise.then(function(object){$scope.object = $scope.formatObject(object)});

}).controller('CRUDCreateController', function($scope, $controller) {
  $controller('CRUDController', {$scope: $scope});
  $scope.object = new $scope.crud_model();

  $scope.addObject = function() {
    $scope.pushObject("create", $scope.object);
  };
  
}).controller('CRUDEditController', function($scope, $controller, $stateParams){
  $controller('CRUDController', {$scope: $scope});
  
  $scope.updateObject = function() {
    $scope.pushObject("update", $scope.object);
  };

  $scope.loadObject = function() {
    $scope.object = $scope.crud_model.get({ id: $stateParams.id });
  };

  $scope.loadObject();
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
});
