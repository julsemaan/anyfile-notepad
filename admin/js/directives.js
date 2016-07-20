angular.module('afnAdminApp.directives', []).directive('afnInput', function(){
  return {
    restrict: 'E',
    scope: {
      ngModelVar: '=',
      options: '=',
    },
    templateUrl: '/partials/shared/afn-input.html',
    link: function(scope, iElement, iAttrs){
      scope.iAttrs = iAttrs;
    },
  }
}).directive('autoActive', ['$location', function ($location) {
  return {
    restrict: 'A',
    scope: false,
    link: function (scope, element) {
      function setActive() {
        var path = $location.path();
        if (path) {
          angular.forEach(element.find('li'), function (li) {
            var anchor = li.querySelector('a');
            var stripped_href = anchor.href.split('#')[1];
            if (path.match(stripped_href + '.*')) {
              angular.element(li).addClass('active');
            } else {
              angular.element(li).removeClass('active');
            }
          });
        }
      }
      setActive();
      scope.$on('$locationChangeSuccess', setActive);
    }
  }
}]);

