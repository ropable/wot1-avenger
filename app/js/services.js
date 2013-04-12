'use strict';

/* Services */

angular.module('wot1app.services', ['ngResource'])
    .factory('Story', function($resource) {
        return $resource('data/story.json', {}, {});
    });

wot1app.factory('gameState', function() {
    var gameState = {};
    gameState.started = false;
    gameState.skills = [];
    return gameState;
});
