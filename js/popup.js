/*jslint browser: true, indent: 2, plusplus: true */
/*global chrome, angular, $*/

(function () {
  'use strict';

  var testMode, myApp;

  testMode = false;
  myApp = angular.module("myApp", []);

  myApp.controller("ActionCtrl", ["$scope", function ($scope, $timeout) {
    var backgroundApp, permissions, startIndex, persist;

    backgroundApp = chrome.extension.getBackgroundPage().app;

    persist = ["actions", "actionType", "actionSelector", "actionValue", "editMode"];
    angular.forEach(persist, function (value, key) {
      $scope[value] = JSON.parse(localStorage.getItem(value));
    });

    $scope.errorMessage = null;
    $scope.step = null;
    $scope.completedSteps = [];
    $scope.running = false;
    $scope.hasPermission = true;
    $scope.actionType = $scope.actionType || "click";

    if (!localStorage.getItem("actions")) {
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

    permissions = {
      permissions: ["activeTab", "tabs"],
      origins: ["https://*/*", "http://*/*"]
    };

    $scope.run = function (startStep, endStep) {
      if (!backgroundApp.isRunning()) {
        chrome.permissions.contains(permissions, function (granted) {
          if (granted) {
            $scope.hasPermission = true;
            $scope.running = true;
            $scope.editMode = false;
            $scope.step = startStep;
            $scope.completedSteps = [];
            $scope.errorMessage = null;
            $scope.$apply();
            backgroundApp.run($scope.actions, startStep, endStep, $scope);
          } else {
            $scope.hasPermission = false;
            $scope.$apply();
          }
        });
      }
    };

    $scope.requestPermissions = function () {
      // request permissions in background page in case popup disappears
      backgroundApp.requestPermissions(permissions, $scope.actions, $scope);
    };

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

    $scope.toggleEditMode = function () {
      $scope.step = null;
      $scope.errorMessage = null;
      $scope.editMode = !$scope.editMode;
      if ($scope.editMode) {
        $timeout(function () {
          $("#new-action").find("input:visible:eq(0)").focus();
        }, 10);
      } else {
        $scope.actionSelector = null;
        $scope.actionValue = null;
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

    $scope.completedStep = function (step) {
      $scope.completedSteps.push(step);
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
    angular.forEach(persist, function (value, key) {
      $scope.$watch(value, function () {
        localStorage.setItem(value, JSON.stringify($scope[value]));
      }, true);
    });

  }]); // end controller

}());
