'use strict';

var wot1app = angular.module('wot1', ['wot1app.services']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/title', {templateUrl: 'partials/title.html'}).
      when('/new-game', {templateUrl: 'partials/new_game.html', controller: NewGameCtrl}).
      when('/background', {templateUrl: 'partials/background.html'}).
      when('/story', {templateUrl: 'partials/story.html', controller: StoryCtrl}).
      otherwise({redirectTo: '/title'});

    //$locationProvider.html5Mode(true);
  }]);
