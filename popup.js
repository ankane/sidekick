/*jslint browser: true, indent: 2, plusplus: true */
/*global chrome, angular, $*/

(function () {
  'use strict';

  var testMode, myApp;

  testMode = false;
  myApp = angular.module("myApp", []);

  myApp.controller("ActionCtrl", ["$scope", function ($scope, $timeout) {
    var backgroundApp, permissions, startIndex;

    backgroundApp = chrome.extension.getBackgroundPage().app;

    $scope.actions = [];
    $scope.actionType = "click";
    $scope.errorMessage = null;
    $scope.step = null;
    $scope.running = false;
    $scope.hasPermission = true;

    if (localStorage.getItem("actions")) {
      $scope.actions = JSON.parse(localStorage.getItem("actions"));
    } else {
      $scope.actions = [
        {type: "open", selector: "google.com"},
        {type: "enter", selector: "Google Search", value: "get lucky youtube"},
        {type: "click", selector: "I'm Feeling Lucky"}
      ];
    }

    if (testMode) {
      $scope.actions = [
        {type: "open", selector: "localhost:8000/test.html"},
        {type: "enter", selector: "name", value: "Andrew"},
        {type: "enter", selector: "select", value: "green"},
        {type: "enter", selector: "textarea", value: "Hello"},
        {type: "click", selector: "I'm Feeling Lucky"}
      ];
    }

    $scope.editMode = $scope.actions.length === 0;

    permissions = {
      permissions: ["activeTab", "tabs"],
      origins: ["https://*/*", "http://*/*"]
    };

    $scope.run = function () {
      chrome.permissions.contains(permissions, function (granted) {
        if (granted) {
          $scope.hasPermission = true;
          $scope.running = true;
          $scope.editMode = false;
          $scope.step = 0;
          $scope.errorMessage = null;
          $scope.$apply();
          backgroundApp.run($scope.actions, $scope);
        } else {
          $scope.hasPermission = false;
          $scope.$apply();
        }
      });
    };

    $scope.requestPermissions = function () {
      // request permissions in background page in case popup disappears
      backgroundApp.requestPermissions(permissions, $scope.actions, $scope);
    };

    $scope.toggleEditMode = function () {
      $scope.step = null;
      $scope.errorMessage = null;
      $scope.editMode = !$scope.editMode;
      if ($scope.editMode) {
        $("#actions").sortable({
          start: function (e, ui) {
            startIndex = $(ui.item).index();
          },
          stop: function (e, ui) {
            var newIndex, toMove;

            newIndex = $(ui.item).index();
            toMove = $scope.actions[startIndex];

            $scope.actions.splice(startIndex, 1);
            $scope.actions.splice(newIndex, 0, toMove);

            $scope.$apply($scope.actions);
          }
        });
        $timeout(function () {
          $("#new-action").find("input:visible:eq(0)").focus();
        }, 10);
      } else {
        $("#actions").sortable("destroy");
      }
    };

    $scope.createAction = function () {
      $scope.actions.push({type: $scope.actionType, selector: $scope.actionSelector, value: $scope.actionValue});
      $scope.actionSelector = "";
      $scope.actionValue = "";
    };

    $scope.destroyAction = function (action) {
      var index = $scope.actions.indexOf(action);
      $scope.actions.splice(index, 1);
    };

    $scope.resetActions = function () {
      $scope.actions = [];
    };

    $scope.showError = function (message) {
      $scope.errorMessage = message;
      $scope.running = false;
      $scope.$apply();
    };

    $scope.nextStep = function (step) {
      $scope.step = step;
      $scope.$apply();
    };

    $scope.completed = function () {
      $scope.running = false;
      $scope.step++;
      $scope.$apply();
    };

    // persist actions
    $scope.$watch("actions", function () {
      localStorage.setItem("actions", JSON.stringify($scope.actions));
    }, true);

  }]); // end controller

}());
