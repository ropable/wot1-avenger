'use strict';

var dieRoll = function(n) {
    // Return the total of nd6.
    var total = 0;
    for (var i = 0; i < n; i++){
        total += Math.floor(Math.random() * 6 + 1);
    }
    return total;
};


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
        gameState.options = gameState.entry.options;
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

    $scope.chooseEntry = function(option, useInnerForce) {
        // Set gameState to the new entry.
        gameState.currentEntry = option.entry;
        gameState.entry = storyjson[option.entry.toString()];
        gameState.hasEntryImage = 'image' in gameState.entry;
        gameState.options = gameState.entry.options;
        // Apply any attack modifers gained/lost to gameState.
        if (gameState.entry.attack_modifier) {
            gameState.attackModifierTemp = gameState.entry.attack_modifier;
        };
        var actionText = '';
        // Handle different types of options.
        // type == null indicates a change of entry (no action).
        if (option.type == 'offence') {  // Offence can be punch, kick or throw.
            var target = gameState.currentOpponents[0];  // TODO: allow player to choose target.
            // TODO: handle persistent modifers, such as modifier following a block.
            if (option.action == 'punch') {
                // Check 2d6 + attack modifer against target defence.
                if ((dieRoll(2) + gameState.punch + gameState.attackModifierTemp) > target.defence_punch) {
                    var damage = dieRoll(1);
                    // Handle Inner Force modifer.
                    if (useInnerForce) {
                        damage *= 2;
                    };
                    if (target.damage_mod) { // i.e. damage_mod is not 0.
                        damage += target.damage_mod;
                        gameState.currentOpponents[0].damage_mod = 0;
                    };
                    gameState.currentOpponents[0].endurance -= damage;
                    actionText = 'You punch {0} and hit for {1} damage!';
                    actionText = actionText.replace('{0}', target.name);
                    actionText = actionText.replace('{1}', damage.toString());
                } else {
                    actionText = 'You punch at {0}...and miss!'.replace('{0}', target.name);
                };
            } else if (option.action == 'kick') {
                // Check 2d6 + attack modifer against target defence.
                if ((dieRoll(2) + gameState.kick + gameState.attackModifierTemp) > target.defence_kick) {
                    var damage = dieRoll(1) + 2;  // Kicks do more damage.
                    // Handle Inner Force modifer.
                    if (useInnerForce) {
                        damage *= 2;
                    };
                    if (target.damage_mod) { // i.e. damage_mod is not 0.
                        damage += target.damage_mod;
                        gameState.currentOpponents[0].damage_mod = 0;
                    };
                    gameState.currentOpponents[0].endurance -= damage;
                    actionText = 'You kick {0} and hit for {1} damage!';
                    actionText = actionText.replace('{0}', target.name);
                    actionText = actionText.replace('{1}', damage.toString());
                } else {
                    actionText = 'You kick at {0}...and miss!'.replace('{0}', target.name);
                };
            } else {
                if ((dieRoll(2) + gameState.throw) > target.defence_throw) {
                    actionText = 'You throw {0} to the ground!'.replace('{0}', target.name);
                    gameState.currentOpponents[0].damage_mod = 2;  // Next attack will do more damage.
                } else {
                    actionText = 'You try to throw {0}...and fail!'.replace('{0}', target.name);
                };
            };
            // Subtract Inner Force.
            if (useInnerForce) {
                gameState.innerForce -= 1;
            };
            gameState.attackModifierTemp = 0;  // Always resets, after an attack.
            // Target's endurance is reduced to 0 or less.
            if (gameState.currentOpponents[0].endurance <= 0) {
                // TODO: handle different targets.
                // For now we jsut attack the first in line.
                gameState.currentOpponents.splice(0, 1);
            };
            // If we've taken an offensive action and there are no opponents left alive,
            // then we must have won!
            // Replace entry options with a single "Continue".
            if (gameState.currentOpponents.length == 0) {
                gameState.options = [{"text": "Continue", "entry" : gameState.entry.victory}];
                actionText += '<br>You have won this combat!';
            };
            // Opponent offence.
            angular.forEach(gameState.currentOpponents, function(o) {
                // Check 2d6 against player_defence.
                if (dieRoll(2) > gameState.entry.player_defence) {
                    var damage = (dieRoll(o.damage[0]) + o.damage[1]);
                    actionText += '<br>{0} hits you for {1} damage!'.replace('{0}', o.name);
                    actionText = actionText.replace('{1}', damage.toString());
                    gameState.endurance -= damage;
                    // TODO: handle player defeat/death.
                } else {
                    actionText += '<br>{0} tries to hit you...but misses!'.replace('{0}', o.name);
                };
            });  // End opponent offence.
        };  // End player offence.
        // Render any additional text for actions.
        gameState.actionText = actionText;
        gameState.entryText = converter.makeHtml(gameState.entry.description);
        // Entries may occasionally manually remove opponents.
        if (gameState.entry.opponent_remove) {
            for (var i = 0; i < gameState.currentOpponents.length; i++) {
                if (gameState.currentOpponents[i].name == gameState.entry.opponent_remove) {
                    gameState.currentOpponents.splice(i, 1);
                };
            };
        };
        // Finally, set scope gameState.
        $scope.gameState = gameState;
    };
}
//StoryCtrl.$inject = [];


function BackgroundCtrl() {}
//BackgroundCtrl.$inject = [];


