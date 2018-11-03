var timer;
var currentTab;
var tabs = {}
var pages = {};
var time_limit = 10;


function onTabEvent(tab, eventType) {
    console.log("[DEBUG]:", tab, eventType);
    tabs[tab.tabId] = {
        "timestamp": new Date(),
        "eventType": eventType
    }
}


function onTabActivated(activeInfo) {
    // console.log("[DEBUG]: Tab activated.", activeInfo);

    var now = new Date();
    if (timer) {
        var url = new URL(currentTab.url);
        if (chrome.runtime.id != url.hostname) {
            if (!pages[url.hostname]) {
                pages[url.hostname] = {};
            }
            if (!pages[url.hostname][url.pathname]) {
                pages[url.hostname][url.pathname] = 0;
            }

            delta = now - timer;
            if (tabs[currentTab.id]) {
                var diff = parseInt((now - tabs[currentTab.id].timestamp)/1000);
                if (time_limit < diff) {
                    console.log("[DEBUG]: exceeds " + time_limit + " second limit.");
                    delta += time_limit;
                }
            }

            pages[url.hostname][url.pathname] += delta/1000;
        }
    }

    timer = new Date();

    chrome.tabs.getSelected(null, function(tab) {
        currentTab = {
            tabId: tab.id,
            windowId: tab.windowId,
            url: tab.url
        };
        onTabEvent(currentTab, "active");
    });
}


// track page refreshes and path changes
chrome.tabs.onUpdated.addListener(function(tabId, changedProps) {
    onTabActivated({
        tabId: tabId,
    });
});


chrome.tabs.onActivated.addListener(onTabActivated);


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
    var url = new URL(sender.url);
    if (chrome.runtime.id != url.hostname) {

        var tab = {
            tabId: sender.tab.id,
            windowId: sender.tab.windowId,
            url: sender.url
        };

        var diff = parseInt((new Date() - tabs[tab.tabId].timestamp)/1000);

        if (time_limit < diff) {
            console.log("[DEBUG]: exceeds " + time_limit + " second limit.");
            if (currentTab.tabId == tab.tabId) {
                timer = null;
                onTabActivated(tab);
            }
        } else {
            onTabEvent(tab, request);
        }
        sendResponse({"status":"ok", "message": "Thanks for the data!"});
    }
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
