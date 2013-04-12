'use strict';

/* Services */

angular.module('wot1app.services', ['ngResource'])
    .factory('Story', function($resource) {
        return $resource('data/story.json', {}, {});
    });

wot1app.factory('gameState', function($http) {
    var gameState = {};
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
    return gameState;
});
