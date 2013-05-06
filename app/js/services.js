'use strict';

/* Services */

angular.module('wot1app.services', ['ngResource'])
    .factory('Story', function($resource) {
        return $resource('data/story.json', {}, {});
    })
    .factory('Items', function($resource) {
        return $resource('data/items.json', {}, {});
    })
    .factory('Opponents', function($resource) {
        return $resource('data/opponents.json', {}, {});
    })
    .factory('Loot', function($resource) {
        return $resource('data/loot.json', {}, {});
    })
    .factory('Notes', function($resource) {
        return $resource('data/notes.json', {}, {});
    });


wot1app.factory('gameState', function($http) {
    // TODO: gameState should persist data via localstorage, unless initialised.
    var gameState = {};
    gameState.inProgress = false;
    gameState.currentEntry = null;
    gameState.cheatMode = true;
    gameState.entry = null;
    gameState.entryText = null;
    gameState.hasEntryImage = false;
    gameState.actionText = null;
    gameState.actions = [];
    gameState.options = [];
    gameState.punch = 0;
    gameState.kick = 0;
    gameState.throw = 0;
    gameState.fate = 0;
    gameState.innerForce = 5;
    gameState.endurance = 20;
    gameState.shuriken = 5;
    gameState.items = [];
    gameState.skills = [];
    gameState.notes = [];
    gameState.events = [];
    gameState.currentOpponents = [];
    gameState.actionText = null;
    gameState.attackModifierTemp = 0;
    gameState.combatTimer = null;
    gameState.lost_equipment = [];
    return gameState;
});
