'use strict';

/* Controllers */

function StoryCtrl($scope, $http) {
  $http.get('data/story.json').success(function(data) {
    $scope.story = data;
  });
}
//StoryCtrl.$inject = [];


function BackgroundCtrl() {}
//MyCtrl1.$inject = [];


function NewGameCtrl() {}
//MyCtrl2.$inject = [];
