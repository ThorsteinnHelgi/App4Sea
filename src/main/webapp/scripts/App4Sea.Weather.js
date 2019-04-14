/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

//ol = ol || {};
App4Sea = App4Sea || {};
App4Sea.Weather = (function () {
    "use strict";
    var my = {};

    my.NotWorking = function (evt) {
        var coordinate = evt.coordinate;

        var popupContent = document.getElementById('popup-content');

        // Widget 11
//            var description = "<div id='openweathermap-widget-11'></div>";
//            popupContent.innerHTML = description;
//
//            window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];//daily?lat=35&lon=139&cnt=7   cityid: '3413829',     lat:135,lon:39, cnt:5,
//            window.myWidgetParam.push({id: 11,cityid: '3413829',appid: '1326faa296b7e865683b67cdf8e5c6e4',units: 'metric',containerid: 'openweathermap-widget-11'});
//            (
//                function() {
//                    var script = document.createElement('script');
//                    script.async = true;
//                    script.charset = 'utf-8';
//                    script.src = 'http://openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js';
//                    var s = document.getElementsByTagName('script')[0];
//                    s.parentNode.insertBefore(script, s);
//                }
//            )();

        // Widget 15
        var description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
        popupContent.innerHTML = description;

        window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
        window.myWidgetParam.push({id:15, cityid: '3413829', appid:'1326faa296b7e865683b67cdf8e5c6e4', units:'metric', containerid:'openweathermap-widget-15'});
        (
            function() {
                var script = document.createElement('script');
                script.async = true;
                script.charset = "utf-8";
                script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(script, s);
            }
        )();

        // End
        App4Sea.PopUps.overlayLayerPopUp.setPosition(coordinate);
    };

    my.loadCityWeather = function (url, id) {
        //var popupContainer = document.getElementById('popup');
        var popupContent = document.getElementById('popup-content');
        //var popupCloser = document.getElementById('popup-closer');

        // Create an overlay to anchor the popup to the map.
        //var overlayLayerPopUp = initOverlay(popupContainer, popupCloser);

        var coordinate = App4Sea.OpenLayers.Map.getView().getCenter();
        
        var description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
        popupContent.innerHTML = description;

        window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
        window.myWidgetParam.push({id:15, cityid: '3413829', appid:'1326faa296b7e865683b67cdf8e5c6e4', units:'metric', containerid:'openweathermap-widget-15'});
        (
            function() {
                var script = document.createElement('script');
                script.async = true;
                script.charset = "utf-8";
                script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(script, s);
            }
        )();

        // End
        App4Sea.PopUps.overlayLayerPopUp.setPosition(coordinate);
    };

    my.loadWeather = function(url, id) {
        console.log("loadWeather: " + id + " from " + url);

        var startResolution = ol.extent.getWidth(App4Sea.mapExtent) / 256 / 4;
        var resolutions = new Array(App4Sea.maxZoom-App4Sea.minZoom+1);
        for (var i = 0, ii = resolutions.length; i < ii; ++i) {
            resolutions[i] = startResolution / Math.pow(2, i);
        }
        
        var tileGrid = new ol.tilegrid.TileGrid({
            extent: App4Sea.mapExtent,
            origin: [App4Sea.mapExtent[0], App4Sea.mapExtent[1]],
            resolutions: resolutions,
            projection: App4Sea.OpenLayers.prefViewProj,
            tileSize: [256, 256]
        });
      
        var weather = new ol.layer.Tile({
            name: id,
            preload: 0,
            opacity: 0.8,
            extent: App4Sea.mapExtent,
            minResolution: resolutions[resolutions.length-1],
            maxResolution: resolutions[0],
            tileGrid: tileGrid,
            source: new ol.source.XYZ({
                crossOrigin: 'anonymous',
                attributions: ['&copy; <a href="https://openweathermap.org/">Open Weather Map</a>'],
                url: url
            })
        });
        
        return weather;
    };

    return my;
}(App4Sea.Weather || {}));