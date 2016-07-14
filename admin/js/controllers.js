angular.module('afnAdminApp.baseControllers', []).controller('CRUDController', function($scope, $sessionStorage, $http, $base64, $timeout, $state){
  if($scope.crud_model) {
    $scope.model_name = $scope.crud_model.prototype.model_name;
    $scope.model_name_pl = $scope.crud_model.prototype.model_name_pl;
    $scope.snake_model_name = $scope.crud_model.prototype.snake_model_name;
    $scope.snake_model_name_pl = $scope.crud_model.prototype.snake_model_name_pl;
  }
  $scope.errors = {};
  $scope.username = $sessionStorage.username;
  $scope.password = $sessionStorage.password;
  $scope.login = function() {
    console.log("Login!")
    $http.defaults.headers.common.Authorization = 'Basic ' + 
          $base64.encode($scope.username + ':' + $scope.password);
    $sessionStorage.username = $scope.username;
    $sessionStorage.password = $scope.password;
  }

  $scope.formatObject = function(object) {
    object["__display_attr__"] = object[$scope.crud_model.prototype.display_attr];
    return object;
  };

  $scope.pushObject = function(method, object) {
    var success = function() {
      $state.go($scope.model_name);
    };
    var fail = function(e) {
      console.log(e);
      var rand = Math.random().toString(36).substring(7);
      if(e.status == 401) {
        $scope.errors[rand] = "Unauthorized, you need to login to modify stuff...";
        $timeout(function(){delete $scope.errors[rand]}, 5000)
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

angular.module('afnAdminApp.controllers', []).controller('MimeTypeListController', function($scope, $controller, MimeType) {
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
});
