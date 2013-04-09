'use strict';

angular.module('wot1', ['wot1.services']).
  config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
    $routeProvider.
      when('/new-game', {templateUrl: 'partials/new_game.html', controller: NewGameCtrl}).
      when('/background', {templateUrl: 'partials/background.html', controller: BackgroundCtrl}).
      when('/story', {templateUrl: 'partials/story.html', controller: StoryCtrl}).
      when('/story/:entry', {templateUrl: 'partials/entry.html', controller: EntryCtrl}).
      when('/title', {templateUrl: 'partials/title.html', controller: TitleCtrl}).
      otherwise({redirectTo: '/title'});

    //$locationProvider.html5Mode(true);
  }]);
