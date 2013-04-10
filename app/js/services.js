'use strict';

/* Services */

angular.module('wot1.services', ['ngResource']).
    factory('Story', function($resource) {
        return $resource('data/story.json', {}, {});
    });
