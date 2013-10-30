'use strict';

var wot1app = angular.module('wot1', ['wot1app.services', 'LocalStorageModule']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/title', {templateUrl: 'partials/title.html', controller: GameStateCtrl}).
      when('/new-game', {templateUrl: 'partials/new_game.html', controller: NewGameCtrl}).
      when('/background', {templateUrl: 'partials/background.html', controller: GameStateCtrl}).
      when('/instructions', {templateUrl: 'partials/instructions.html', controller: GameStateCtrl}).
      when('/about', {templateUrl: 'partials/about.html', controller: GameStateCtrl}).
      when('/story', {templateUrl: 'partials/story.html', controller: StoryCtrl}).
      otherwise({redirectTo: '/title'});

    //$locationProvider.html5Mode(true);
  }]);
