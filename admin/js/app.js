angular.module('afnAdminApp', ['ui.router', 'ngResource', 'ngStorage', 'base64', 'afnAdminApp.baseControllers', 'afnAdminApp.controllers', 'afnAdminApp.services', 'afnAdminApp.directives']);

angular.module('afnAdminApp').config(function($stateProvider) {
  $stateProvider.state('MimeType', { // state for showing all mime types
    url: '/mime_types',
    templateUrl: 'partials/crud/index.html',
    controller: 'MimeTypeListController'
  }).state('viewMimeType', { //state for showing single mime type
    url: '/mime_types/:id/view',
    templateUrl: 'partials/crud/view.html',
    controller: 'MimeTypeViewController'
  }).state('newMimeType', { //state for adding a new mime_type
    url: '/mime_types/new',
    templateUrl: 'partials/mime_types/add.html',
    controller: 'MimeTypeCreateController'
  }).state('editMimeType', { //state for updating a mime_type
    url: '/mime_types/:id/edit',
    templateUrl: 'partials/mime_types/edit.html',
    controller: 'MimeTypeEditController'
  });
}).run(function($state) {
  $state.go('MimeType'); //make a transition to mime_types state when app starts
});
