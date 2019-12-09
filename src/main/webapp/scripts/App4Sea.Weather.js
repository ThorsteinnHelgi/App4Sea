/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

import { App4Sea } from './App4Sea.js';


let App4SeaWeather = (function () {
    "use strict";
    let my = {};

    my.NotWorking = function (evt) {
        let coordinate = evt.coordinate;

        let popupContent = document.getElementById('popup-content');

        // Widget 11
//            let description = "<div id='openweathermap-widget-11'></div>";
//            popupContent.innerHTML = description;
//
//            window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];//daily?lat=35&lon=139&cnt=7   cityid: '3413829',     lat:135,lon:39, cnt:5,
//            window.myWidgetParam.push({id: 11,cityid: '3413829',appid: '1326faa296b7e865683b67cdf8e5c6e4',units: 'metric',containerid: 'openweathermap-widget-11'});
//            (
//                function() {
//                    let script = document.createElement('script');
//                    script.async = true;
//                    script.charset = 'utf-8';
//                    script.src = 'http://openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js';
//                    let s = document.getElementsByTagName('script')[0];
//                    s.parentNode.insertBefore(script, s);
//                }
//            )();

        // Widget 15
        let description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
        popupContent.innerHTML = description;

        window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
        window.myWidgetParam.push({id:15, cityid: '3413829', appid:'1326faa296b7e865683b67cdf8e5c6e4', units:'metric', containerid:'openweathermap-widget-15'});
        (
            function() {
                let script = document.createElement('script');
                script.async = true;
                script.charset = "utf-8";
                script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
                let s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(script, s);
            }
        )();

        // End
        App4Sea.PopUps.overlayLayerPopUp.setPosition(coordinate);
    };

    my.loadCityWeather = function (url, id) {
        //let popupContainer = document.getElementById('popup');
        let popupContent = document.getElementById('popup-content');
        //let popupCloser = document.getElementById('popup-closer');

        // Create an overlay to anchor the popup to the map.
        //let overlayLayerPopUp = initOverlay(popupContainer, popupCloser);

        let coordinate = App4Sea.OpenLayers.Map.getView().getCenter();
        
        let description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
        popupContent.innerHTML = description;

        window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
        window.myWidgetParam.push({id:15, cityid: '3413829', appid:'1326faa296b7e865683b67cdf8e5c6e4', units:'metric', containerid:'openweathermap-widget-15'});
        (
            function() {
                let script = document.createElement('script');
                script.async = true;
                script.charset = "utf-8";
                script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
                let s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(script, s);
            }
        )();

        // End
        App4Sea.PopUps.overlayLayerPopUp.setPosition(coordinate);
    };

    my.loadWeather = function(url, id) {
        if (App4Sea.logging) console.log("loadWeather: " + id + " from " + url);

        let startResolution = ol.extent.getWidth(App4Sea.mapExtent) / 256 / 4;
        let resolutions = new Array(App4Sea.maxZoom-App4Sea.minZoom+1);
        for (let i = 0, ii = resolutions.length; i < ii; ++i) {
            resolutions[i] = startResolution / Math.pow(2, i);
        }
        
        let tileGrid = new ol.tilegrid.TileGrid({
            extent: App4Sea.mapExtent,
            origin: [App4Sea.mapExtent[0], App4Sea.mapExtent[1]],
            resolutions: resolutions,
            projection: App4Sea.OpenLayers.prefViewProj,
            tileSize: [256, 256]
        });
      
        let weather = new ol.layer.Tile({
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
}());
App4Sea.Weather = App4SeaWeather;

export default App4SeaWeather