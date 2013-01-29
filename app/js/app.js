'use strict';



angular.module('wot1app', []).
  config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/background', {templateUrl: 'partials/background.html', controller: BackgroundCtrl});
    $routeProvider.when('/new-game', {templateUrl: 'partials/new_game.html', controller: NewGameCtrl});
    $routeProvider.when('/story', {templateUrl: 'partials/story.html', controller: StoryCtrl});
    $routeProvider.otherwise({redirectTo: '/new-game'});
  }]);
