/*jslint indent: 2, plusplus: true */
/*global chrome*/

var app = (function () {
  'use strict';

  var pub = {},
    queue = [],
    running = false,
    injected = {},
    currentTab,
    $scope,
    step,
    endStep,
    previousStep;

  function injectCode(callback) {
    if (!injected[currentTab.id]) {
      // make sure it's a url we can access
      if (currentTab.url.substring(0, 4) === "http") {
        injected[currentTab.id] = true;
        chrome.tabs.executeScript(currentTab.id, {file: "js/jquery-2.0.3.js"}, function () {
          chrome.tabs.executeScript(currentTab.id, {file: "js/jquery.nearest.js"}, function () {
            chrome.tabs.executeScript(currentTab.id, {file: "js/magic.js"}, function () {
              callback();
            });
          });
        });
      } else {
        $scope.showError("Cannot access this page");
      }
    } else {
      callback();
    }
  }

  function sendMessage(data, callback) {
    injectCode(function () {
      chrome.tabs.sendMessage(currentTab.id, data, function (response) {
        if (response) {
          if (response.error) {
            running = false;
            $scope.showError(response.error);
          } else if (!response.waiting && callback) {
            callback(response);
          }
        }
      });
    });
  }

  function nextStep() {
    var action, url;
    if (previousStep !== null) {
      $scope.completedStep(previousStep);
    }
    if (step < endStep) {
      $scope.nextStep(step);
      action = queue[step];
      if (action.type === "open") {
        url = action.selector;
        if (url.substring(0, 4) !== "http") {
          url = "http://" + url;
        }
        chrome.tabs.update({url: url});
      } else {
        sendMessage(action, nextStep);
      }
      previousStep = step;
      step++;
    } else {
      running = false;
      $scope.completed();
    }
  }

  // inject code when page changes if running
  chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (changeInfo.status === "complete") {
      injected[tabId] = false;
      if (running && tabId === currentTab.id) {
        currentTab = tab; // update url
        nextStep();
      }
    }
  });

  pub.run = function (actions, startStep, runEndStep, scope) {
    $scope = scope;
    chrome.tabs.getSelected(null, function (tab) {
      currentTab = tab;
      running = true;
      queue = actions;
      step = startStep;
      endStep = runEndStep;
      previousStep = null;
      nextStep();
    });
  };

  pub.requestPermissions = function (permissions, actions, scope) {
    chrome.permissions.request(permissions, function (granted) {
      if (granted) {
        pub.run(actions, scope);
      }
    });
  };

  pub.isRunning = function () {
    return running;
  };

  return pub;
}());
