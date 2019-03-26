/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

ol = ol || {};
App4Sea = App4Sea || {};

App4Sea.Animation = (function () {
    "use strict";
    var my = {};

    my.AniData = [[],[],[],[],[]];//[gol, golw, golb, gole, goll]   

    ////////////////////////////////////////////////////////////////////////////
    // Animate
    my.Animate = function (url, name) {//(isImage, url, id, name, layers, width, height, start) {

        function initInfo() {
            var el = document.getElementById('start');
            el.innerHTML = startDate.substr(startDate.length - 8, 8);;//.toLocaleTimeString('de-DE');
            el = document.getElementById('current');
            el.innerHTML = currentDate.substr(currentDate.length - 8, 8);//.toLocaleTimeString('de-DE');
            el = document.getElementById('end');
            el.innerHTML = endDate.substr(endDate.length - 8, 8);//.toLocaleTimeString('de-DE');

            el = document.getElementById('startDate');
            el.innerHTML = startDate.substr(0, 10);//.toLocaleDateString('en-US', dateOpt);
            el = document.getElementById('currentDate');
            el.innerHTML = currentDate.substr(0, 10);//.toLocaleDateString('en-US', dateOpt);
            el = document.getElementById('endDate');
            el.innerHTML = endDate.substr(0, 10);//.toLocaleDateString('en-US', dateOpt);
        }

        function updateInfo() {
            var el = document.getElementById('current');
            el.innerHTML = currentDate.substr(currentDate.length - 8, 8);;//.toLocaleTimeString('de-DE');

            el = document.getElementById('currentDate');
            el.innerHTML =  currentDate.substr(0, 10);//.toLocaleDateString('en-US', dateOpt);
                        
            console.log(my.AniData[4][animationId]);
            console.log(my.AniData[0][animationId]);            

            var lastAnimationId = animationId - 1;
            if (lastAnimationId < 0)
                lastAnimationId = count - 1;
            
            var lind = findLayerIndex(my.AniData[4][animationId]);
            var index = App4Sea.Utils.alreadyLayer(my.AniData[4][animationId], App4Sea.Map.OpenLayers.layers);
            if (index !== -1) {
            }
            else {
                App4Sea.Map.OpenLayers.Map.addLayer(App4Sea.Map.OpenLayers.layers[lind].vector);
            }
            lind = findLayerIndex(my.AniData[4][lastAnimationId]);
            App4Sea.Map.OpenLayers.Map.removeLayer(App4Sea.Map.OpenLayers.layers[lind].vector);

            animationId = animationId + 1;
            if (animationId === count)
                animationId = 0;

            var progress = document.getElementById('progress');
            progress.value = animationId * 100 / count;
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
        

        function setTime() {
            if (animationId === null || my.AniData[0] === null) {
                Stop();
                return;
            }
            
            if (my.AniData[1].length !== 0) {
                currentDate = my.AniData[1][animationId].innerHTML;
            }
            else {
                currentDate = my.AniData[2][animationId].innerHTML;
            }
            //layer.getSource().updateParams({'TIME': currentDate.toISOString()});
            updateInfo();
        }
        
        var playStop = function () {
            var btnImg = document.getElementById('playStopImg');
            var iconPath = btnImg.src;
            var icon = iconPath.substr(iconPath.length - 8, 8);

            if (icon === "play.png") { // Playing
                btnImg.src = "icons\\stop.png";
            
                animationId = 0;
                window.setInterval(setTime, 1000 / frameRate);
            } 
            else { // Stopping
                Stop();
            }
        };
        
        var Stop = function () {
            var btnImg = document.getElementById('playStopImg');
            btnImg.src = "icons\\play.png";

            if (animationId !== null) {
                window.clearInterval(animationId);
                animationId = null;
            }
        };

        var ext = url.substr(url.length - 3, 3);
        if (ext !== 'kml' && ext !== 'kmz') {
            return;
        }

        var button = document.getElementById('playStop');
        button.addEventListener('click', playStop, false);

        var dateOpt = {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'};
        
        var endDate;
        var startDate;
        var currentDate;
        var frameRate = 1; // frames per second
        var animationId = 0;
        var file;
        var layer;
        var count;

        document.getElementById('title').innerText = name;

        count = my.AniData[0].length;
        if (count !== 0) {
            // Turn off all the layer images
            for (var aind=0; aind<count; aind++) {
                var lind = findLayerIndex(my.AniData[4][aind]);
                var item = App4Sea.Map.OpenLayers.layers[lind];
                App4Sea.Map.OpenLayers.Map.removeLayer(item.vector);
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
            file = my.AniData[0][0].innerHTML;

            initInfo();
        }
        
        return layer;
    };
    
    return my;
}(App4Sea.Animation || {}));