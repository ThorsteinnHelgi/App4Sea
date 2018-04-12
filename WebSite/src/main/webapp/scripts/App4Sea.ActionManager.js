/*

 * A simple implementation of action dispacher
 * The purpose of which is to decouple objects for 
 * minimum dependencies.   
 * If a action user calls an action that is not implemented it 
 * does not cause exception and the user does not need to know the
 * actual implementation object or have any reference to it.
 * 
 * (c) 2018 Arni Geir Sigurðsson  arni.geir.sigurdsson(at)gmail.com
 */

var App4Sea = App4Sea || {};
App4Sea.ActionManager = (function(){
    "use strict";
    var that = {};
    var registry = [];
    
    function find(name){
        var i,n=registry.length;
        var foundFunc = null;
        for(i=0;i<n;i++){
            if(registry[i] !== null && registry[i].name === name){
                foundFunc = registry[i].func;
                break;
            }
        }
        return foundFunc;
    };
    
    //add a function to call
    var add = function(name,func){
        if(find(name) === null){
            registry.push({name:name,func:func});
            console.log("ActionManager : Registered action '"+name);
        }else{
            console.log("ActionManager : Action with name '"+name+"' already exists");
        }
    };
    
    var call = function(name,parameters){
        var fun = find(name);
        if(fun !== null){
            console.log("ActionManager : Calling action '"+name+"' with parameters :"+parameters);
            fun(parameters);
        }else{
            console.log("ActionManager : Did not find action with name : "+name);
        }
    };
    
    //only publish following methods
    //Note that usually actions are not removed but such method 
    //can easily be added ...
    that.Call = call;
    that.Add = add;
    
    return that;    
})();

