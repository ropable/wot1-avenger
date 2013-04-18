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
        // TODO: Persist gameState using localstorage.
        $location.path("/story");
    };
}
//NewGameCtrl.$inject = [];


function StoryCtrl($scope, $http, gameState, Story) {
    var storyjson = Story.get();
    $scope.gameState = gameState;
    $scope.entryImage = 'image' in gameState.entry;

    $scope.swapEntry = function(entryID) {
        gameState.entry = storyjson[entryID.toString()];
        $scope.gameState = gameState;
        $scope.entryImage = 'image' in gameState.entry;
    };
}
//StoryCtrl.$inject = [];


function BackgroundCtrl() {}
//BackgroundCtrl.$inject = [];


