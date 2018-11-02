// Infect
(function(){
    var events = ["click", "wheel"];
    for (var i=0; i<events.length; i++) {
        document.addEventListener(events[i], function(e){
            console.log(e);
        });
    }
})();
