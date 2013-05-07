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
    // Handle Fate rolls.
    if (gameState.entry.fate_roll) {
        if ((dieRoll(2) + gameState.fate) > 7 || gameState.cheatMode) {
            // First option is always the success.
            gameState.options.push(gameState.entry.options[0]);
        } else {
            gameState.options.push(gameState.entry.options[1]);
        };
    // Handle Shuriken rolls.
    } else if (gameState.entry.shuriken_roll) {
        if (dieRoll(2) > gameState.entry.shuriken_roll || gameState.cheatMode) {
            // First option is always the success.
            gameState.options.push(gameState.entry.options[0]);
        } else {
            gameState.options.push(gameState.entry.options[1]);
        };
    } else {
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
            } else if (option.prereq && option.prereq[0] == 'item') {
                // Exception: test if you have any Shuriken left.
                if (option.prereq[1] == 'Shuriken' && gameState.shuriken > 0) {
                    gameState.options.push(option);
                }
            } else {
                // No prerequesites.
                gameState.options.push(option);
            };
        });
    };
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
function NewGameCtrl($scope, $http, localStorageService, Story, Items, Opponents, $location, gameState) {
    // Get JSON for available skills to choose.
    var storyjson = Story.get();
    var itemsjson = Items.get();
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
        // Set starting entry number.
        gameState.currentEntry = '26';
        gameState.endurance = 20;
        // Get starting items.
        angular.forEach(itemsjson, function(item) {
            if (item.start) {
                item.count = 1;
                gameState.items.push(item);
            }
        });
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
        gameState.inProgress = true;
        // Persist gameState using localstorage.
        persistGameState(gameState, localStorageService);
        $location.path("/story");
    };
}
//NewGameCtrl.$inject = [];

function StoryCtrl($scope, $http, localStorageService, gameState, Story, Items, Opponents, Notes) {
    var storyjson = Story.get();
    var opponentsjson = Opponents.get();
    var itemsjson = Items.get();
    var notesjson = Notes.get();
    readGameState(gameState, localStorageService);
    $scope.gameState = gameState;

    $scope.chooseEntry = function(option, useInnerForce) {
        // Set gameState to the new entry.
        gameState.currentEntry = option.entry;
        gameState.entry = storyjson[option.entry.toString()];
        gameState.entryText = textMarkup(gameState.entry.description);
        gameState.hasEntryImage = 'image' in gameState.entry;
        var actionText = '';
        gameState.actions = [];
        // Set options for which the prerequisites are met.
        validEntryChoices(gameState);
        // Add any new opponents.
        angular.forEach(gameState.entry.opponents, function(o) {
            if (o in opponentsjson) {
                gameState.currentOpponents.push(opponentsjson[o]);
            };
        });
        // Set combat timer, if required.
        if (gameState.entry.combat_timer) {
            gameState.combatTimer = gameState.entry.combat_timer;
        };
        // Apply any attack modifers gained/lost to gameState.
        if (gameState.entry.attack_modifier) {
            gameState.attackModifierTemp = gameState.entry.attack_modifier;
        };
        // Apply damage to opponents or player.
        if (gameState.entry.damage_opponent) {
            angular.forEach(gameState.entry.damage_opponent, function(damage) {
                angular.forEach(gameState.currentOpponents, function(opp) {
                    if (damage[0] == opp.name) {
                        // Damage might be random, or fixed.
                        if (damage[1] == 'random') {
                            var dam = dieRoll(damage[2][0]) + damage[2][1];
                        } else {
                            var dam = damage[2];
                        };
                        opp.endurance -= dam;
                    };
                });
            });
        };
        if (gameState.entry.damage_player && !gameState.cheatMode) {
            angular.forEach(gameState.entry.damage_player, function(damage) {
                // Damage might be random, or fixed.
                if (damage[1] == 'random') {
                    var dam = dieRoll(damage[2][0]) + damage[2][1];
                } else {
                    var dam = damage[2];
                };
                // Damage might be to endurance, or combat modifiers.
                if (damage[0] == "endurance") {
                    gameState.endurance -= dam;
                } else if (damage[0] == "kick") {
                    gameState.kick -= dam;
                };
            });
        };
        // Handle different types of options.
        // type == null indicates a change of entry (no action).
        if (option.type == 'offence') {  // Offence can be punch, kick or throw.
            // TODO: allow player to choose a target if several exist.
            var target = gameState.currentOpponents[0];
            // Decrement combat timer, if required.
            if (gameState.combatTimer) {
                gameState.combatTimer -= 1;
            };
            if (option.action == 'punch') {
                // Check 2d6 + attack modifer against target defence.
                if ((dieRoll(2) + gameState.punch + gameState.attackModifierTemp) > target.defence_punch || gameState.cheatMode) {
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
                    actionText = actionText.replace('{0}', target.action_desc);
                    actionText = actionText.replace('{1}', damage.toString());
                    gameState.actions.push([actionText])
                } else {
                    actionText = 'You punch at {0}...and miss!'.replace('{0}', target.action_desc);
                    gameState.actions.push([actionText])
                };
            } else if (option.action == 'kick') {
                // Check 2d6 + attack modifer against target defence.
                if ((dieRoll(2) + gameState.kick + gameState.attackModifierTemp) > target.defence_kick || gameState.cheatMode) {
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
                    actionText = actionText.replace('{0}', target.action_desc);
                    actionText = actionText.replace('{1}', damage.toString());
                    gameState.actions.push([actionText])
                } else {
                    actionText = 'You kick at {0}...and miss!'.replace('{0}', target.action_desc);
                    gameState.actions.push([actionText])
                };
            } else {
                if ((dieRoll(2) + gameState.throw) > target.defence_throw || gameState.cheatMode) {
                    // Occasionally, throws can result in your one-shotting opponents.
                    if (gameState.entry.instakill) {
                        gameState.actions.push([gameState.entry.instakill_desc]);
                        gameState.currentOpponents[0].endurance = 0;
                        gameState.options = [];
                    } else {
                        actionText = 'You throw {0} to the ground!'.replace('{0}', target.action_desc);
                        gameState.attackModifierTemp = 2;  // Next attack will be easier.
                        gameState.currentOpponents[0].damage_mod = 2;  // Next attack will do more damage.
                        gameState.currentOpponents[0].effects = 'thrown';  // Thrown opponents can't attack.
                        gameState.actions.push([actionText]);
                    };
                } else {
                    actionText = 'You try to throw {0}...and fail!'.replace('{0}', target.action_desc);
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
                if (o.effects == 'thrown') {  // Thrown opponents can't attack.
                    o.effects = null;
                } else {
                    // Check 2d6 against player_defence.
                    if (dieRoll(2) > gameState.entry.player_defence && !gameState.cheatMode) {
                        var damage = (dieRoll(o.damage[0]) + o.damage[1]);
                        actionText += '{0} hits you for {1} damage!'.replace('{0}', o.action_desc);
                        actionText = actionText.replace('{1}', damage.toString());
                        gameState.endurance -= damage;
                        // Push to actions: [actionText, true, damage, player_defence]
                        gameState.actions.push([actionText, true, damage, gameState.entry.player_defence])
                    } else {
                        actionText += '{0} tries to hit you...but misses!'.replace('{0}', o.action_desc);
                        gameState.actions.push([actionText])
                    };
                };
                // Handle player defeat (endurance/combat timer).
                if (gameState.combatTimer == 0 && gameState.currentOpponents.length > 0) {
                    gameState.actions.push(['You have run out of time!']);
                    gameState.options = [{"text": "Continue", "entry": gameState.entry.defeat}];
                };
                if (gameState.endurance <= 0) {
                    gameState.actions.push(['You have been defeated!']);
                    if (gameState.entry.defeat) {  // Defeat leads to another entry.
                        gameState.options = [{"text": "Continue", "entry": gameState.entry.defeat}];
                    } else {  // Defeat results in death.
                        gameState.options = [{"text": "Continue", "entry": 'death'}];
                        gameState.endurance = 0;
                        gameState.inProgress = false;
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
        // Restore endurance.
        if (gameState.entry.heal_player) {
            var total = gameState.entry.heal_player + gameState.endurance;
            if (total >= 20) {
                gameState.endurance = 20;
            } else {
                gameState.endurance = total;
            };
        };
        // Phat loot!
        if (gameState.entry.loot_add) {
            angular.forEach(gameState.entry.loot_add, function(loot) {
                var owned = false;
                // Find out if the loot exists in the inventory already.
                // If so, increment the count.
                angular.forEach(gameState.items, function(item) {
                    if (item.name == loot[0]) {
                        item.count += loot[1];
                        owned = true;
                    };
                });
                // We don't already own this.
                if (!owned) {
                    var newitem = itemsjson[loot[0]];
                    newitem.count = loot[1];
                    gameState.items.push(newitem);
                };
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
        // Losing equipment (captured, etc).
        if (gameState.entry.lose_equipment) {
            // Place equipment in a holding variable.
            gameState.lost_equipment = gameState.items;
            gameState.items = [];
            gameState.lost_shuriken = gameState.shuriken;
            gameState.shuriken = 0;
        };
        // Regaining equipment.
        if (gameState.entry.regain_equipment) {
            gameState.items = gameState.lost_equipment;
            gameState.lost_equipment = [];
            gameState.shuriken = gameState.lost_shuriken;
            gameState.lost_shuriken = 0;
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
