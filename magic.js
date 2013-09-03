/*jslint browser: true, indent: 2, plusplus: true */
/*global chrome, $*/

(function () {
  'use strict';

  var wait = false;

  // if leaving page, wait for next action
  $(window).on("beforeunload", function () {
    wait = true;
  });

  // helpers

  // wait for element to appear and click it
  // wait for 2 second max
  function waitFor(findElement, sendResponse, callback, count) {
    if (!count) {
      count = 0;
    }
    var element = findElement();
    if (!element) {
      if (count < 40) {
        setTimeout(function () {
          waitFor(findElement, sendResponse, callback, count + 1);
        }, 50);
      } else {
        sendResponse({error: "Could not find element"});
      }
    } else {
      callback(element);
      setTimeout(function () {
        if (!wait) {
          sendResponse({});
        }
      }, 100);
    }
  }

  function cssSelector(selector) {
    try {
      return $(selector).get(0); // try css selector first
    } catch (e) {
      return null;
    }
  }

  // actions types

  function enter(selector, value, sendResponse) {
    var findElement = function () {
      var ele, labelFor, e;
      ele = cssSelector(selector);
      if (!ele) {
        // try for label
        labelFor = $("label").filter(function () {
          return $(this).text().toUpperCase().indexOf(selector.toUpperCase()) >= 0;
        }).attr("for");
        if (labelFor) {
          ele = document.getElementById(labelFor);
        }
      }
      if (!ele) {
        ele = $("input[placeholder]:visible").filter(function () {
          return $(this).attr("placeholder").toUpperCase().indexOf(selector.toUpperCase()) >= 0;
        }).get(0);
      }
      if (!ele) {
        e = $("*").filter(function () {
          return $(this).text().toUpperCase().indexOf(selector.toUpperCase()) >= 0;
        });
        if (e.length > 0) {
          ele = e.nearest("input[type=text]:visible").get(0);
        }
      }
      return ele;
    };
    waitFor(findElement, sendResponse, function (element) {
      var option;
      if (element.nodeName.toLowerCase() === "select") {
        option = $(element).find("option").filter(function () {
          return $(this).text().toUpperCase().indexOf(value.toUpperCase()) >= 0;
        }).first();
        if (option.length === 1) {
          option.prop("selected", true);
        } else {
          element.value = value;
        }
      } else {
        element.value = value;
      }
      $(element).blur(); // needed for Google
    });
  }

  function click(selector, sendResponse) {
    var findElement = function () {
      var ele = cssSelector(selector);
      if (!ele) {
        ele = $("a:visible, button:visible").filter(function () {
          return $(this).text().toUpperCase().indexOf(selector.toUpperCase()) >= 0;
        }).get(0);
      }
      if (!ele) {
        ele = $("input[value]:visible").filter(function () {
          return $(this).val().toUpperCase().indexOf(selector.toUpperCase()) >= 0;
        }).get(0);
      }
      return ele;
    };
    waitFor(findElement, sendResponse, function (element) {
      element.click();
    });
  }

  // receive actions to run
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === "click") {
      click(message.selector, sendResponse);
    } else if (message.type === "enter") {
      enter(message.selector, message.value, sendResponse);
    }
    return true; // true means expect a response
  });

}());
