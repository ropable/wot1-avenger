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
    // gameState should persist data via localstorage, unless initialised.
    // The values below are initial values.
    var gameState = {
        inProgress: false,
        currentEntry: null,
        entryCount: 0,
        cheatMode: true,
        entry: null,
        entryText: null,
        entryHeading: null,
        hasEntryImage: false,
        actionText: null,
        actions: [],
        options: [],
        punch: 0,
        kick: 0,
        throw: 0,
        fate: 0,
        innerForce: 5,
        endurance: 20,
        shuriken: 5,
        items: [],
        skills: [],
        notes: [],
        events: [],
        currentOpponents: [],
        attackModifierTemp: 0,
        combatTimer: null,
        lost_equipment: [],
        lost_shuriken: 0,
        held_loot: [],
        allies: [],
        inCombat: false,
        gameComplete: false,
        punchesTotal: 0,
        punchesHit: 0,
        kicksTotal: 0,
        kicksHit: 0,
        throwsTotal: 0,
        throwsHit: 0,
        victoriesStat: []
    };
    return gameState;
});
