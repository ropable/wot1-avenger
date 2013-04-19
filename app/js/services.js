'use strict';

/* Services */

angular.module('wot1app.services', ['ngResource'])
    .factory('Story', function($resource) {
        return $resource('data/story2.json', {}, {});
    })
    .factory('Opponents', function($resource) {
        return $resource('data/opponents.json', {}, {});
    });


wot1app.factory('gameState', function($http) {
    // TODO: gameState should persist data via localstorage, unless initialised.
    var gameState = {};
    gameState.currentEntry = '1';
    gameState.entry = null;
    gameState.options = [];
    gameState.started = false;
    gameState.punch = 0;
    gameState.kick = 0;
    gameState.throw = 0;
    gameState.fate = 0;
    gameState.innerForce = 5;
    gameState.endurance = 20;
    gameState.shuriken = 5;
    // Get JSON for starting items.
    $http.get('data/items.json').success(function(data) {
        gameState.items = data;
    });
    gameState.skills = [];
    gameState.currentOpponents = [];
    return gameState;
});
