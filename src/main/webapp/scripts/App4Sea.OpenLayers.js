/* ==========================================================================
 * (c) 2018 Arni Geir Sigurðsson            arni.geir.sigurdsson(at)gmail.com
 *          Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *              
 * ==========================================================================*/

import { App4Sea } from './App4Sea.js';

//@ts-check
let App4SeaOpenLayers = (function () {
    "use strict";
    let my = {};
    
    // Some further definitions
    my.Map;
    my.styleMaps = []; // array to hold styles as they are created   
    my.layers = []; // array to hold layers as they are created   
    my.descriptionContainer;

    let currentLayer;
    let osmTileLayer;
    let esriWSPTileLayer;
    let esriWITileLayer;
    let blackTileLayer;

    ////////////////////////////////////////////////////////////////////////////
    //initialize maps and models when page DOM is ready..
    my.Init = function () {
       
        initBasemapLayerTiles();

        CreateBaseMap();
        
        currentLayer = esriWSPTileLayer;
        
        updateBaseMap();
        
        SetMapControls();

        initMenu();

        InitPopup();
        
        //let res = App4Sea.Utils.supports_html5_storage();
        //if (App4Sea.logging) console.log("Support for html5 local storage: " + res);
    };

    ////////////////////////////////////////////////////////////////////////////
    // Init all base maps
    function initBasemapLayerTiles() {
        my.descriptionContainer = document.getElementById('InfoPopup');
        //overlayDescription = my.InitOverlay(my.descriptionContainer);

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
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Create base map and store in my.Map
    function CreateBaseMap() {

        //init OpenLayer map with MapBox tiles
        let map = new ol.Map({
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
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // MapChange
    my.MapChange = function () {
        let mapSelector2 = $("#MenuLayer_Select2");
        let mapSelector = $("#MenuLayer_Select");
        mapSelector[0].selectedIndex = mapSelector2[0].selectedIndex;
        updateBaseMap();
    };

    ////////////////////////////////////////////////////////////////////////////
    // Update base map
    function updateBaseMap() {
        // Set base map
        let selectedMapLayer = $("#MenuLayer_Select").val();
        if (selectedMapLayer !== currentLayer.name) {
            my.Map.removeLayer(currentLayer);
            let el = $('#MenuContainer');
            let el2 = $('#ButtonsForMenu');
            let el3 = $('#ButtonsForTools');
            let el4 = $('#ButtonsForSettings');
            let el5 = $('#ButtonsForToolsInMap');
            let cursPos = document.getElementsByClassName('ol-mouse-position');
            if (selectedMapLayer === 'osmTileLayer') {
                //el[0].style.backgroundColor = 'white';
                el[0].style.backgroundImage = 'let(--gradientWhite)';
                el[0].style.color = 'black';
                el2[0].style.filter = 'invert(0%)';
                el3[0].style.filter = 'invert(0%)';
                el4[0].style.filter = 'invert(0%)';
                el5[0].style.filter = 'invert(0%)';
                if (cursPos && cursPos.length>0)
                    cursPos[0].style.color = 'black';
                currentLayer = osmTileLayer;
            } else if (selectedMapLayer === 'esriWSPTileLayer') {
                el[0].style.backgroundImage = 'let(--gradientBeige)';
                el[0].style.color = 'black';
                el2[0].style.filter = 'invert(0%)';
                el3[0].style.filter = 'invert(0%)';
                el4[0].style.filter = 'invert(0%)';
                el5[0].style.filter = 'invert(0%)';
                if (cursPos && cursPos.length>0)
                    cursPos[0].style.color = 'black';
                currentLayer = esriWSPTileLayer;
            } else if (selectedMapLayer === 'esriWITileLayer') {
                //el[0].style.backgroundColor = '#163e6f';
                el[0].style.backgroundImage = 'let(--gradientBlue)';
                el[0].style.color = 'beige';
                el2[0].style.filter = 'invert(100%)';
                el3[0].style.filter = 'invert(100%)';
                el4[0].style.filter = 'invert(100%)';
                el5[0].style.filter = 'invert(100%)';
                if (cursPos && cursPos.length>0)
                    cursPos[0].style.color = 'beige';
                currentLayer = esriWITileLayer;
            } else if (selectedMapLayer === 'blackTileLayer') {
                //el[0].style.backgroundColor = '#0d0d0d';
                el[0].style.backgroundImage = 'let(--gradientGray)';
                el[0].style.color = 'gray';
                el2[0].style.filter = 'invert(100%)';
                el3[0].style.filter = 'invert(100%)';
                el4[0].style.filter = 'invert(100%)';
                el5[0].style.filter = 'invert(100%)';
                if (cursPos && cursPos.length>0)
                    cursPos[0].style.color = 'gray';
                currentLayer = blackTileLayer;
            }
            let layers = my.Map.getLayerGroup().getLayers();
            layers.insertAt(0, currentLayer);
            //my.Map.addLayer(currentLayer);
        }
    };

    ////////////////////////////////////////////////////////////////////////////7
    // Set the basic map controls
    function SetMapControls() {
        // Add standard map controls
        my.Map.addControl(new ol.control.ZoomSlider());
        my.Map.addControl(new ol.control.Zoom());
        my.Map.addControl(new ol.control.FullScreen());
        my.Map.addControl(new ol.control.Rotate({autoHide: false, class:'ol-rotate'}));
        let ctrl = new ol.control.MousePosition({
            projection: App4Sea.prefProj,
            coordinateFormat: function (coord) {
                let xy = ol.proj.transform(coord, App4Sea.prefProj, App4Sea.prefViewProj);
                let str = ol.coordinate.toStringHDMS(coord);
                str = str + "<br>" + ol.coordinate.toStringXY(coord, 6);
                str = str + "<br>" + ol.coordinate.toStringXY(xy, 0);
                return str; 
            },
            undefinedHTML: ''
        });
        my.Map.addControl(ctrl);
        my.Map.addControl(new ol.control.OverviewMap({
            layers: [currentLayer],
            collapsed: true
        }));
        my.Map.addControl(new ol.control.ScaleLine());// Not correct scale
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Init all menu items
    function initMenu (){
        // Set up TreeMenu
        App4Sea.TreeMenu.SetUp();

        // Set up TreeInfo
        App4Sea.TreeInfo.SetUp();

        // Hook events to menu
        $("#MenuContainer input[type='checkbox']").click(function () {
            updateBaseMap();
        });
        $("#MenuContainer select").change(function () {
            updateBaseMap();
        });        
    };

    function InitPopup (){
        const popupContainer = document.getElementById('popup');
        const popupCloser = document.getElementById('popup-closer');

        // Create an overlay to anchor the popup to the map.
        App4Sea.PopUps.overlayLayerPopUp = InitOverlay(popupContainer, popupCloser);
    
        my.Map.addOverlay(App4Sea.PopUps.overlayLayerPopUp);

        InitToolTip();
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // InitToolTip
    function InitToolTip () {
        let map = my.Map;

        let displayFeatureInfo = function (pixel) {
            $('#ToolTipInfo').css({
                left: pixel[0] + 'px',
                top: (pixel[1] - 15) + 'px'
            });
            
            let features = [];
            
            map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                //if (App4Sea.logging) console.log('displayFeatureInfo for feature: ' + getTitle(feature));
                features.push(feature);
            });
        
            //if (App4Sea.logging) console.log('Features are: ' + features.length);

            let tips = [];
            let txt = '';
            $('#ToolTipInfo').tooltip('hide');
            let inf = $('#ToolTipInfo');
            inf.innerHTML = '';
            for (let ind = 0; ind<features.length; ind++) {
            
                let name = App4Sea.PopUps.getTitle(features[ind]);
                if (name) {
                    if (features.length === 1) {
                        txt = name;
                    }
                    else {
                        txt = txt + ind.toString() + ' '  + name + `<br>` 
                        //if (App4Sea.logging) console.log('Tooltip: ' + txt);
                    }
                    inf.tooltip('hide')
                        .attr('data-original-title', txt)
                        .tooltip('show');
                }
            } 
        };
        map.on('pointermove', function(evt) {
            if (evt.dragging) {
                $('#ToolTipInfo').tooltip('hide');
                return;
            }
            displayFeatureInfo(map.getEventPixel(evt.originalEvent));
        });

        $(map.getViewport()).on('mousemove', function (evt) {
            displayFeatureInfo(map.getEventPixel(evt.originalEvent));
        });

    };

    ////////////////////////////////////////////////////////////////////////////
    // Overlay with auto pan
    function InitOverlay (container, closer) {
        let overlay = new ol.Overlay({
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
        
    return my;
    
}());
App4Sea.OpenLayers = App4SeaOpenLayers;

export default { App4SeaOpenLayers }
