'use strict';

/* Controllers */

function NewGameCtrl() {}
//MyCtrl2.$inject = [];


function StoryCtrl($scope, $http, Story) {
    $scope.story = Story.query();
}
//StoryCtrl.$inject = [];


function EntryCtrl($scope, $routeParams, $http) {
    // Use the low-level $http service instead of $resource.
    $http.get('data/story.json').success(function(data) {
        angular.forEach(data, function(item) {
            if (item.entry == $routeParams.entry)
                $scope.entry = item;
        });
    });
}
//EntryCtrl.$inject = [];


function BackgroundCtrl() {}
//MyCtrl1.$inject = [];


