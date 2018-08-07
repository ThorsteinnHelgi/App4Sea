var App4Sea = App4Sea || {};

App4Sea.EventManager = (function(){
    "use strict";
    var that = {};
    var registry = [];
    
    
    function find(name){
        var i,n=registry.length;
        var eventListener = null;
        for(i=0;i<n;i++){
            if(registry[i].name === name){
                eventListener = registry[i]; 
            }
        }
        return eventListener;
    }
    //the sourse of the event must register a event to listen to
    var register = function(eventName){
        var event = find(eventName);
        if(event === null){
            registry.push({name:eventName,listeners:[]});
        }
    };
    
    //the sink of the event must register listener in form of a function
    //to call when source triggers event
    var add = function(eventName,func){
        var listeners = findEventListeners(eventName);
        if(listeners === null){
            //create new array for this event
            listeners = [];
            registry.push({name:eventName,listeners});
        }
        listeners.push(func);
    };
    
    //the source (or anyone) can then trigger this event by calling the
    //event name
    var trigger = function(eventName){
        var listeners = findEventListeners(eventName);
        var i,n;
        if(listeners !== null && listeners.length && listeners.length > 0){
            n = listeners.length;
            for(i=0;i<n;i++){
                if(listeners[i] && typeof listeners[i] === 'function'){
                    listeners[i]();  
                }
            }
        }
    };
    
    
    that.Register = register;
    that.Add = add;
    that.Trigger = trigger;
    return that;
})();
