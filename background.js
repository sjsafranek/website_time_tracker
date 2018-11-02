var timer;
var current;
var pages = {};


chrome.tabs.onActivated.addListener(function(activeInfo) {
    var now = new Date();
    if (timer) {
        var url = new URL(current);
        if (chrome.runtime.id != url.hostname) {
            if (!pages[url.hostname]) {
                pages[url.hostname] = {};
            }
            if (!pages[url.hostname][url.pathname]) {
                pages[url.hostname][url.pathname] = 0;
            }
            pages[url.hostname][url.pathname] += now - timer;
        }
    }

    timer = new Date();

    chrome.tabs.getSelected(null, function(tab) {
        var tabId = tab.id;
        var tabUrl = tab.url;
        current = tab.url;
    });

});


chrome.browserAction.onClicked.addListener(function() {
    var viewTabUrl = chrome.extension.getURL('metrics.html');
    var targetId = null;

    chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
        // We are waiting for the tab we opened to finish loading.
        // Check that the tab's id matches the tab we opened,
        // and that the tab is done loading.
        if (tabId != targetId || changedProps.status != "complete") return;

        // Passing the above test means this is the event we were waiting for.
        // There is nothing we need to do for future onUpdated events, so we
        // use removeListner to stop getting called when onUpdated events fire.
        chrome.tabs.onUpdated.removeListener(listener);

        // Look through all views to find the window which will display
        // the screenshot.  The url of the tab which will display the
        // screenshot includes a query parameter with a unique id, which
        // ensures that exactly one view will have the matching URL.
        var views = chrome.extension.getViews();
        for (var i = 0; i < views.length; i++) {
            var view = views[i];
            if (view.location.href == viewTabUrl) {
                view.viewMetrics(
                    JSON.parse(JSON.stringify(pages))
                );
                break;
            }
        }
    });

    chrome.tabs.create({url: viewTabUrl}, function(tab) {
          targetId = tab.id;
    });

});


// https://developer.chrome.com/extensions/messaging
// https://www.youtube.com/watch?v=wjiku6X-hd8
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // console.log(request, sender);
    var url = new URL(current);
    if (chrome.runtime.id != url.hostname) {
        if (!pages[url.hostname]) {
            pages[url.hostname] = {};
        }
        if (!pages[url.hostname][url.pathname]) {
            pages[url.hostname][url.pathname] = 0;
        }
        pages[url.hostname][url.pathname] += now - timer;
    }
    // pages[sender.url].last_event_timestamp = parseInt(new Date().getTime() / 1000);
    // pages[sender.url].last_event_type = request;
    sendResponse({"status":"ok", "message": "Thanks for the data!"});
});





/*

// https://developer.chrome.com/extensions/examples/api/tabs/screenshot/background.js
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
