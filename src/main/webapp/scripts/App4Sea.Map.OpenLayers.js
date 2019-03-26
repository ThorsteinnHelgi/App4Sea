/* ==========================================================================
 * (c) 2018 Arni Geir Sigurðsson            arni.geir.sigurdsson(at)gmail.com
 *          Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *              
 * ==========================================================================*/

ol = ol || {};
App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map) ? App4Sea.Map : {};

App4Sea.Map.OpenLayers = (function () {
    "use strict";
    var my = {};
    
    my.Map;
    my.styleMaps = []; // array to hold styles as they are created   
    my.layers = []; // array to hold layers as they are created   
    my.descriptionContainer;

    var currentLayer;
    var osmTileLayer;
    var esriWSPTileLayer;
    var esriWITileLayer;
    var blackTileLayer;
    var overlayDescription;// Used for layer description (e.g. legend)

    ////////////////////////////////////////////////////////////////////////////
    //initialize maps and models when page DOM is ready..
    my.Init = function () {
       
        initBasemapLayerTiles();

        CreateBaseMap();
        
        currentLayer = esriWSPTileLayer;
        
        App4Sea.PopUps.Init();
        App4Sea.PopUps.initToolTip();
        
        updateBaseMap();
        
        SetMapControls();

        initMenu();
        
        var res = App4Sea.Utils.supports_html5_storage();
        console.log("Support for html5 local storage: " + res);
    };

    ////////////////////////////////////////////////////////////////////////////
    // Init all base maps
    function initBasemapLayerTiles() {
        my.descriptionContainer = document.getElementById('legend');
        overlayDescription = my.initOverlay(my.descriptionContainer);

        // Init osmTileLayer base map
        osmTileLayer = new ol.layer.Tile({
            name: "osmTileLayer",
            crossOriginKeyword: 'anonymous',
            source: new ol.source.OSM()
        });

        // Init esriWSPTileLayer base map
        esriWSPTileLayer = new ol.layer.Tile({
            name: "esriWSPTileLayer",
            crossOriginKeyword: 'anonymous',
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/0">ArcGIS World Street Map</a>'],
////                rendermode: 'image',
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
            })
        });

        // Init esriWITileLayer base map (Satelite Images)
        esriWITileLayer = new ol.layer.Tile({
            name: "esriWITileLayer",
            crossOriginKeyword: 'anonymous',
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0">ArcGIS World Imagery Map</a>'],
                //rendermode: 'image',
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            })
        });
        
        blackTileLayer = new ol.layer.Tile({
            name: 'blackTileLayer',
            crossOriginKeyword: 'anonymous',
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'],
                //rendermode: 'image',
                url: 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            })
        });        
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Create base map and store in my.Map
    function CreateBaseMap() {

        //init OpenLayer map with MapBox tiles
        var map = new ol.Map({
            target: 'MapContainer',
            //interaction: interaction,
            view: new ol.View({
                center: App4Sea.mapCenter,
                zoom: App4Sea.startZoom,
                minZoom: App4Sea.minZoom,
                maxZoom: App4Sea.maxZoom
            })
        });
        
        my.Map = map;
        
        my.Map.on('singleclick', function (evt) {
            App4Sea.PopUps.SingleClick(evt);
        });

        my.Map.on('not_working', function (evt) {
          App4Sea.Weather.NotWorking(evt);
        });
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Update base map
    function updateBaseMap() {
        // Set base map
        var selectedMapLayer = $("#MenuLayer_Select").val();
        if (selectedMapLayer !== currentLayer.name) {
            my.Map.removeLayer(currentLayer);
            var el = $('#MenuContainer');
            var el2 = $('#MenuLayer_Select');
            var el3 = $('#ButtonMenu');
            if (selectedMapLayer === 'osmTileLayer') {
                el[0].style.backgroundColor = 'white';
                el[0].style.color = 'black';
                //el2[0].style.filter = 'invert(0%)';
                el3[0].style.filter = 'invert(0%)';
                currentLayer = osmTileLayer;
            } else if (selectedMapLayer === 'esriWSPTileLayer') {
                el[0].style.backgroundColor = 'beige';
                el[0].style.color = 'black';
                //el2[0].style.filter = 'invert(0%)';
                el3[0].style.filter = 'invert(0%)';
                currentLayer = esriWSPTileLayer;
            } else if (selectedMapLayer === 'esriWITileLayer') {
                el[0].style.backgroundColor = '#163e6f';
                el[0].style.color = 'beige';
                currentLayer = esriWITileLayer;
                //el2[0].style.filter = 'invert(100%)';
                el3[0].style.filter = 'invert(100%)';
            } else if (selectedMapLayer === 'blackTileLayer') {
                el[0].style.backgroundColor = '#0d0d0d';
                el[0].style.color = 'gray';
                //el2[0].style.filter = 'invert(100%)';
                el3[0].style.filter = 'invert(100%)';
                currentLayer = blackTileLayer;
            }
            my.Map.addLayer(currentLayer);
        }
    }

    ////////////////////////////////////////////////////////////////////////////7
    // Set the basic map controls
    function SetMapControls() {
        // Add standard map controls
        //map.addControl(new ol.control.ZoomSlider());
        //map.addControl(new ol.control.Zoom());
        //map.addControl(new ol.control.FullScreen());
        //map.addControl(new ol.control.Rotate({autoHide: true}));
        var ctrl = new ol.control.MousePosition({
            projection: App4Sea.prefProj,
            coordinateFormat: function (coordinate) {
                return ol.coordinate.format(coordinate, '{x}, {y}', 4);
            }
        });
        my.Map.addControl(ctrl);
        my.Map.addControl(new ol.control.OverviewMap({
            layers: [currentLayer],
            collapsed: true
        }));
        //map.addControl(new ol.control.ScaleLine());        Not correct scale
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Overlay with auto pan
    my.initOverlay = function (container, closer) {
        var overlay = new ol.Overlay({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 2000
            }
        });
        
        if (closer) {
            // Add a click handler to hide the overlay.
            // @return {boolean} Don't follow the href.
            closer.onclick = function () {
                overlay.setPosition(undefined);
                closer.blur();
                return false;
            };
        }
        
        return overlay;
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Init all menu items
    function initMenu (){
        // Set up TreeMenu
        App4Sea.TreeMenu.setUp();

        // Set up TreeInfo
        App4Sea.TreeInfo.setUp();

//        var button = document.getElementById('testBtn');
//        button.addEventListener('click', test, false);

        // Hook events to menu
        $(".MenuSection input[type='checkbox']").click(function () {
            updateBaseMap();
        });
        $(".MenuSection select").change(function () {
            updateBaseMap();
        });        
    }
    
    return my;
}(App4Sea.Map.OpenLayers || {}));