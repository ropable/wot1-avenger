'use strict';

/* Controllers */

function NewGameCtrl($scope, $http, Story, Opponents, $location, gameState) {
    // Get JSON for available skills to choose.
    var storyjson = Story.get();
    var opponentsjson = Opponents.get();
    var converter = new Showdown.converter();
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
        gameState.entryText = converter.makeHtml(gameState.entry.description);
        gameState.hasEntryImage = 'image' in gameState.entry;
        // Add opponents
        angular.forEach(gameState.entry.opponents, function(o) {
            if (o in opponentsjson) {
                gameState.currentOpponents.push(opponentsjson[o]);
            };
        });
        // TODO: Persist gameState using localstorage.
        $location.path("/story");
    };
}
//NewGameCtrl.$inject = [];


function StoryCtrl($scope, $http, gameState, Story, Opponents) {
    var storyjson = Story.get();
    var converter = new Showdown.converter();
    $scope.gameState = gameState;

    $scope.chooseEntry = function(option) {
        // Handle different types of options.
        // type == null indicates a change of entry (no action).
        if (option.type == 'offense') {
            // TODO: handle modifers.
            if (option.action == 'punch') {
                gameState.actionText = 'You punch the guy!';
            } else if (option.action == 'kick') {
                gameState.actionText = 'You kick the guy!';
            } else {
                gameState.actionText = 'You throw the guy!';
            };
        };
        // TODO:: opponent is still alive, they attack back.

        // Set gameState to the new entry.
        gameState.entry = storyjson[option.entry.toString()];
        gameState.entryText = converter.makeHtml(gameState.entry.description);
        gameState.hasEntryImage = 'image' in gameState.entry;
        $scope.gameState = gameState;
    };
}
//StoryCtrl.$inject = [];


function BackgroundCtrl() {}
//BackgroundCtrl.$inject = [];


