'use strict';

/* Utility functions */
var dieRoll = function(n) {
    // Return the total of nd6.
    var total = 0;
    for (var i = 0; i < n; i++){
        total += Math.floor(Math.random() * 6 + 1);
    }
    return total;
};

var textMarkup = function(text) {
    // Accepts Markdown-formatted text string, returns HTML.
    var converter = new Showdown.converter();
    return converter.makeHtml(text);
};

var validEntryChoices = function(gameState) {
    // Accepts gameState, and returns it with options for which
    // all of the prerequisites are met.
    // Assumes that gameState.entry has been set.
    gameState.options = [];
    angular.forEach(gameState.entry.options, function(option) {
        if (gameState.cheatMode) {
            // If we're cheating, enable all options always.
            gameState.options.push(option);
        } else if (option.prereq && option.prereq[0] == 'skill') {
            // Iterate over the chosenSkills array
            angular.forEach(gameState.skills, function(skill) {
                if (option.prereq[1] == skill.name) {
                    gameState.options.push(option);
                };
            });
        } else {
            // No prerequesites.
            gameState.options.push(option);
        };
    });
};

var persistGameState = function(gameState, localStorageService) {
    // Write gameState dictionary to localstorage.
    for (var key in gameState) {
        if (gameState.hasOwnProperty(key)) {
            //console.log(JSON.stringify(gameState[key]));
            localStorageService.add(key, JSON.stringify(gameState[key]));
        };
    };
};

var readGameState = function(gameState, localStorageService) {
    // Read gameState dictionary from localstorage.
    for (var key in gameState) {
        if (gameState.hasOwnProperty(key)) {
            //console.log(JSON.parse(localStorageService.get(key)));
            gameState[key] = JSON.parse(localStorageService.get(key));
        };
    };
};


/* Controllers */
function NewGameCtrl($scope, $http, localStorageService, Story, Opponents, $location, gameState) {
    // Get JSON for available skills to choose.
    var storyjson = Story.get();
    var opponentsjson = Opponents.get();
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
        localStorageService.clearAll();
        gameState.currentEntry = '1';
        gameState.endurance = 20;
        gameState.skills = $scope.chosenSkills;
        // Add Shurikenjutsu to the skills array.
        gameState.skills.push($scope.shurikenSkill[0]);
        gameState.entry = storyjson[gameState.currentEntry];
        gameState.entryText = textMarkup(gameState.entry.description);
        gameState.hasEntryImage = 'image' in gameState.entry;
        // Set options for which the prerequisites are met.
        validEntryChoices(gameState);
        // Add opponents
        gameState.currentOpponents = [];
        angular.forEach(gameState.entry.opponents, function(o) {
            if (o in opponentsjson) {
                gameState.currentOpponents.push(opponentsjson[o]);
            };
        });
        // Persist gameState using localstorage.
        persistGameState(gameState, localStorageService);
        $location.path("/story");
    };
}
//NewGameCtrl.$inject = [];

function StoryCtrl($scope, $http, localStorageService, gameState, Story, Opponents, Loot, Notes) {
    var storyjson = Story.get();
    var opponentsjson = Opponents.get();
    var lootjson = Loot.get();
    var notesjson = Notes.get();
    readGameState(gameState, localStorageService);
    $scope.gameState = gameState;

    $scope.chooseEntry = function(option, useInnerForce) {
        // Set gameState to the new entry.
        gameState.currentEntry = option.entry;
        gameState.entry = storyjson[option.entry.toString()];
        gameState.entryText = textMarkup(gameState.entry.description);
        gameState.hasEntryImage = 'image' in gameState.entry;
        // Set options for which the prerequisites are met.
        validEntryChoices(gameState);
        // Apply any attack modifers gained/lost to gameState.
        if (gameState.entry.attack_modifier) {
            gameState.attackModifierTemp = gameState.entry.attack_modifier;
        };
        var actionText = '';
        gameState.actions = [];
        // Handle different types of options.
        // type == null indicates a change of entry (no action).
        if (option.type == 'offence') {  // Offence can be punch, kick or throw.
            var target = gameState.currentOpponents[0];  // TODO: allow player to choose target.
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
                    gameState.actions.push([actionText])
                } else {
                    actionText = 'You punch at {0}...and miss!'.replace('{0}', target.name);
                    gameState.actions.push([actionText])
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
                    //TODO
                    gameState.currentOpponents[0].endurance -= damage;
                    actionText = 'You kick {0} and hit for {1} damage!';
                    actionText = actionText.replace('{0}', target.name);
                    actionText = actionText.replace('{1}', damage.toString());
                    gameState.actions.push([actionText])
                } else {
                    actionText = 'You kick at {0}...and miss!'.replace('{0}', target.name);
                    gameState.actions.push([actionText])
                };
            } else {
                if ((dieRoll(2) + gameState.throw) > target.defence_throw) {
                    actionText = 'You throw {0} to the ground!'.replace('{0}', target.name);
                    gameState.currentOpponents[0].damage_mod = 2;  // Next attack will do more damage.
                    gameState.actions.push([actionText])
                } else {
                    actionText = 'You try to throw {0}...and fail!'.replace('{0}', target.name);
                    gameState.actions.push([actionText])
                };
            };
            // Subtract Inner Force.
            if (useInnerForce && !gameState.cheatMode) {
                gameState.innerForce -= 1;
            };
            gameState.attackModifierTemp = 0;  // Always resets, after an attack.
            // Target's endurance is reduced to 0 or less.
            if (gameState.currentOpponents[0].endurance <= 0) {
                // TODO: handle different targets.
                // For now we just attack the first in line.
                gameState.currentOpponents.splice(0, 1);
            };
            // If we've taken an offensive action and there are no opponents left alive,
            // then we must have won!
            // Replace entry options with a single "Continue".
            if (gameState.currentOpponents.length == 0) {
                gameState.options = [{"text": "Continue", "entry": gameState.entry.victory}];
                gameState.actions.push(['You have won this combat!'])
            };
            // Opponent offence.
            actionText = '';
            angular.forEach(gameState.currentOpponents, function(o) {
                // Check 2d6 against player_defence.
                if (dieRoll(2) > gameState.entry.player_defence && !gameState.cheatMode) {
                    var damage = (dieRoll(o.damage[0]) + o.damage[1]);
                    actionText += '{0} hits you for {1} damage!'.replace('{0}', o.name);
                    actionText = actionText.replace('{1}', damage.toString());
                    gameState.endurance -= damage;
                    // Push to actions: [actionText, true, damage, player_defence]
                    gameState.actions.push([actionText, true, damage, gameState.entry.player_defence])
                } else {
                    actionText += '{0} tries to hit you...but misses!'.replace('{0}', o.name);
                    gameState.actions.push([actionText])
                };
                // Handle player defeat.
                if (gameState.endurance <= 0) {
                    gameState.actions.push(['You have been defeated!']);
                    if (gameState.entry.defeat) {  // Defeat leads to another entry.
                        gameState.options = [{"text": "Continue", "entry": gameState.entry.defeat}];
                    } else {  // Defeat == death,
                        gameState.options = [{"text": "Continue", "entry": 'death'}];
                        gameState.endurance = 0;
                    };
                };
            });  // End opponent offence.
        };  // End player offence.
        // HANDLING EVENTS BEGINS HERE.
        // Entries may occasionally manually remove opponents.
        if (gameState.entry.opponent_remove) {
            for (var i = 0; i < gameState.currentOpponents.length; i++) {
                if (gameState.currentOpponents[i].name == gameState.entry.opponent_remove) {
                    gameState.currentOpponents.splice(i, 1);
                };
            };
        };
        // Phat loot!
        if (gameState.entry.loot_add) {
            angular.forEach(gameState.entry.loot_add, function(loot) {
                gameState.items.push(lootjson[loot]);
            });
        };
        // Notes
        if (gameState.entry.note_add) {
            angular.forEach(gameState.entry.note_add, function(note) {
                gameState.notes.push(notesjson[note]);
            });
        };
        // Events
        if (gameState.entry.event_add) {
            angular.forEach(gameState.entry.event_add, function(evt) {
                gameState.events.push(evt);
            });
        };
        // HANDLING EVENTS END.
        persistGameState(gameState, localStorageService);
    };

    $scope.blockAttack = function(action) {
        // Handle blocking: the action array contains the action text plus the damage taken.
        // action: [actionText, true, damage, player_defence]
        // Test if the block in successful (player_defence). If so, reverse the damage and update the action text.
        if (dieRoll(2) < action[3]) {
            // Success!
            if (gameState.endurance <= 0) {  // We blocked a potentially fatal attack.
                gameState.actions.pop();  // Remove "You have been defeated!" from actions.
                gameState.options = gameState.entry.options;  // Restore the entry options.
            };
            gameState.endurance += action[2];
            action[0] += ' You blocked the attack!';
        } else {
            action[0] += ' You failed to block the attack!';
        }
        action[1] = false;
        gameState.attackModifierTemp = -2;  // Blocking penalises your next attack action.
        persistGameState(gameState, localStorageService);
    };

    // Finally, set scope gameState.
    $scope.gameState = gameState;

}
//StoryCtrl.$inject = [];
