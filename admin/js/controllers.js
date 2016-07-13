angular.module('afnAdminApp.baseControllers', []).controller('CRUDController', function($scope){
  $scope.errors = {};
});

angular.module('afnAdminApp.controllers', []).controller('MimeTypeListController', function($scope, $controller, $state, popupService, $window, MimeType) {
  $controller('CRUDController', {$scope: $scope});

  $scope.mime_types = MimeType.query();

  $scope.deleteMimeType = function(mime_type) {
    if (popupService.showPopup('Really delete this?')) {
      mime_type.$delete(function() {
        $window.location.href = '';
      });
    }
  };
}).controller('MimeTypeViewController', function($scope, $controller, $stateParams, MimeType) {
  $controller('CRUDController', {$scope: $scope});
  $scope.mime_type = MimeType.get({ id: $stateParams.id });
}).controller('MimeTypeCreateController', function($scope, $controller, $state, $stateParams, MimeType) {
  $controller('CRUDController', {$scope: $scope});
  $scope.mime_type = new MimeType();

  $scope.addMimeType = function() {
    $scope.mime_type.$save(function() {
      $state.go('mime_types');
    });
  };
}).controller('MimeTypeEditController', function($scope, $controller, $state, $stateParams, MimeType, $timeout) {
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
