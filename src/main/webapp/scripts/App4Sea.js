/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

ol = ol || {};

var App4Sea = (function () {
    "use strict";
    var my = {};

    // Just definition of a few constants
    my.prefProj = 'EPSG:4326';
    my.prefViewProj = 'EPSG:3857'; //Default is EPSG:3857 (Spherical Mercator).
    my.mapCenter = ol.proj.transform([-3, 65], my.prefProj, my.prefViewProj);//'EPSG:3857'); 
    my.mapExtent = ol.proj.transformExtent([-180, 90, 180, -90], my.prefProj, my.prefViewProj);
    my.minZoom = 2;
    my.maxZoom = 18;
    my.startZoom = 4;
        
    return my;
    
}(App4Sea || {}));