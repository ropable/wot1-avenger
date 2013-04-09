'use strict';

/* Controllers */

function TitleCtrl() {}


function NewGameCtrl($scope) {
    $scope.skills = [];
    $scope.submit = function() {
        console.log('foo');
        if (this.arrow_cutting) {
            console.log('foo');
            this.list.push(this.arrow_cutting);
        };
    }
}
//MyCtrl2.$inject = [];


function StoryCtrl($scope, $http, Story) {
    $scope.story = Story.query();
}
//StoryCtrl.$inject = [];


function EntryCtrl($scope, $routeParams, $http) {
    // Use the low-level $http service instead of $resource.
    $http.get('data/story.json').success(function(data) {
        // Each item in story.json is a dict of an entry's details.
        angular.forEach(data, function(item) {
            // Obtain the req'd entry no from the routeParams.
            if (item.entry == $routeParams.entry)
                $scope.entry = item;
        });
    });
}
//EntryCtrl.$inject = [];


function BackgroundCtrl() {}
//MyCtrl1.$inject = [];


