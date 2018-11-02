// Infect
(function(){
    var events = ["click", "wheel"];
    for (var i=0; i<events.length; i++) {
        document.addEventListener(events[i], function(e){
            try {
                chrome.runtime.sendMessage(e.type, function(response){
                    // console.log(response);
                });
            }
            catch(err) {}
        });
    }
})();
