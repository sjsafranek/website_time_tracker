var timer;
var current;
var pages = {};

chrome.tabs.onActivated.addListener(function(activeInfo) {
    console.log(activeInfo);

    var now = new Date();
    if (timer) {
        if (!pages[current]) {
            pages[current] = 0;
        }
        pages[current] += now - timer;
    }

    timer = new Date();

    chrome.tabs.getSelected(null, function(tab) {
        var tabId = tab.id;
        var tabUrl = tab.url;
        current = tab.url;
    });

    // var views = chrome.extension.getViews();
});






chrome.browserAction.onClicked.addListener(function() {
    var viewTabUrl = chrome.extension.getURL('metrics.html?data='+JSON.stringify(page));
    var targetId = null;
    chrome.tabs.create({url: viewTabUrl}, function(tab) {
          targetId = tab.id;
    });
});


/*

https://developer.chrome.com/extensions/examples/api/tabs/screenshot/background.js

// https://thebotspeaks.com/Using-Chrome-Extension-To-Track-User-Events-Part-1/

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    // for the current tab, inject the “inject.js” file & execute it
    if (changeInfo.status == "complete" && tab.active) {
        chrome.tabs.executeScript(tab.ib, {
            file: "infect.js"
        });
    }
});

*/
