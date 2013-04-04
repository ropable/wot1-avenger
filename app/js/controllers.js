'use strict';

/* Controllers */

function NewGameCtrl() {}
//MyCtrl2.$inject = [];


function StoryCtrl($scope, $http) {
  $http.get('data/story.json').success(function(data) {
    $scope.story = data;
  });
}
//StoryCtrl.$inject = [];


function BackgroundCtrl() {}
//MyCtrl1.$inject = [];


