/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * ========================================================================== */

import Tile from 'ol/layer/Tile';
import TileGrid from 'ol/tilegrid/TileGrid';
import XYZ from 'ol/source/XYZ';
import * as extent from 'ol/extent';
import App4Sea from './App4Sea';


const App4SeaWeather = (function () {
  const my = {};

  my.NotWorking = function (evt) {
    const { coordinate } = evt;

    const popupContent = document.getElementById('popup-content');

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
    const description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
    popupContent.innerHTML = description;

    window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
    window.myWidgetParam.push({
      id: 15, cityid: '3413829', appid: '1326faa296b7e865683b67cdf8e5c6e4', units: 'metric', containerid: 'openweathermap-widget-15',
    });
    (
      function () {
        const script = document.createElement('script');
        script.async = true;
        script.charset = 'utf-8';
        script.src = '//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js';
        const s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
      }());

    // End
    App4Sea.PopUps.overlayLayerPopUp.setPosition(coordinate);
  };

  my.loadCityWeather = function (url, id) {
    // let popupContainer = document.getElementById('popup');
    const popupContent = document.getElementById('popup-content');
    // let popupCloser = document.getElementById('popup-closer');

    // Create an overlay to anchor the popup to the map.
    // let overlayLayerPopUp = initOverlay(popupContainer, popupCloser);

    const coordinate = App4Sea.OpenLayers.Map.getView().getCenter();

    const description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
    popupContent.innerHTML = description;

    window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
    window.myWidgetParam.push({
      id: 15, cityid: '3413829', appid: '1326faa296b7e865683b67cdf8e5c6e4', units: 'metric', containerid: 'openweathermap-widget-15',
    });
    (
      function () {
        const script = document.createElement('script');
        script.async = true;
        script.charset = 'utf-8';
        script.src = '//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js';
        const s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(script, s);
      }());

    // End
    App4Sea.PopUps.overlayLayerPopUp.setPosition(coordinate);
  };

  my.loadWeather = function (url, id) {
    if (App4Sea.logging) console.log(`loadWeather: ${id} from ${url}`);

    const startResolution = extent.getWidth(App4Sea.mapExtent) / 256 / 4;
    const resolutions = new Array(App4Sea.maxZoom - App4Sea.minZoom + 1);
    for (let i = 0, ii = resolutions.length; i < ii; ++i) {
      resolutions[i] = startResolution / Math.pow(2, i);
    }

    const tileGrid = new TileGrid({
      extent: App4Sea.mapExtent,
      origin: [App4Sea.mapExtent[0], App4Sea.mapExtent[1]],
      resolutions,
      projection: App4Sea.OpenLayers.prefViewProj,
      tileSize: [256, 256],
    });

    const weather = new Tile({
      name: id,
      preload: 0,
      opacity: 0.8,
      extent: App4Sea.mapExtent,
      minResolution: resolutions[resolutions.length - 1],
      maxResolution: resolutions[0],
      tileGrid,
      source: new XYZ({
        crossOrigin: 'anonymous',
        attributions: ['&copy; <a href="https://openweathermap.org/">Open Weather Map</a>'],
        url,
      }),
    });

    return weather;
  };

  return my;
}());
App4Sea.Weather = App4SeaWeather;

export default App4SeaWeather;
