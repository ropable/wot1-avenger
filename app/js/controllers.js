'use strict';

/* Controllers */

function TitleCtrl() {

}
//TitleCtrl.$inject = [];


function NewGameCtrl($scope, $http) {
    // Get JSON for available skills to choose.
    $http.get('data/skills.json').success(function(data) {
        $scope.skills = data;
    });
    $scope.chosenSkills = [];
    $scope.selectedCount = 0;

    $scope.selectSkill = function($event, skill) {
        var checkbox = event.target;
        if (checkbox.checked) {
            $scope.chosenSkills.push(skill);
        } else {
            $scope.chosenSkills.splice($scope.chosenSkills.indexOf(skill), 1);
        }
        $scope.selectedCount = 0;  // Reset the count.
        angular.forEach($scope.skills, function(c) {
            $scope.selectedCount += (c.checked ? 1 : 0);
        });
    };

    $scope.isSelected = function(skill) {
        return $scope.chosenSkills.indexOf(skill) >= 0;
    };
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


