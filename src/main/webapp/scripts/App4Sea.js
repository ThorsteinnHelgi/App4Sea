/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * ========================================================================== */

import $ from 'jquery';
import * as proj from 'ol/proj';

// @ts-check
const App4Sea = (function a4s() {
//    "use strict";
  const my = {};

  /** ******************************************
     * OpenStreetMap uses WGS84 (also known as WGS 1984, EPSG:4326). This is our map coordinate system (prefProj)
     * It assumes sperical earth to simplify calculations at the cost of accuracy (as the earth is more elyptical)
     * GoogleEarth and kml also use WGS84 as do most Internet web apps for maps. https://en.wikipedia.org/wiki/Keyhole_Markup_Language
     * Professionals use more accurate systems.
     *
     * EPSG:3857 is our map projection to the flat screen. It exaggerates the area of land close to the poles.
     *
     * The extent of our map is: -180, -90, 180, 90 in map coordinates or:
     * -20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244 in view coordinates
     * extent: [minx, miny, maxx, maxy] left, bottom, right, top
     * location: [W, S, E, N] left, bottom, right, top
     * Notice: HDMS format (lat, lon) [90N:90S,180W:180E] vs coordinates (lon, lat) [-180:180,-90:90]
     *
     * https://medium.com/google-design/google-maps-cb0326d165f5
     * ***************************************** */

  // Just definition of a few constants
  my.prefProj = 'EPSG:4326'; // EPSG:4326 = WGS84
  my.prefViewProj = 'EPSG:3857'; // Default is EPSG:3857 (Spherical Mercator).
  my.mapCenter = proj.transform([-3, 65], my.prefProj, my.prefViewProj);// 'EPSG:3857');
  my.mapExtent = proj.transformExtent([-180, -90, 180, 90], my.prefProj, my.prefViewProj);
  my.minZoom = 2;
  my.maxZoom = 18;
  my.startZoom = 4;
  my.logging = 5;
  my.useIconsInMenu = true;
  my.disableSubItems = true;

  // Real pointers to objects will be set at the end of the object files
  my.Animation = {};
  my.KML = {};
  my.Measure = {};
  my.OpenLayers = {};
  my.PopUps = {};
  my.TreeInfo = {};
  my.TreeMenu = {};
  my.Utils = {};
  my.Weather = {};

  if (my.logging) console.log(`Map extent ${[-180, 90, 180, -90]}`);
  if (my.logging) console.log(`Map extent ${my.mapExtent}`);
  if (my.logging) console.log(`Windows width is ${window.innerWidth}`);

  return my;
}());

export default App4Sea;
$.App4Sea = App4Sea;
