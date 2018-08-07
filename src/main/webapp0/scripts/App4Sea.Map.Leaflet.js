/* 
 * (c) 2018 Arni Geir Sigurðsson  arni.geir.sigurdsson(at)gmail.com
 */
var App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map)? App4Sea.Map : {};
App4Sea.Map.Leaflet = (function(){
    "use strict";
    var myMap;
    var that = {};
    var areaCenter = [67.5085683629386,-3.251953125];
    var initialZoom = 4;
    var npaLayer = null;
    var MapTileLayer = null;
    function onMapClick(e) {
       $("#DebugWindow").append("["+e.latlng.lat+","+e.latlng.lng+"],<br/>");
    } 
    
    

    //initialize maps and models when page DOM is ready..
    function init(){
        //init Leaflet map with MapBox tiles on Reykjavik
        myMap = L.map('MapContainer').setView(areaCenter,initialZoom);
        myMap.on('click', onMapClick);
        
        var selectedTiles = $("TileLayer_Select").val();

        if(selectedTiles === "ESRI_NatGeoWorldMap"){            
            MapTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', {
                    attribution: 'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
                    maxZoom: 16
            }).addTo(myMap);
        }else{
            MapTileLayer = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYXJuaWdlaXIiLCJhIjoiY2o2dGw4NmgzMHNiMDJxbzRhNjV6M3N2dSJ9.j6qbWrXD69LjlSjxZCY3mA', {
                 attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
                 maxZoom: 18,
                 id: 'mapbox.streets'
             }).addTo(myMap);
        }
        
        $(".MenuSection input[type='checkbox']").click(function(){
            update();
        });
        update();
                     
    };
           


    function update(){
        //add NPA layer if selected
        var customLayer;
        if($("#MenuNPALayer_Checkbox").is(":checked")  && npaLayer == null){
            var style = {};
            style["weight"] = "1";
            //style["color"] = "orange";
            
            customLayer = L.geoJson(null,{
                style : function(){
                    return style;
                }
            })
            
            npaLayer = omnivore.kml('data/NPA.kml',null,customLayer).on('ready', function() {
                //myMap.fitBounds(npaLayer.getBounds());
            }).addTo(myMap);
        }else if (npaLayer != null){
            myMap.removeLayer(npaLayer);
            npaLayer = null;
        }
    }
    
    
    that.Init = init;

    return that;
})();

$(document).ready(function(){
    App4Sea.Map.Leaflet.Init();
});

