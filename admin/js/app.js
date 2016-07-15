angular.module('afnAdminApp', ['ui.router', 'ngResource', 'ngStorage', 'ngSanitize', 'base64', 'afnAdminApp.baseControllers', 'afnAdminApp.controllers', 'afnAdminApp.services', 'afnAdminApp.directives']);

angular.module('afnAdminApp').config(function($stateProvider) {
  $stateProvider
  // Mime types  
  .state('MimeType', { // state for showing all mime types
    url: '/mime_types',
    templateUrl: 'partials/crud/index.html',
    controller: 'MimeTypeListController'
  }).state('viewMimeType', { //state for showing single mime type
    url: '/mime_types/:id/view',
    templateUrl: 'partials/crud/view.html',
    controller: 'MimeTypeViewController'
  }).state('newMimeType', { //state for adding a new mime_type
    url: '/mime_types/new',
    templateUrl: 'partials/crud/add.html',
    controller: 'MimeTypeCreateController'
  }).state('editMimeType', { //state for updating a mime_type
    url: '/mime_types/:id/edit',
    templateUrl: 'partials/crud/edit.html',
    controller: 'MimeTypeEditController'
  })
  // Syntaxes
  .state('Syntax', {
    url: '/syntaxes',
    templateUrl: 'partials/crud/index.html',
    controller: 'SyntaxListController',
  }).state('viewSyntax', { //state for showing single mime type
    url: '/syntaxes/:id/view',
    templateUrl: 'partials/crud/view.html',
    controller: 'SyntaxViewController'
  }).state('newSyntax', { //state for adding a new mime_type
    url: '/syntaxes/new',
    templateUrl: 'partials/crud/add.html',
    controller: 'SyntaxCreateController'
  }).state('editSyntax', { //state for updating a mime_type
    url: '/syntaxes/:id/edit',
    templateUrl: 'partials/crud/edit.html',
    controller: 'SyntaxEditController'
  });
}).run(function($state) {
  $state.go('MimeType'); //make a transition to mime_types state when app starts
});
