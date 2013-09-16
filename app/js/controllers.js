'use strict';

/* Utility functions */
var dieRoll = function(n) {
    // Return the total of nd6.
    // We only roll d6 in this adventure.
    var total = 0;
    for (var i = 0; i < n; i++){
        total += Math.floor(Math.random() * 6 + 1);
    }
    return total;
};

var textMarkup = function(text) {
    // Accepts Markdown-formatted text string, returns HTML.
    // Probably should have done an Angular directive for this.
    var converter = new Showdown.converter();
    return converter.makeHtml(text);
};

function capitaliseFirstLetter(string) {
    // Accepts and returns a string with the first letter as a capital.
    return string.charAt(0).toUpperCase() + string.slice(1);
};

var validEntryChoices = function(gameState) {
    // Accepts gameState, and returns it with options for which
    // all of the prerequisites are met.
    // Assumes that gameState.entry has been set.
    gameState.options = [];
    var prereq_met = false;
    // Handle Fate rolls.
    if (gameState.entry.fate_roll) {
        if ((dieRoll(2) + gameState.fate) > 7 || gameState.cheatMode) {
            // First option is always the success.
            gameState.options.push(gameState.entry.options[0]);
        } else {
            gameState.options.push(gameState.entry.options[1]);
        };
    // Handle opponent defence roll (vs Shuriken, surprise attacks, etc).
    } else if (gameState.entry.opponent_defence_roll) {
        if (dieRoll(2) > gameState.entry.opponent_defence_roll || gameState.cheatMode) {
            // First option is always the success.
            gameState.options.push(gameState.entry.options[0]);
        } else {
            gameState.options.push(gameState.entry.options[1]);
        };
    // Handle player defence roll (vs attacks, traps, etc).
    } else if (gameState.entry.player_defence_roll) {
        if (dieRoll(2) < gameState.entry.player_defence_roll || gameState.cheatMode) {
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
            // Otherwise, where options have a prerequesite, test if this is met.
            } else if (option.prereq && option.prereq[0] == 'skill') {
                // Iterate over the chosenSkills array
                angular.forEach(gameState.skills, function(skill) {
                    if (option.prereq[1] == skill.name) {
                        gameState.options.push(option);
                        prereq_met = true;
                    };
                });
            } else if (option.prereq && option.prereq[0] == 'item') {
                angular.forEach(gameState.items, function(item) {
                    if (option.prereq[1] == item.name && item.count > 0) {
                        gameState.options.push(option);
                        prereq_met = true;
                    };
                });
            } else if (option.prereq && option.prereq[0] == 'inner_force') {
                if (gameState.innerForce > 0) {
                    gameState.options.push(option);
                    prereq_met = true;
                };
            } else {
                // No prerequesites - push the option into the array.
                gameState.options.push(option);
            };
        });
    };
    // Handle "Boolean options" - i.e. those with a prereqisite that allows one action.
    // This aims to be a little slicker than simply adding both options if the prereq is met,
    // given that the second option is always a negative consequence.
    // Assumes two options, and the first is always the one with the prereqisite.
    // If the prereq was met (or we're cheating), both options should be in the array now.
    if (gameState.entry.boolean_option && prereq_met) {
        gameState.options.pop();  // Pop the last (2nd) element out.
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
    // Controller for the "new game" page.
    var storyjson = Story.get();
    var itemsjson = Items.get();
    var opponentsjson = Opponents.get();
    // Get JSON for available skills to choose.
    $http.get('data/skills.json').success(function(data) {
        // Remove the first element: we always get Shurikenjutsu.
        $scope.shurikenSkill = data.splice(0, 1);
        $scope.skills = data;
    });
    $scope.gameState = gameState;
    $scope.chosenSkills = [];
    $scope.selectedCount = 0;

    // Function to push/pop skills from the chosenSkills array in gameState
    // when that skill in selected/deselected on the "New Game" page.
    // Also updates the scope variable chosenSkills, which governs whether
    // the skills checkboxes are enabled or not.
    $scope.selectSkill = function($event, skill) {
        // Alter the scope to modify the form used to choose start skills.
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
        // Returns true if a skill's form index is in the chosenSkills array.
        return $scope.chosenSkills.indexOf(skill) >= 0;
    };

    // Function to reset the gameState and redirect to the starting entry page.
    $scope.beginGame = function() {
        // Clear local storage, set start values, then initiate the first entry.
        localStorageService.clearAll();
        // Set starting entry number.
        gameState.currentEntry = '1';
        gameState.endurance = 20;
        // Get start items.
        gameState.items = [];
        // TODO: create a conf file for start variables.
        angular.forEach(itemsjson, function(item) {
            if (item.start) {
                item.count = 1;
                gameState.items.push(item);
            } else if (item.name == 'Shuriken') {
                item.count = 5;
                gameState.items.push(item);
            };
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
    // Controller for the "in progress" page.
    var storyjson = Story.get();
    var opponentsjson = Opponents.get();
    var itemsjson = Items.get();
    var notesjson = Notes.get();
    readGameState(gameState, localStorageService);
    $scope.gameState = gameState;
    var history = []; // Stores a history of serialised gameState objects.

    // Function to handle reverting to the previous entry in the history array.
    $scope.lastEntry = function() {
        gameState = JSON.parse(history.pop());
        $scope.gameState = gameState;
    };

    // Function to handle selection of the next entry option.
    // TODO: break this up into several functions (as for validEntryChoices).
    // TODO: function to handle modifying the player's endurance.
    // TODO: function to alter the player's inventory.
    // TODO: function to handle the player attacking an opponent.
    // TODO: function to handle an opponent attacking the player.
    $scope.chooseEntry = function(option, useInnerForce) {
        console.log(option);
        // Pickle the current gameState and push it into the history array.
        history.push(JSON.stringify(gameState));
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
        // Add new allies.
        if (gameState.entry.allies) {
            gameState.allies = gameState.entry.allies;
        };
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
                var note = 'You have lost {0} {1}!';
                // Damage might be random, or fixed.
                if (damage[1] == 'random') {
                    var dam = dieRoll(damage[2][0]) + damage[2][1];
                } else {
                    var dam = damage[2];
                };
                note = note.replace('{0}', dam);
                // Damage might be to endurance, or combat modifiers.
                if (damage[0] == 'endurance') {
                    gameState.endurance -= dam;
                    note = note.replace('{1}', 'endurance');
                } else if (damage[0] == 'kick') {
                    gameState.kick -= dam;
                    note = note.replace('{1}', 'kick modifier');
                };
                $.pnotify({text: note});
            });
        };
        // COMBAT!
        if (option.type == 'offence') {  // Offence can be punch, kick or throw.
            // TODO: allow player to choose a target if several exist.
            var target = gameState.currentOpponents[0];
            var hitOpponent = false;
            // Decrement combat timer, if required.
            if (gameState.combatTimer) {
                gameState.combatTimer -= 1;
            };
            if (option.action == 'punch') {
                // Check 2d6 + attack modifer against target defence.
                if ((dieRoll(2) + gameState.punch + gameState.attackModifierTemp) > target.defence_punch || gameState.cheatMode) {
                    hitOpponent = true;
                    var damage = dieRoll(1);
                    // Handle Inner Force modifer.
                    if (useInnerForce) {
                        damage *= 2;
                    };
                    if (target.damage_mod) { // i.e. damage_mod is not 0.
                        damage += target.damage_mod;
                        gameState.currentOpponents[0].damage_mod = 0;
                    };
                    if (target.player_damage_mod) {  // Alter the amount of damage that the player deals.
                        damage += target.player_damage_mod;
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
                    hitOpponent = true;
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
            } else if (option.action == 'throw') {
                if ((dieRoll(2) + gameState.throw) > target.defence_throw || gameState.cheatMode) {
                    hitOpponent = true;
                    // Occasionally, throws can result in your one-shotting opponents.
                    if (gameState.entry.instakill_throw) {
                        gameState.actions.push([gameState.entry.instakill_desc]);
                        gameState.currentOpponents = [];
                        gameState.options = [];
                    } else {
                        actionText = 'You throw {0} to the ground!'.replace('{0}', target.action_desc);
                        gameState.attackModifierTemp = 2;  // Next attack will be easier.
                        gameState.currentOpponents[0].damage_mod = 2;  // Next attack will do more damage.
                        gameState.currentOpponents[0].effects.push('thrown');  // Thrown opponents can't attack.
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
            if (gameState.currentOpponents.length > 0 && gameState.currentOpponents[0].endurance <= 0) {
                // TODO: handle different targets.
                // For now we just attack the first in line.
                gameState.currentOpponents.splice(0, 1);
            };
            // Allied offence.
            // Allies will attack the first living opponent in line, after the player.
            if (gameState.allies && gameState.currentOpponents.length > 0) {
                angular.forEach(gameState.allies, function(ally) {
                    target = gameState.currentOpponents[0];
                    if (dieRoll(2) > target.defence_ally ) {
                        var damage = dieRoll(ally[1]) + ally[2];
                        if (target.damage_mod) {
                            damage += target.damage_mod;
                            gameState.currentOpponents[0].damage_mod = 0;
                        };
                        gameState.currentOpponents[0].endurance -= damage;
                        actionText = '{0} attacks {1} and hits for {2} damage!';
                        actionText = actionText.replace('{0}', ally[0]);
                        actionText = actionText.replace('{1}', target.name);
                        actionText = actionText.replace('{2}', damage.toString());
                        gameState.actions.push([actionText]);
                    } else {
                        actionText = '{0} attacks {1} and misses!';
                        actionText = actionText.replace('{0}', ally[0]);
                        actionText = actionText.replace('{1}', target.name);
                        gameState.actions.push([actionText]);
                    };
                });
            };
            // Target's endurance is reduced to 0 or less.
            if (gameState.currentOpponents.length > 0 && gameState.currentOpponents[0].endurance <= 0) {
                gameState.currentOpponents.splice(0, 1);
            };
            // If we've taken an offensive action and there are no opponents left alive,
            // then we must have won!
            // Replace entry options with a single "Continue".
            // Also assume that allies are removed after winning a combat.
            if (gameState.currentOpponents.length == 0) {
                gameState.options = [{"text": "Continue", "entry": gameState.entry.victory}];
                gameState.actions.push(['You have won this combat!'])
                gameState.allies = [];
            };
            // Opponent offence.
            var hasBlocked = false;
            angular.forEach(gameState.currentOpponents, function(o) {
                // Handle the stupid Cobra Man's instant-kill attack.
                if (o.name == 'Cobra Man' && !hitOpponent) {
                    gameState.options = [{"text": "Continue", "entry": "412"}];
                } else {
                    // Handle EVERYONE ELSE. OH GOD I SHOULD BREAK THIS FUNCTION UP NOW. CBF.
                    actionText = '';
                    if (o.effects.indexOf('thrown') > -1) {  // Thrown opponents can't attack.
                        o.effects.splice(o.effects.indexOf('thrown'), 1);
                    } else {
                        // Check 2d6 against player_defence.
                        var defence;
                        if (gameState.entry.player_defence instanceof Array) {
                            // Count opponents. Use this count to obtain the defence value.
                            defence = gameState.entry.player_defence[gameState.currentOpponents.length - 1];
                        } else {
                            defence = gameState.entry.player_defence;
                        };
                        if (dieRoll(2) > defence && !gameState.cheatMode) {
                            var damage = (dieRoll(o.damage[0]) + o.damage[1]);
                            actionText += '{0} hits you for {1} damage!'.replace('{0}', o.action_desc);
                            actionText = actionText.replace('{1}', damage.toString());
                            actionText = capitaliseFirstLetter(actionText);
                            gameState.endurance -= damage;
                            // Not all attacks can be blocked.
                            // Use unblockable_attack = true if once-off, else set 'unblockable' in the
                            // opponent effects array.
                            var blockable = true;
                            if (o.effects.indexOf('unblockable') > -1 || gameState.entry.unblockable_attack) {
                                blockable = false;
                            };
                            // Push to actions to allow for blocking: [actionText, true, damage, defence]
                            // Player may only try to block the first successful hit.
                            // TODO: allow selective blocking.
                            if (!hasBlocked && blockable) {
                                gameState.actions.push([actionText, true, damage, defence]);
                            } else {
                                gameState.actions.push([actionText]);
                            };
                            hasBlocked = true;
                        } else {
                            actionText += '{0} tries to hit you...but misses!'.replace('{0}', o.action_desc);
                            actionText = capitaliseFirstLetter(actionText);
                            gameState.actions.push([actionText]);
                        };
                    };
                };
            });  // End opponent offence.
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
        // Some entries can result in instant victory, against all opponents.
        if (gameState.entry.instakill) {
            gameState.currentOpponents = [];
        };
        // Restore or reduce endurance.
        // Note that might need to modify gameState.entryText if damage is dealt but the
        // player is still alive.
        if (gameState.entry.modify_endurance && !gameState.cheatMode) {
            if (gameState.entry.modify_endurance > 0) {
                // Add a notification.
                $.pnotify({
                    text: 'You have gained # endurance!'.replace('#', gameState.entry.modify_endurance),
                    type: 'success',
                    icon: false
                });
            } else {
                $.pnotify({
                    text: 'You have lost # endurance!'.replace('#', Math.abs(gameState.entry.modify_endurance)),
                    type: 'error',
                    icon: false
                });
            };
            var total = gameState.endurance + gameState.entry.modify_endurance;
            if (total > 20) {
                gameState.endurance = 20;
            } else if (total < 0) {
                gameState.endurance = 0;
            } else {
                gameState.endurance = total;
            };
        };
        // Alter Inner Force.
        if (gameState.entry.modify_inner_force && !gameState.cheatMode) {
            var total = gameState.innerForce + gameState.entry.modify_inner_force;
            if (total > 5) {
                gameState.innerForce = 5;
            } else if (total < 0) {
                gameState.innerForce = 0;
            } else {
                gameState.innerForce = total;
            };
            if (gameState.entry.modify_inner_force > 0) {
                $.pnotify({
                    text: 'You have gained # Inner Force!'.replace('#', gameState.entry.modify_inner_force),
                    type: 'success',
                    icon: false
                });
            } else {
                $.pnotify({
                    text: 'You have lost # Inner Force!'.replace('#', gameState.entry.modify_inner_force),
                    type: 'error',
                    icon: false
                });
            };
        };
        var entryText = gameState.entryText;
        // Handle player defence against basic injury (may result in death).
        if (gameState.entry.player_defence_vs_injury) {
            var d = gameState.entry.player_defence_vs_injury;
            if (dieRoll(2) < d[0] || gameState.cheatMode) {
                // Success - no damage.
                entryText = gameState.entry.description + '\n\nYou avoid the attack!';
            } else {
                // Ouch!
                var damage = (dieRoll(d[1]) + d[2]);
                gameState.endurance -= damage;
                entryText = gameState.entry.description + '\n\nYou are hit for {0} damage!'.replace('{0}', damage);
            };
        };
        // Handle player death following damage (replace entry options).
        // Add "damage_followup" to the entry text if the player is still alive.
        if (gameState.endurance <= 0) {
            gameState.options = [{"text": "Continue", "entry": 'death'}];
            gameState.endurance = 0;
            gameState.inProgress = false;
        } else {  // Player is still alive - alter the entry text if req'd.
            if (gameState.entry.damage_followup) {
                entryText = entryText + '\n\n' + gameState.entry.damage_followup;
            };
        };
        // (Re)set entry text.
        gameState.entryText = textMarkup(entryText);
        // Phat loot!
        if (gameState.entry.loot_add) {
            angular.forEach(gameState.entry.loot_add, function(loot) {
                // Add a notification.
                $.pnotify({
                    text: 'You have gained a #'.replace('#', loot[0]),
                    type: 'success',
                    icon: false
                });
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
        if (gameState.entry.loot_remove) {
            angular.forEach(gameState.entry.loot_remove, function(loot) {
                // Add a notification.
                $.pnotify({
                    text: 'You have lost a #'.replace('#', loot[0])
                });
                angular.forEach(gameState.items, function(item) {
                    if (item.name == loot[0]) {
                        item.count -= loot[1];
                        if (item.count < 0) {
                            item.count = 0;  // Set item count to 0 if we've managed to go below that somehow.
                        };
                    };
                });
            });
        };
        // Some sequences require that specific items are held away from the
        // player temporarily (until combat is finished, etc).
        // In hindsight, I should have used this to handle shuriken :/
        if (gameState.entry.loot_hold) {
            angular.forEach(gameState.entry.loot_hold, function(loot) {
                angular.forEach(gameState.items, function(item) {
                    if (item.name == loot) {
                        gameState.held_loot.push(item);
                        item.count = 0;
                    };
                });
            });
        };
        // Restore those items.
        if (gameState.entry.loot_held_restore) {
            angular.forEach(gameState.held_loot, function(loot) {
                angular.forEach(gameState.items, function(item) {
                    if (item.name == loot) {
                        item.count = loot.count;
                    };
                });
            });
            gameState.held_loot = [];
        };
        // Losing all equipment (captured, etc).
        if (gameState.entry.lose_equipment) {
            // Add a notification.
            $.pnotify({text: 'You have lost all your equipment!'});
            gameState.lost_equipment = gameState.items;
            gameState.items = [];
        };
        // Regaining all equipment.
        if (gameState.entry.regain_equipment) {
            $.pnotify({text: 'You have regained all your equipment!'});
            gameState.items = gameState.lost_equipment;
            gameState.lost_equipment = [];
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
        // Alter player modifiers.
        if (gameState.entry.player_modifier) {
            if (gameState.entry.player_modifier[0] == "fate") {
                gameState.fate += gameState.entry.player_modifier[1];
            } else if (gameState.entry.player_modifier[0] == "punch") {
                gameState.punch += gameState.entry.player_modifier[1];
            } else if (gameState.entry.player_modifier[0] == "kick") {
                gameState.kick += gameState.entry.player_modifier[1];
            } else if (gameState.entry.player_modifier[0] == "throw") {
                gameState.throw += gameState.entry.player_modifier[1];
            };
        };
        // HANDLING EVENTS END.
        persistGameState(gameState, localStorageService);
    };

    $scope.useItem = function(item) {
        // Use inventory items: typically healing items which can only
        // be used outside combat.
        // TODO: add an 'in combat' flag to entries.
        if (item.endurance) {
            var total = gameState.endurance + item.endurance;
            if (total > 20) {
                gameState.endurance = 20;
            } else {
                gameState.endurance += item.endurance;
            };
            item.count -= 1;
        };
    };

    $scope.blockAttack = function(action) {
        // Handle blocking: the action array contains the action text plus the damage taken.
        // action: [actionText, true, damage, player_defence]
        // Test if the block in successful (player_defence). If so, reverse the damage and
        // update the action text.
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
