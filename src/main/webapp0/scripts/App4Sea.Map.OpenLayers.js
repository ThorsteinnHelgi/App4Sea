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
        
        
        var displayFeatureInfo = function (pixel) {
            var container =  $("#FeatureInfoContainer");
            container.empty();
            var features = [];
            myMap.forEachFeatureAtPixel(pixel, function (feature) {
                features.push(feature);
            });
            if (features.length > 0) {
                var description = features[0].get('description');
                //specific beredsskapdepot data
                var template;
                var beredskap;
                var i;
                
                if(description && description.length > 0){
                    container.append(description).show();
                }else if(features[0].get('navn')){
                    beredskap = [];
                    beredskap.push({key:'navn',value:features[0].get('navn')});
                    beredskap.push({key:'fylke',value:features[0].get('fylke')});
                    beredskap.push({key:'kyv_region',value:features[0].get('kyv_region')});
                    beredskap.push({key:'kommune',value:features[0].get('kommune')});
                    beredskap.push({key:'gateadresse',value:features[0].get('gateadresse')});
                    beredskap.push({key:'lenke_faktaark',value:features[0].get('lenke_faktaark')});
                    /*
                    beredskap.kyv_region = features[0].get('kyv_region');
                    beredskap.kommune = features[0].get('kommune');
                    beredskap.gateadresse = features[0].get('gateadresse');
                    beredskap.lenke_faktaark = features[0].get('lenke_faktaark');
                    beredskap.iua = features[0].get('iua');
                    */
                    template = "<tr><td>{{key}}</td><td>{{value}}</td></tr>";
                    Mustache.parse(template);
                    description = "<table><thead><tr><th>Name</th><th>Value</th></tr></thead><tbody>";
                    for(i=0;i<beredskap.length;i++){
                        description += Mustache.render(template,beredskap[i]);
                    }
                    description += "</tbody></table>";
                    container.append(description).show();
                }

            }

          
        };
        
        myMap.on('click', function(evt) {            
            displayFeatureInfo(evt.pixel);
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
                url: url, 
                format: new ol.format.KML({
                  extractStyles: true,
                  extractAttributes: true,
                  showPointNames: true

                })
              })
            });
        return vector;
    }
    
    var npaVector = loadKml('data/NPA.kml');
    var medDeccVector = loadKml('data/DECC_OFF_Median_Line.kml');
    var hydDeccVector = loadKml('data/DECC_OFF_Hydrocarbon_Fields.kml');
    var insidentsVector = loadKml('data/incidents.kml');
    var meetingsVector = loadKml('data/MeetingPlaces.kml');
    var nyBeredskapsdepotVector = loadKml('data/ny_beredskapsdepot.kml');

    
    
           


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
        myMap.removeLayer(meetingsVector);
        if($("#MenuMedMeetings_Checkbox").is(":checked") && meetingsVector){
            myMap.addLayer(meetingsVector);           
        }
        
        myMap.removeLayer(insidentsVector);
        if($("#MenuIncidents_Checkbox").is(":checked") && insidentsVector){
            myMap.addLayer(insidentsVector);           
        }    
        
        myMap.removeLayer(nyBeredskapsdepotVector);
        if($("#MenuBeredskapsdepot_Checkbox").is(":checked") && nyBeredskapsdepotVector){
            myMap.addLayer(nyBeredskapsdepotVector);           
        } 
        
        
        

    }
    
    
    that.Init = init;

    return that;
})();

$(document).ready(function(){
    App4Sea.Map.OpenLayers.Init();
});

