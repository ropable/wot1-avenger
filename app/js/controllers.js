'use strict';

/* Controllers */

function NewGameCtrl($scope, $http, Story, $location, gameState) {
    // Get JSON for available skills to choose.
    var storyjson = Story.get();
    $http.get('data/skills.json').success(function(data) {
        // Remove the first element: we always get Shurikenjutsu.
        $scope.shurikenSkill = data.splice(0, 1);
        $scope.skills = data;
    });
    $scope.gameState = gameState;
    $scope.chosenSkills = [];
    $scope.selectedCount = 0;

    $scope.selectSkill = function($event, skill) {
        var checkbox = event.target;
        if (checkbox.checked) {
            // Add the skill to the chosenSkills array.
            $scope.chosenSkills.push(skill);
        } else {
            // Remove the skill from the array.
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

    $scope.beginGame = function() {
        gameState.skills = $scope.chosenSkills;
        // Add Shurikenjutsu to the skills array.
        gameState.skills.push($scope.shurikenSkill[0]);
        gameState.entry = storyjson[gameState.currentEntry];
        $location.path("/story");
    };
}
//MyCtrl2.$inject = [];


function StoryCtrl($scope, $http, gameState, Story) {
    $scope.gameState = gameState;
    var storyjson = Story.get();

    $scope.swapEntry = function(entryID) {
        gameState.entry = storyjson[entryID.toString()];
        $scope.gameState = gameState;
    };
}
//StoryCtrl.$inject = [];

function EntryCtrl($scope, $routeParams, $http, gameState) {
    $scope.gameState = gameState;
    // Use the low-level $http service instead of $resource.
    $http.get('data/story.json').success(function(data) {
        // Each item in story.json is a dict of an entry's details.
        angular.forEach(data, function(item) {
            // Obtain the req'd entry no from the routeParams.
            if (item.entry == $routeParams.entry) {
                $scope.entry = item;
            };
        });
    });
}
//EntryCtrl.$inject = [];


function BackgroundCtrl() {}
//MyCtrl1.$inject = [];


