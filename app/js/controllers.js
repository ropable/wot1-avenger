'use strict';

/* Controllers */

function TitleCtrl($scope, gameState) {

}
//TitleCtrl.$inject = [];


function NewGameCtrl($scope, $http, $location, gameState) {
    // Get JSON for available skills to choose.
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
        $location.path("/story/1");
    };
}
//MyCtrl2.$inject = [];


function StoryCtrl($scope, $http, Story) {
    $scope.story = Story.query();
}
//StoryCtrl.$inject = [];

function EntryCtrl($scope, $routeParams, $http, gameState) {
    $scope.gameState = gameState;
    // Use the low-level $http service instead of $resource.
    $http.get('data/story.json').success(function(data) {
        // Each item in story.json is a dict of an entry's details.
        var entry;
        angular.forEach(data, function(item) {
            // Obtain the req'd entry no from the routeParams.
            if (item.entry == $routeParams.entry) {
                entry = item;
            };
        });
        $scope.entry = entry;
        if ('image' in entry.data) {
            $scope.entryImage = true;
        } else {
            $scope.entryImage = false;
        };
        $scope.render = function(condition) {
           return condition ? '<img src="img/' + entry.data.image + '" class="pull-right"/>' : '';
        };
    });
}
//EntryCtrl.$inject = [];


function BackgroundCtrl() {}
//MyCtrl1.$inject = [];


