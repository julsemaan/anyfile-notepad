angular.module('afnAdminApp.baseControllers', []).controller('CRUDController', function($scope, $sessionStorage, $http, $base64){
  if($scope.crud_model) {
    $scope.model_name = $scope.crud_model.prototype.model_name;
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

  $scope.format_object = function(object) {
    object["__display_attr__"] = object[$scope.crud_model.prototype.display_attr];
    return object;
  };
}).controller('CRUDListController', function($scope, $controller, popupService, $window){
  $controller('CRUDController', {$scope: $scope});

  $scope.crud_model.query().$promise.then(function(objects) {
    $scope.objects = objects;
    for(var k in $scope.objects) {
      $scope.objects[k] = $scope.format_object($scope.objects[k]);
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
  $scope.crud_model.get({ id: $stateParams.id }).$promise.then(function(object){$scope.object = $scope.format_object(object)});
});

angular.module('afnAdminApp.controllers', []).controller('MimeTypeListController', function($scope, $controller, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDListController', {$scope: $scope});

}).controller('MimeTypeViewController', function($scope, $controller, $stateParams, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDViewController', {$scope: $scope});

}).controller('MimeTypeCreateController', function($scope, $controller, $state, $stateParams, MimeType) {
  $scope.crud_model = MimeType;
  $controller('CRUDController', {$scope: $scope});
  $scope.mime_type = new MimeType();
  console.log($scope.mime_type)

  $scope.addMimeType = function() {
    $scope.mime_type.$save(function() {
      $state.go('mime_types');
    });
  };
}).controller('MimeTypeEditController', function($scope, $controller, $state, $stateParams, MimeType, $timeout) {
  $scope.crud_model = MimeType;
  $controller('CRUDController', {$scope: $scope});
  $scope.updateMimeType = function() {
    $scope.mime_type.$update(function() {
      $state.go('mime_types');
    },function(e) {
      console.log(e);
      var rand = Math.random().toString(36).substring(7);
      if(e.status == 401) {
        $scope.errors[rand] = "Unauthorized, you need to login to modify stuff...";
        $timeout(function(){delete $scope.errors[rand]}, 5000)
      }
    });
  };

  $scope.loadMimeType = function() {
    $scope.mime_type = MimeType.get({ id: $stateParams.id });
  };

  $scope.loadMimeType();
});
