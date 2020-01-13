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

  my.loadWeather = function (url, id) {
    if (App4Sea.logging) console.log(`loadWeather: ${id} from ${url}`);

    const startResolution = extent.getWidth(App4Sea.mapExtent) / 256 / 4;
    const resolutions = new Array(App4Sea.maxZoom - App4Sea.minZoom + 1);
    for (let i = 0, ii = resolutions.length; i < ii; ++i) {
      resolutions[i] = startResolution / (2 ** i);
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
