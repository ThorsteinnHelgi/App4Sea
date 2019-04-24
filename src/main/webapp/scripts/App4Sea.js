/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

var App4SeaAnimation = App4SeaAnimation || {};
var App4SeaKML = App4SeaKML || {};
var App4SeaMeasure = App4SeaMeasure || {};
var App4SeaOpenLayers = App4SeaOpenLayers || {};
var App4SeaPopUps = App4SeaPopUps || {};
var App4SeaTreeInfo = App4SeaTreeInfo || {};
var App4SeaTreeMenu = App4SeaTreeMenu || {};
var App4SeaUtils = App4SeaUtils || {};
var App4SeaWeather = App4SeaWeather || {};

var App4Sea = (function () {
    "use strict";
    let my = {};

    // Just definition of a few constants
    my.prefProj = 'EPSG:4326'; // EPSG:4326 = WGS84
    my.prefViewProj = 'EPSG:3857'; //Default is EPSG:3857 (Spherical Mercator).
    my.mapCenter = ol.proj.transform([-3, 65], my.prefProj, my.prefViewProj);//'EPSG:3857'); 
    my.mapExtent = ol.proj.transformExtent([-180, 90, 180, -90], my.prefProj, my.prefViewProj);
    my.minZoom = 2;
    my.maxZoom = 18;
    my.startZoom = 4;
    my.logging = 5;

    my.Animation = App4SeaAnimation;
    my.KML = App4SeaKML;
    my.Measure = App4SeaMeasure;
    my.OpenLayers = App4SeaOpenLayers;
    my.PopUps = App4SeaPopUps;
    my.TreeInfo = App4SeaTreeInfo;
    my.TreeMenu = App4SeaTreeMenu;
    my.Utils = App4SeaUtils;
    my.Weather = App4SeaWeather;
        
    return my;
    
}(App4Sea || {}));
