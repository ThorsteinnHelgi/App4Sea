/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

ol = ol || {};
App4Sea = App4Sea || {};

App4Sea.Animation = (function () {
    "use strict";
    var my = {};

    ////////////////////////////////////////////////////////////////////////////
    // Animate
    my.Animate = function (url, name) {        

        var button = document.getElementById('playStop');
        button.removeEventListener('click', PlayStop);
        button.addEventListener('click', PlayStop, false, {passive: true});
        
        if (state !== "Stopped")
            Stop();
        state = "Stopped";

        var ext = url.substr(url.length - 3, 3);
        if (ext !== 'kml' && ext !== 'kmz') {
            return;
        }

        count = my.AniData[0].length;
        document.getElementById('title').innerText = name;
    };

    function initInfo() {
        var el = document.getElementById('start');
        el.innerHTML = startDate.substr(startDate.length - 8, 8);
        el = document.getElementById('current');
        el.innerHTML = currentDate.substr(currentDate.length - 8, 8);
        el = document.getElementById('end');
        el.innerHTML = endDate.substr(endDate.length - 8, 8);

        el = document.getElementById('startDate');
        el.innerHTML = startDate.substr(0, 10);
        el = document.getElementById('currentDate');
        el.innerHTML = currentDate.substr(0, 10);
        el = document.getElementById('endDate');
        el.innerHTML = endDate.substr(0, 10);
    }

    function updateInfo() {
        // Updage time stamps
        var el = document.getElementById('current');
        el.innerHTML = currentDate.substr(currentDate.length - 8, 8);

        el = document.getElementById('currentDate');
        el.innerHTML =  currentDate.substr(0, 10);                        
        var layerid = my.AniData[4][anindex];
        var lind = findLayerIndex(layerid);
        var remember = 1;

        console.log(my.AniData[0][anindex]);            
        console.log(layerid);

        // Check if layer is active (layer is assumed to exist)
        App4Sea.TreeMenu.Checkbox(layerid, true);

        // Find last index that should be active
        var lastanindex = anindex - remember;
        while (lastanindex < 0)
            lastanindex = lastanindex + count;

        // Make last inactive
        layerid = my.AniData[4][lastanindex];
        App4Sea.TreeMenu.Checkbox(layerid, false);

        // Update progress
        var progress = document.getElementById('progress');
        progress.value = anindex * 100 / count;

        // Next id
        anindex = anindex + 1;
        if (anindex === count)
            anindex = 0;
    }

    function findLayerIndex(lind){
        for (var ynd=0; ynd<App4Sea.Map.OpenLayers.layers.length; ynd++){
            var item = App4Sea.Map.OpenLayers.layers[ynd];
            if (item.id === lind) {
                return ynd;
            }
        }

        return -1;
    }

    function timeElapsed() {
        if (state !== "Playing") {
            Stop();
            state = "Stopped";
            return;
        }

        if (timerId === null || my.AniData[0] === null) {
            Stop();
            state = "Stopped";
            return;
        }

        if (my.AniData[1].length !== 0) {
            currentDate = my.AniData[1][anindex].innerHTML;
        }
        else {
            currentDate = my.AniData[2][anindex].innerHTML;
        }

        updateInfo();
    }

    // Statuses Events++
    // ------------------------------------------------------------
    // Stopped  Play, New Data, Error, Refresh, +++ (Possibly Play)
    // Playing  Stop, New Data, Error, Refresh, +++ (Possibly Stop)
    var PlayStop = function () {
        // We ignore this event if status in not either Playing or Stopped
        if (state !== "Stopped" && state !== "Playing")
            return;

        state = "Transition";
        // Establish formal status (as indicated by icon in use)
        var btnImg = document.getElementById('playStopImg');
        var iconPath = btnImg.src;
        var icon = iconPath.substr(iconPath.length - 8, 8);

        if (icon === "play.png") { // Are stopped shall play
            // Make sure all is stopped before we begin
            Stop();
            // Do not set state to Stopped. We are in stopping state: 
            // Now timer is stopping and icon is ready to play. timerId is null. 

            // Prepare data while we are in a safe state
            Prepare();
            btnImg.src = "icons\\stop.png";

            // StartTimer
            timerId = window.setInterval(timeElapsed, 1000 / frameRate);
            state = "Playing";
        } 
        else { // Are playing, shall stop
            Stop();
            state = "Stopped";
        }
    };

    var Prepare = function () {
        if (count !== 0) {
            // Turn off all the layer images
            for (var aind=0; aind<count; aind++) {
                App4Sea.TreeMenu.Checkbox(my.AniData[4][aind], false);
            }

            if (my.AniData[1].length !== 0) {
                startDate = my.AniData[1][0].innerHTML;
                endDate = my.AniData[1][my.AniData[1].length-1].innerHTML;
            }
            else {
                startDate = my.AniData[2][0].innerHTML;
                endDate = my.AniData[2][my.AniData[2].length-1].innerHTML;
            }
            currentDate = startDate;

            initInfo();
        }
    };

    var Stop = function () {            
        state = "Stopping";

        // StopTimer
        if (timerId !== null) {
            window.clearInterval(timerId);
            timerId = null;
        }

        var btnImg = document.getElementById('playStopImg');
        btnImg.src = "icons\\play.png";
    };
    
    //////////////////////////////////////////////////////////////////////
    my.AniData = [[],[],[],[],[]];//[gol, golw, golb, gole, goll]   

    var state = "Stopped";

    var count;
    var endDate;
    var startDate;
    var currentDate;
    var frameRate = 1; // frames per second
    var timerId = null;
    var anindex = 0;
    
    return my;
}(App4Sea.Animation || {}));