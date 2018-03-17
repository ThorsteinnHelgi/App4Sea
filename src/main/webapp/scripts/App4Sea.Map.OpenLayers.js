/* 
 * (c) 2018 Arni Geir Sigurðsson  arni.geir.sigurdsson(at)gmail.com
 */
var App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map)? App4Sea.Map : {};
App4Sea.Map.OpenLayers = (function(){
    "use strict";
    var myMap;
    var currentLayer;
    var osmTileLayer;
    var esriWSPTileLayer;
    var esriWITileLayer;
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
        myMap = new ol.Map({
            target: 'MapContainer',
            view: new ol.View({
              center: ol.proj.fromLonLat([-3,65]),
              zoom: initialZoom
            })
          });
          
        osmTileLayer =   new ol.layer.Tile({source: new ol.source.OSM()});
        currentLayer = osmTileLayer;
        
        var attributionESRIWSM = new ol.Attribution({
            html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/0">ArcGIS</a>'
        });
   
        
        
        esriWSPTileLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
              attributions: [attributionESRIWSM],
              url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
            })
        });  
        
        var attributionWIM = new ol.Attribution({
            html: 'Tiles &copy; <a href="https://http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0">ArcGIS</a>'
        });
        esriWITileLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
              attributions: [attributionWIM],
              url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            })
        });  
        
        
          
        myMap.addLayer(currentLayer);

        
        var zoomslider = new ol.control.ZoomSlider();
        myMap.addControl(zoomslider); 
        
        
        
        $(".MenuSection input[type='checkbox']").click(function(){
            update();
        });
        $(".MenuSection select").change(function(){
            update();
        });
        update();
        
    };
    //load kml and return as Vector
    function loadKml(url){
        var vector = new ol.layer.Vector({
              source: new ol.source.Vector({
                url: url, // 'https://openlayers.org/en/v4.6.4/examples/data/kml/2012_Earthquakes_Mag5.kml',
                format: new ol.format.KML({
                  extractStyles: false
                })
              })
            });
        return vector;
    }
    
    var npaVector = loadKml('data/NPA.kml');
    var medDeccVector = loadKml('data/DECC_OFF_Median_Line.kml');
    var hydDeccVector = loadKml('data/DECC_OFF_Hydrocarbon_Fields.kml');
    
    
           


    function update(){
        
        var selectedMapLayer = $("#MenuLayer_Select").val();
        if(selectedMapLayer !== currentLayer){
            myMap.removeLayer(currentLayer);
            if(selectedMapLayer === 'osmTileLayer'){
                currentLayer = osmTileLayer;
            }else if (selectedMapLayer === 'esriWSPTileLayer'){
               currentLayer = esriWSPTileLayer; 
            }else if (selectedMapLayer === 'esriWITileLayer'){
                currentLayer = esriWITileLayer; 
            }
            myMap.addLayer(currentLayer);
        }
        
        
        //add NPA layer if selected
        
        var customLayer;
        myMap.removeLayer(npaVector);
        if($("#MenuNPALayer_Checkbox").is(":checked") && npaVector){
            myMap.addLayer(npaVector);           
        }
        myMap.removeLayer(medDeccVector);
        if($("#MenuMedDeccLayer_Checkbox").is(":checked") && medDeccVector){
            myMap.addLayer(medDeccVector);           
        }
        
        myMap.removeLayer(hydDeccVector);
        if($("#MenuHydDeccLayer_Checkbox").is(":checked") && hydDeccVector){
            myMap.addLayer(hydDeccVector);           
        }        
    }
    
    
    that.Init = init;

    return that;
})();

$(document).ready(function(){
    App4Sea.Map.OpenLayers.Init();
});

