/* 
 * (c) 2018 Arni Geir Sigurðsson            arni.geir.sigurdsson(at)gmail.com
 *          Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *              Added treeview in menu (reading json over ajax) and kmz support
 *              Added tooltip, all data reading is recursive, animation stylished
 *              Refactoring a bit. Update from OpenLayers v4.6.4 to v5.1.3
 *              OpenWeatherMaps support. Flex menu.
 */
/* global ol, Mustache, zip, qwest */

var App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map) ? App4Sea.Map : {};
App4Sea.Map.OpenLayers = (function () {
    "use strict";
    var myMap;
    var currentLayer;
    var osmTileLayer;
    var esriWSPTileLayer;
    var esriWITileLayer;
    var blackTileLayer;
    var that = {};
    var zoom = 4;
    var minZoom = 2;
    var maxZoom = 18;
    var overlayLayerPopUp;// Used for popup information when clicking in icons
    var overlayDescription;// Used for layer description (e.g. legend)
    var prefProj = 'EPSG:4326';
    var prefViewProj = 'EPSG:3857'; //Default is EPSG:3857 (Spherical Mercator).
    var mapCenter = ol.proj.transform([-3, 65], prefProj, prefViewProj);//'EPSG:3857'); 
    var mapExtent = ol.proj.transformExtent([-180, 90, 180, -90], prefProj, prefViewProj);
    var networklinkarray = [];
    var layers = []; // array to hold layers as they are created    

    ////////////////////////////////////////////////////////////////////////////
    //initialize maps and models when page DOM is ready..
    function init() {
        
        myMap = initBasemapLayerTiles();

        // Update the base map
        updateBaseMap(myMap);

        initToolTip();

        initMenu();

        // Prepare animation
        //animationMapOld();        
    }

    var test = function () {
        console.log("Testing ...");

        layers.length = 0

        var pdf = 'data/2017-05-09-EPPR-COSRVA-guts-and-cover-letter-size-digital-complete.pdf';
        var btn = document.getElementById('testBtn');
        //var oNewDoc = this.extractPages({42, 42, pdf});
    };

    //https://gis.stackexchange.com/questions/121555/wms-server-with-cors-enabled/147403#147403
    (function() {
        var cors_api_host = 'cors-anywhere.herokuapp.com';
        var cors_api_url = 'https://' + cors_api_host + '/';
        var slice = [].slice;
        var origin = window.location.protocol + '//' + window.location.host;
        var open = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function() {
            var args = slice.call(arguments);
            var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
            if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
                targetOrigin[1] !== cors_api_host) {
                args[1] = cors_api_url + args[1];
            }
            return open.apply(this, args);
        };
    })();

    function initBasemapLayerTiles() {
        var popupContainer = document.getElementById('popup');
        var popupContent = document.getElementById('popup-content');
        var popupCloser = document.getElementById('popup-closer');
        var descriptionContainer = document.getElementById('legen');

        // Create an observer instance linked to the callback function
        //var observer = new MutationObserver(scaleToHeight);
        // Options for the observer (which mutations to observe)
        //var config = { attributes: true, childList: true, subtree: true };
        // Start observing the target node for configured mutations
        //observer.observe(popupContent, config);

        //popupContent.addEventListener("DOMSubtreeModified", scaleToHeight)
        //popupContent.addEventListener("DOMNodeInserted", scaleToHeight)
        //popupContent.addEventListener("DOMNodeRemoved", scaleToHeight)

        // Create an overlay to anchor the popup to the map.
        overlayLayerPopUp = initOverlay(popupContainer, popupCloser);
        // Create an overlay to anchor images to the map.
        //var overlayLayerPhotos = initOverlay(container);
        
        overlayDescription = initOverlay(descriptionContainer);

        // Init osmTileLayer base map
        osmTileLayer = new ol.layer.Tile({
            name: "osmTileLayer",
            source: new ol.source.OSM()
        });

        // Init esriWSPTileLayer base map
        esriWSPTileLayer = new ol.layer.Tile({
            name: "esriWSPTileLayer",
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/0">ArcGIS World Street Map</a>'],
////                rendermode: 'image',
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
            })
        });

        // Init esriWITileLayer base map (Satelite Images)
        esriWITileLayer = new ol.layer.Tile({
            name: "esriWITileLayer",
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0">ArcGIS World Imagery Map</a>'],
                //rendermode: 'image',
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            })
        });
        
        blackTileLayer = new ol.layer.Tile({
            name: 'blackTileLayer',
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'],
                //rendermode: 'image',
                url: 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
            })
        });        

        var interaction = new ol.interaction.DragZoom(); // create an interaction to add to the map that isn't there by default
        //
        //init OpenLayer map with MapBox tiles
        var map = new ol.Map({
            target: 'MapContainer',
            interaction: interaction,
            overlays: [overlayLayerPopUp],
            view: new ol.View({
                center: mapCenter,
                zoom: zoom,
                minZoom: minZoom,
                maxZoom: maxZoom
            })
        });
        
        // Set current base map layer
        currentLayer = esriWSPTileLayer;
        //map.addLayer(currentLayer);

        function scaleToHeight() {
            var doc = (new DOMParser).parseFromString(popupContent.innerHTML, 'text/html');
            if (doc) {
                var height = getHeight(doc);
                
                if (height !== 0) {
                    popupContent.style.height = height + 'px';
                }
            }
        }
        
         // Add a click handler to the map to render the popup.
        map.on('singleclick', function (evt) {
            var coordinate = evt.coordinate;
            //var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'));
            //popupContent.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
            var features = [];
            map.forEachFeatureAtPixel(evt.pixel, function (feature) {
                features.push(feature);
            });
            if (features.length > 0) {
                var description = features[0].get('description');
                
                if (features[0].get('navn')) {
                    description = setNorwegianOSRInfo(features);
                }else if(features[0].get('Id')){  //drake passage example
                    description = setShipPassageInfo(features);
                } 

                if (!description) {
                    description = features[0].get('name');
                }
                                
                popupContent.innerHTML = description;
                overlayLayerPopUp.setPosition(coordinate);
            } else {
                overlayLayerPopUp.setPosition(undefined);
                popupCloser.blur();
            }
        });
        
        map.on('not_working', function (evt) {
            var coordinate = evt.coordinate;
            
            // Widget 11
//            var description = "<div id='openweathermap-widget-11'></div>";
//            popupContent.innerHTML = description;
//
//            window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];//daily?lat=35&lon=139&cnt=7   cityid: '3413829',     lat:135,lon:39, cnt:5,
//            window.myWidgetParam.push({id: 11,cityid: '3413829',appid: '1326faa296b7e865683b67cdf8e5c6e4',units: 'metric',containerid: 'openweathermap-widget-11'});
//            (
//                function() {
//                    var script = document.createElement('script');
//                    script.async = true;
//                    script.charset = 'utf-8';
//                    script.src = 'http://openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js';
//                    var s = document.getElementsByTagName('script')[0];
//                    s.parentNode.insertBefore(script, s);
//                }
//            )();

            // Widget 15
            var description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
            popupContent.innerHTML = description;

            window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
            window.myWidgetParam.push({id:15, cityid: '3413829', appid:'1326faa296b7e865683b67cdf8e5c6e4', units:'metric', containerid:'openweathermap-widget-15'});
            (
                function() {
                    var script = document.createElement('script');
                    script.async = true;
                    script.charset = "utf-8";
                    script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
                    var s = document.getElementsByTagName('script')[0];
                    s.parentNode.insertBefore(script, s);
                }
            )();

            // End
            overlayLayerPopUp.setPosition(coordinate);
        });
        
        // Add standard map controls other than those spcified by interactions
        //map.addControl(new ol.control.ZoomSlider());
        //map.addControl(new ol.control.Zoom());
        //map.addControl(new ol.control.FullScreen());
        //map.addControl(new ol.control.Rotate({autoHide: true}));
        var ctrl = new ol.control.MousePosition({
            projection: prefProj,
            coordinateFormat: function (coordinate) {
                return ol.coordinate.format(coordinate, '{x}, {y}', 4);
            }
        });
        map.addControl(ctrl);
        map.addControl(new ol.control.OverviewMap({
            layers: [currentLayer],
            collapsed: true
        }));
        //map.addControl(new ol.control.ScaleLine());        Not correct scale
        
        return map;
    }
    
    function getHeight(doc) {
        var pageHeight = 0;

        function findHighestNode(nodesList) {
            for (var i = nodesList.length - 1; i >= 0; i--) {
                if (nodesList[i].scrollHeight && nodesList[i].clientHeight && nodesList[i].offsetHeight) {
                    var elHeight = Math.max(nodesList[i].scrollHeight, nodesList[i].clientHeight, nodesList[i].offsetHeight);
                    pageHeight = Math.max(elHeight, pageHeight);
                }
                if (nodesList[i].childNodes.length){
                    findHighestNode(nodesList[i].childNodes);
                }
            }
        }

        findHighestNode(doc.documentElement.childNodes);

        // The entire page height is found
        console.log('Page height is', pageHeight);

        return pageHeight;
    }

    function initOverlay(container, closer) {
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
    }
    
    function initToolTip () {
        myMap.on('pointermove', function(evt) {
            if (evt.dragging) {
                info.tooltip('hide');
                return;
            }
            displayFeatureInfo(myMap.getEventPixel(evt.originalEvent));
        });

        $(myMap.getViewport()).on('mousemove', function (evt) {
            displayFeatureInfo(myMap.getEventPixel(evt.originalEvent));
        });

        var displayFeatureInfo = function (pixel) {
            info.css({
                left: pixel[0] + 'px',
                top: (pixel[1] - 15) + 'px'
            });
            var feature = myMap.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return feature;
            });
            if (feature) {
                var name = feature.get('name');
                if (!name) {// for vaare norske venner
                    name = feature.get('navn');
                }
                if (name) {
                    info.tooltip('hide')
                            .attr('data-original-title', name)
                            .tooltip('fixTitle')
                            .tooltip('show');
                }
                else {
                    info.tooltip('hide');
                }
            } 
            else {
                info.tooltip('hide');
            }
        };
    }

    function initMenu (){
        // Set up MenuTree
        setUpMenuTree();

        // Set up InfoTree
        setUpInfoTree();

//        var button = document.getElementById('testBtn');
//        button.addEventListener('click', test, false);

        // Hook events to menu
        $(".MenuSection input[type='checkbox']").click(function () {
            updateBaseMap(myMap);
        });
        $(".MenuSection select").change(function () {
            updateBaseMap(myMap);
        });        
    }

    function setNorwegianOSRInfo (features) {
        var beredskap = {name: "", region: "", region2: "", region3: "", region4: "", address: "", link: ""};

        beredskap.name = features[0].get('navn');
        beredskap.address = features[0].get('gateadresse');
        beredskap.region = features[0].get('fylke');
        beredskap.region2 = features[0].get('kyv_region');
        beredskap.region3 = features[0].get('kommune');
        beredskap.region4 = features[0].get('lua');
        beredskap.link = features[0].get('lenke_faktaark');

        var template = $('#RescueSite').html();
        Mustache.parse(template);
        var description = Mustache.to_html(template, beredskap);
        
        return description;
    }

    function setShipPassageInfo (features) {
        var shipinfo = {name: "", callsign: "", type: "", cargotype: "", flag: ""};
        /*
        <SimpleData name="Id">0</SimpleData>
        <SimpleData name="mmsi">215739000</SimpleData>
        <SimpleData name="IMO">9.43372e+06</SimpleData>
        <SimpleData name="Name">CASTILLO-SANTISTEBAN</SimpleData>
        <SimpleData name="Call_Sign">9HA2217</SimpleData>
        <SimpleData name="Type">Tanker</SimpleData>
        <SimpleData name="Cargo_Type">Carrying DG,HS or MP,IMO hazard or Pollutant Category X</SimpleData>
        <SimpleData name="Length">300</SimpleData>
        <SimpleData name="Width">46</SimpleData>
        <SimpleData name="Flag">Malta</SimpleData>
        <SimpleData name="Destinatio">KAWAGOE</SimpleData>
        <SimpleData name="Nav_Status">Under Way Using Engine</SimpleData>
        */
        shipinfo.name =  features[0].get('Name');
        shipinfo.callsign =  features[0].get('Call_Sign');
        shipinfo.type =  features[0].get('Type');
        shipinfo.cargotype =  features[0].get('Cargo_Type');
        shipinfo.flag =  features[0].get('Flag');
        
        var template = $('#ShipInfo').html();
        Mustache.parse(template);       
        var description = Mustache.to_html(template, shipinfo);

        return description;
    }

    function drawSquare(ext) {

        var extents = { myBox: ext };
        
        var overlay = new ol.layer.Tile({
            extent: extents.myBox,
            source: new ol.source.TileJSON({
                url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
                crossOrigin: 'anonymous'
            })
        });
        
        myMap.addLayer(overlay);
      
//        var defaults = {
//            n : north,
//            s : south,
//            w : west,
//            e : east
//        };
//        var coords = $.extend(defaults);
//        var ext = new ol.extent.createEmpty();
//        ext.extend(new ol.LonLat(coords.w, coords.s));
//        ext.extend(new ol.LonLat(coords.e, coords.n));
//                
//        var boxes = new ol.Layer.Boxes("Boxes");
//        var box = new ol.Marker.Box(ext, "#008DCF", 4);
//        boxes.addMarker(box);
//        myMap.addLayer(boxes);                
                
                
//        var source = new ol.source.Vector({wrapX: false});
//
//        var vector = new ol.layer.Vector({
//          source: source
//        });
//        
//        var style = {
//          strokeColor: "#00FF00",
//          strokeOpacity: 1,
//          strokeWidth: 3,
//          fillColor: "#00FF00",
//          fillOpacity: 0.8
//       }; 
//
//       var p1 = new ol.geom.Point(west, north);
//       var p2 = new ol.geom.Point(east, north);
//       var p3 = new ol.geom.Point(east, south);
//       var p4 = new ol.geom.Point(west, south);
//       var p5 = new ol.geom.Point(west, north);
//
//       var pnt= [];
//       pnt.push(p1,p2,p3,p4,p5);
//
//       var ln = new ol.geom.LinearRing(pnt);
//       var pf = new ol.Feature.Vector(ln, null, style);
//
//       vector.addFeatures([pf]);
//       myMap.addLayer(vector);
    }

    ////////////////////////////////////////////////////////////////////////////
    //load kml and return as Vector
    // See https://developers.google.com/kml/documentation/kmlreference
    function loadKml(url) {
        //$("#DebugWindow").append("loadKml: " + url + "<br/>");
        console.log("loadKml: " + url);
        var vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: url,
                //rendermode: 'image',
                format: new ol.format.KML({
                    extractStyles: true,
                    extractAttributes: true,
                    showPointNames: false
                })
            })
        });

        // TBD also retuen an array of external kml or kmz files together with timestamps if applicable

        return vector;
    }

    ////////////////////////////////////////////////////////////////////////////
    //load kmz and return as Vector
    // See https://developers.google.com/kml/documentation/kmzarchives
    function loadKmz(url, id) {
        //$("#DebugWindow").append("loadKmz: " + url + "<br/>");
        console.log("loadKmz: " + id + " from " + url);
        repeat_kmz_calls(url, id);
    }

    function loadCityWeather(url, id) {
        //var popupContainer = document.getElementById('popup');
        var popupContent = document.getElementById('popup-content');
        //var popupCloser = document.getElementById('popup-closer');

        // Create an overlay to anchor the popup to the map.
        //var overlayLayerPopUp = initOverlay(popupContainer, popupCloser);

        var coordinate = myMap.getView().getCenter();
        
        var description = "<div id='openweathermap-widget-15' style='zoom: 0.8'></div>";
        popupContent.innerHTML = description;

        window.myWidgetParam ? window.myWidgetParam : window.myWidgetParam = [];
        window.myWidgetParam.push({id:15, cityid: '3413829', appid:'1326faa296b7e865683b67cdf8e5c6e4', units:'metric', containerid:'openweathermap-widget-15'});
        (
            function() {
                var script = document.createElement('script');
                script.async = true;
                script.charset = "utf-8";
                script.src = "//openweathermap.org/themes/openweathermap/assets/vendor/owm/js/weather-widget-generator.js";
                var s = document.getElementsByTagName('script')[0];
                s.parentNode.insertBefore(script, s);
            }
        )();

        // End
        overlayLayerPopUp.setPosition(coordinate);
    }

    function loadWeather(url, id) {
        console.log("loadWeather: " + id + " from " + url);
        
        var startResolution = ol.extent.getWidth(mapExtent) / 256 / 4;
        var resolutions = new Array(maxZoom-minZoom+1);
        for (var i = 0, ii = resolutions.length; i < ii; ++i) {
            resolutions[i] = startResolution / Math.pow(2, i);
        }
        
        var tileGrid = new ol.tilegrid.TileGrid({
            extent: mapExtent,
            origin: [mapExtent[0], mapExtent[1]],
            resolutions: resolutions,
            projection: prefViewProj,
            //minZoom: minZoom,
            //maxZoom: maxZoom,
            tileSize: [256, 256]
        });
      
        var weather = new ol.layer.Tile({
            name: id,
            preload: 0,
            opacity: 0.8,
            extent: mapExtent,
            minResolution: resolutions[resolutions.length-1],
            maxResolution: resolutions[0],
            tileGrid: tileGrid,
            source: new ol.source.XYZ({
                attributions: ['&copy; <a href="https://openweathermap.org/">Open Weather Map</a>'],
                url: url
            })
        });
        
        return weather;
    }
    ////////////////////////////////////////////////////////////////////////////
    //load an xml file and return as Vector
    function loadXMLDoc(filename) {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", filename, false);
        xhttp.send();
        return loadResonse(xhttp);
    }

    ////////////////////////////////////////////////////////////////////////////
    //load xml file and return as Vector
    function loadResonse(xml) {
        var theXmlDoc = xml.responseXML;
        return theXmlDoc;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Set up MenuTree
    // https://www.jstree.com
    // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
    // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
    function setUpMenuTree() {

        // First we load the tree based on a json file that we fetch using ajax (core)
        $('#MenuTree').jstree({
            'checkbox': {'keep_selected_style': false, 'real_checkboxes': true},
            'plugins' : ['dnd', 'checkbox', 'context'],
            'core': {
                'check_callback': function (operation, node, parent, position, more) {
//                    if(operation === "copy_node" || operation === "move_node") {
//                        if(parent.id === "#") {
//                            return false; // prevent moving a child above or below the root
//                        }
//                    };
                    
                    if (operation === 'create_node')
                        return true;
                    else
                        return true;
                },
                'themes': {
                    'dots': false,
                    'icons': false
                },
                'error': function (e) {
                    console.log('Error: ' + e.error);
                    console.log('Id: ' + e.id);
                    console.log('Plugin: ' + e.plugin);
                    console.log('Reason: ' + e.reason);
                    console.log('Data: ' + e.data);
                },
                'data': {
                    'dataType': 'json',
                    'contentType': 'application/json; charset=utf-8',
                    'cache':false,
                    url: function (node) {
                        var theUrl = node.id === '#' ?
                                'json/a4s.json' :
                                'json/' + node.id + '.json';
                        //console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    data: function (node) {
                        var nodeObj = {"id": node.id, "text": "", "path": ""};
                        if (node.id !== '#')
                        {
                            nodeObj.text = node.text;
                            nodeObj.path = node.a_attr.path;
                        }
                        console.log("Node.id: " + node.id + ", text: " + nodeObj.text + ", path: " + nodeObj.path);
                        return nodeObj;
                    }
                }
            },
//            'types' : {
//                "#" : {
//                    "max_children" : 20,
//                    "max_depth" : 5,
//                    "valid_children" : ["root"]
//                },
//                "root" : {
//                    "icon" : "/data/puffin.ico",
//                    "valid_children" : ["default"]
//                },
//                "default" : {
//                    "valid_children" : ["default","file"]
//                },
//                "file" : {
//                    "icon" : "glyphicon glyphicon-file",
//                    "valid_children" : []
//                }
//            },
            'plugins': ["checkbox"]
        });

        // 
        $('#MenuTree').on("changed.jstree", function (e, data) {
            console.log("On Action: " + data.action + " on node " + data.node.id);

            if (typeof data.node === 'undefined')
                return;

            var node = $(this).jstree('get_node', data.node.id);

            // Remove overlay
            hideMetadata();

            // Remove layer
            for (var lind = 0; lind < layers.length; lind++)
            {
                var isSel = false;
                for (var sind = 0; sind < data.selected.length; sind++) {
                    if (node.parent === '#') {
                        //var nod = $(this).jstree('get_node', data.selected[sind]);
                        //if (node.parents.length === 2) {
                            if (data.selected[sind].id === layers[lind].id) {
                                isSel = true;
                            }
                        //}
                    }
                    else {
                        if (node.id === layers[lind].id) {
                            isSel = true;
                        }
                    }
                }
                if (!isSel) {
                    myMap.removeLayer(layers[lind].vector);
                    console.log("Layer removed: " + layers[lind].id);
                }
            }

            // Add overlay
            if (node.text === 'Description' || node.text === 'Author'){
                if (node.state.selected) {
                    showMetadata(node.text, node.id, node.data);
                }
            }

            // Add layer
            for (var ind = 0; ind < data.selected.length; ind++) {
                var nod = $(this).jstree('get_node', data.selected[ind]);
                                
                // We currently do not support sublayers (below level 2 in tree)
                if (nod.parents.length > 2) {
                    ///continue;
                }
                
                var path = nod.a_attr.path;
                var heat = nod.a_attr.heat;

                if (!path || path === "") {
                    continue;
                }

                //console.log("Layer being added: " + nod.id + ": " + nod.text);
                console.log("Layer being added: " + nod.id + ": " + nod.text);

                var index = alreadyLayer(nod.id, layers);

                if (heat && heat === true) {
                    if (index === -1) {
                        var vect = heatMap(path, nod.id, nod.text);
                        layers.push({"id": nod.id, "vector" : vect});
                        console.log("Cached layers now are " + layers.length);

                        myMap.addLayer(vect);
                    } else {
                        myMap.addLayer(layers[index].vector);
                    }
                }
                else if (path.length > 3) {
                    var ext = path.substr(path.length - 3, 3);
                    if (ext === '1cd') { //6a3e86f0825c7e6e605105c24d5ec1cd
                        if (index === -1) {
                            var vect = loadWeather(path, nod.id);
                            layers.push({"id": nod.id, "vector" : vect});
                            console.log("Cached layers now are " + layers.length);

                            myMap.addLayer(vect);
                        } else {
                            myMap.addLayer(layers[index].vector);
                        }
                    }
                    else if (ext === '6e4') { //1326faa296b7e865683b67cdf8e5c6e4
                        if (index === -1) {
                            var vect = loadCityWeather(path, nod.id);
//                            layers.push({"id": nod.id, "vector" : vect});
//                            console.log("Cached layers now are " + layers.length);

//                            myMap.addLayer(vect);
                        } else {
                            myMap.addLayer(layers[index].vector);
                        }
                    }
                    else if (ext === "gif" || ext === "cgi" || ext === "wms") {
                        if (index === -1) {
                            var vect = loadImageOrTiles(true, path, nod.id, nod.text, nod.a_attr.layers,
                                nod.a_attr.width, nod.a_attr.height, nod.a_attr.start);
                            layers.push({"id": nod.id, "vector" : vect});
                            console.log("Cached layers now are " + layers.length);

                            myMap.addLayer(vect);
                        } else {
                            myMap.addLayer(layers[index].vector);
                        }
                    }
                    else if (ext === ".nc" || ext === "ncd") {
                        if (index === -1) {
                            //var vect = loadNetCDF(path, nod.id, nod.text, nod.a_attr.layers);
                            var vect = loadImageOrTiles(false, path, nod.id, nod.text, nod.a_attr.layers,
                                nod.a_attr.width, nod.a_attr.height, nod.a_attr.start);
                            layers.push({"id": nod.id, "vector" : vect});
                            console.log("Cached layers now are " + layers.length);

                            myMap.addLayer(vect);
                        } else {
                            myMap.addLayer(layers[index].vector);
                        }
                    }
                    else {// Including kmz and kml
                        if (index === -1){
                            var vect =  loadKmz(path, nod.id);
                        }
                        else{
                            myMap.addLayer(layers[index].vector);
                        }
                    }
                }
            }
        });

//        $('button').on('click', function () {
//            console.log("MenuTree click");
//            $('#jstree').jstree(true).select_node('child_node_1');
//            $('#jstree').jstree('select_node', 'child_node_1');
//            $.jstree.reference('#jstree').select_node('child_node_1');
//        });
    }
    ;

    ////////////////////////////////////////////////////////////////////////////
    // Set up setUpInfoTree
    // https://www.jstree.com
    // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
    // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
    function setUpInfoTree() {

        // First we load the tree based on a json file that we fetch using ajax (core)
        $('#InfoTree').jstree({
            'core': {
                'check_callback': false,
                //'themes' : { 'stripes' : false },
                'themes': {
                    'dots': false,
                    'icons': false
                },
                'error': function (e) {
                    console.log('Error: ' + e.error);
                    console.log('Id: ' + e.id);
                    console.log('Plugin: ' + e.plugin);
                    console.log('Reason: ' + e.reason);
                    console.log('Data: ' + e.data);
                },
                'data': {
                    url: function (node) {
                        var theUrl = node.id === '#' ?
                                'json/info.json' :
                                'json/' + node.id + '.json';
                        console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    //'type': 'GET',
                    'dataType': 'json',
                    'contentType': 'application/json; charset=utf-8',
                    'cache':false,
                    data: function (node) {
                        //console.log("Node.id: " + node.id);
                        return {'id': node.id}; //, 'parent' : node.parent };//, 'text' : node.text, 'a_attr.path' : node.a_attr.path }; 
                    }
                }
            },
//            'types' : {
//                "#" : {
//                    "max_children" : 20,
//                    "max_depth" : 20,
//                    "valid_children" : ["root"]
//                },
//                "root" : {
//                    "icon" : "/data/puffin.ico",
//                    "valid_children" : ["default"]
//                },
//                "default" : {
//                    "valid_children" : ["default","file"]
//                },
//                "file" : {
//                    "icon" : "glyphicon glyphicon-file",
//                    "valid_children" : []
//                }
//            },
            'plugins': []
        }
        );

        // 
        $('#InfoTree').on("changed.jstree", function (e, data) {
            console.log("On: " + data.selected);

            if (typeof data.node !== 'undefined')
                if (data.node.a_attr.path !== '')
                    window.open(data.node.a_attr.path);
        });

    }
    ;

    ////////////////////////////////////////////////////////////////////////////
    // alreadyLayer checks if a node is alreay in the layer array and returns
    // the index if so. Else it returns -1
    function alreadyLayer(id, arr)
    {
        var count = arr.length;
        for (var i = 0; i < count; i++)
        {
            if (arr[i].id === id) {
                return i;
            }
        }
        return -1;
    }

    ////////////////////////////////////////////////////////////////////////////
    // heatMap
    function heatMap(url, id, name) {
        var blur = document.getElementById('blur');
        var radius = document.getElementById('radius');
        var title = document.getElementById('titleHeatMap');

        title.innerHTML = name;
        var vector = new ol.layer.Heatmap({
            source: new ol.source.Vector({
                //url: 'https://openlayers.org/en/v4.6.5/examples/data/kml/2012_Earthquakes_Mag5.kml',
                url: url,
                format: new ol.format.KML({
                    extractStyles: false
                })
            }),
            blur: parseInt(blur.value, 10),
            radius: parseInt(radius.value, 10)
        });

        vector.getSource().on('addfeature', function (event) {
            // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
            // standards-violating <magnitude> tag in each Placemark.  We extract it from
            // the Placemark's name instead.
            var name = event.feature.get('name');
            var magnitude = parseFloat(name.substr(2));
            event.feature.set('weight', magnitude - 5);
        });

        blur.addEventListener('input', function () {
            vector.setBlur(parseInt(blur.value, 10));
        });

        radius.addEventListener('input', function () {
            vector.setRadius(parseInt(radius.value, 10));
        });
        
        return vector; 
    }

    ////////////////////////////////////////////////////////////////////////////
    // animationMap 
    function animationMap() {

        function toArray(list) {
            var i, array = [];
            for (i = 0; i < list.length; i++) {
                array[i] = list[i];
            }
            return array;
        }
        function getXmlValue(tag) {
            var val = tag.textContent;
            return val;
        }
        function getNetWorkLink(element) {
            var nodeTimeSpan = element.children[0];
            var nodeLink = element.children[1];

            var ts = {begin: "", end: ""};
            var nwl = {timespan: "", link: ""};

            ts.begin = getXmlValue(nodeTimeSpan.children[0]);
            ts.end = getXmlValue(nodeTimeSpan.children[1]);

            nwl.timespan = ts;
            nwl.link = getXmlValue(nodeLink.children[0]);
            if (networklinkarray.length % 2 === 1)
                nwl.link = 'data/NPA.kml';// TBD temp test to be removed

            return nwl;
        }

        var xmlDoc = loadXMLDoc('data/animation.kml');

        // The the url for next kmz
        //<kml>
        //
        //  <Document>
        //    <NetworkLink>
        //     <TimeSpan>
        //        <begin>2018-05-25T09:00:00Z</begin>
        //        <end>2018-05-25T10:00:00Z</end>
        //      </TimeSpan>
        //      <Link>
        //        <href>http://mw1.google.com/mw-weather/clouds/20180525_0900/root.kmz</href>
        //      </Link>
        //    </NetworkLink>        

        var docSection = xmlDoc.getElementsByTagName("Document")[0];
        var networkLinks = toArray(docSection.childNodes);

        var length = networkLinks.length - 1;
        for (var ind = 0; ind < length; ind += 2) {
            networklinkarray[ind / 2] = getNetWorkLink(networkLinks[ind + 1]);
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // showMetadata
    function showMetadata(title, id, data) {

        var elem = document.getElementById('legend');
        elem.innerHTML = data;
        
        var pos = ol.proj.fromLonLat([0, 55]);
        var overlay = new ol.Overlay({
          position: pos,
          positioning: 'center-center',
          element: elem,
          stopEvent: false
        });
        
        myMap.addOverlay(overlay);
    }
    
    function hideMetadata() {
        var elem = document.getElementById('legend');
        elem.innerHTML = "";
    }
    ////////////////////////////////////////////////////////////////////////////
    // loadImageOrTiles
    function loadImageOrTiles(image, url, id, name, layers, width, height, start) {

        function someHoursAgo(hours) {
            return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * hours);
        }

        function initInfo() {
            var el = document.getElementById('start');
            el.innerHTML = startDate.toLocaleTimeString('de-DE');
            el = document.getElementById('current');
            el.innerHTML = currentDate.toLocaleTimeString('de-DE');
            el = document.getElementById('end');
            el.innerHTML = endDate.toLocaleTimeString('de-DE');

            el = document.getElementById('startDate');
            el.innerHTML = startDate.toLocaleDateString('en-US', dateOpt);
            el = document.getElementById('currentDate');
            el.innerHTML = currentDate.toLocaleDateString('en-US', dateOpt);
            el = document.getElementById('endDate');
            el.innerHTML = endDate.toLocaleDateString('en-US', dateOpt);
        }

        function updateInfo() {
            var el = document.getElementById('current');
            el.innerHTML = currentDate.toLocaleTimeString('de-DE');

            el = document.getElementById('currentDate');
            el.innerHTML = currentDate.toLocaleDateString('en-US', dateOpt);

            var progress = document.getElementById('progress');
            progress.value = parseInt(progress.value, 10) + 1;
            console.log("Progress " + progress.value);
        }

        function setTime() {
            currentDate.setMinutes(currentDate.getMinutes() + 15);
            if (currentDate > Date.now()) {
                currentDate = someHoursAgo(3);
            }
            layer.getSource().updateParams({'TIME': currentDate.toISOString()});
            updateInfo();
        }
        
        var playStop = function () {
            stop();

            var btnImg = document.getElementById('playStopImg');
            if (btnImg.src === "icons\play.png") { // Playing
                btnImg.src = "icons\stop.png";
                animationId = window.setInterval(setTime, 1000 / frameRate);
            } else { // Stopping
                btnImg.src = "icons\play.png";

                if (animationId !== null) {
                    window.clearInterval(animationId);
                    animationId = null;
                }
            }
        };

        var button = document.getElementById('playStop');
        button.addEventListener('click', playStop, false);

        var dateOpt = {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'};
        var endDate = someHoursAgo(0);
        var startDate = someHoursAgo(3);
//        if (start) {
//            var date = new Date(start);
//            startDate = new Date(Math.round(date/ 3600000) * 3600000);
//        }
        var currentDate = startDate;
        var frameRate = 0.2; // frames per second
        var animationId = null;

        document.getElementById('title').innerText = name;

        var startResolution = ol.extent.getWidth(mapExtent) / width / 4;
        var resolutions = new Array(maxZoom-minZoom+1);
        for (var i = 0, ii = resolutions.length; i < ii; ++i) {
            resolutions[i] = startResolution / Math.pow(2, i);
        }
        
        var source;
        var layer;
        
        if (image === true) {
            source = new ol.source.ImageWMS({
                url: url,
                tileGrid: tileGrid,
                serverType: 'geoserver',
                params: {'LAYERS': layers}
            });

            layer = new ol.layer.Image({
                attributions: [name],
                extent: mapExtent,
                source: source
            });
        } else {
            var tileGrid = new ol.tilegrid.TileGrid({
                extent: mapExtent,
                origin: [mapExtent[0], mapExtent[1]],
                maxZoom: maxZoom,
                minZoom: minZoom,
                resolutions: resolutions,
                projection: prefViewProj,
                tileSize: [height, width]
            });
            
            source = new ol.source.TileWMS({
                url: url,
                tileGrid: tileGrid,
                serverType: 'geoserver',
                params: {'LAYERS': layers, 'TILED' : true}
            });

            layer = new ol.layer.Tile({
                attributions: [name],
                extent: mapExtent,
                source: source
            });
        }

        initInfo();

        setTime();
        
        return layer;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Update base map
    function updateBaseMap(map) {
        // Set base map
        var selectedMapLayer = $("#MenuLayer_Select").val();
        if (selectedMapLayer !== currentLayer.name) {
            map.removeLayer(currentLayer);
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
            map.addLayer(currentLayer);
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Put a text on the window with location info for where you clicked
    function onMapClick(e) {
        $("#DebugWindow").append("[" + e.latlng.lat + "," + e.latlng.lng + "],<br/>");
    }

    ////////////////////////////////////////////////////////////////////////////
    /// KMZ start
    // https://rawgit.com/webgeodatavore/ol3-extras-demos/master/kmz/static/js/demo-kmz.js
    // 
    // 
    ////////////////////////////////////////////////////////////////////////////


    // Declare worker scripts path for zip manipulation
    zip.workerScriptsPath = 'static/js/';

    ////////////////////////////////////////////////////////////////////////////
    //load kml and return as Vector
    // See https://developers.google.com/kml/documentation/kmlreference
    function loadKmlText(text, id, name) {
        console.log("loadKmlText: " + name);

        var formatter = new ol.format.KML({
            extractStyles: true,
            extractAttributes: true,
            showPointNames: false
        });

        var proj = formatter.readProjection(text);
        if (proj !== null)
            console.log("Projection: " + proj.wb);

        var kml_features = formatter.readFeatures(text, {
            dataProjection: prefProj, //Projection of the data we are reading.
            featureProjection: prefViewProj//Projection of the feature geometries created by the format reader.
        });

        console.log("kml_features are: " + kml_features.length);
        
//        if (kml_features.length > 0) {
//            var description = kml_features[0].get('description');
//            
//            if (description) {
//                addChild('Description', description, $('#MenuTree'), id, false);
//            }
//        }

        var vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                //rendermode: 'image',
                format: formatter
            })
        });
        vector.getSource().addFeatures(kml_features);

        return vector;
    }

// Url to KMZ file (in fact, it's a kml zipped file and not a gzipped file)
// var url = 'http://www.spc.noaa.gov/products/watch/ActiveWW.kmz';
// var url = '/proxy/www.spc.noaa.gov/products/watch/ActiveWW.kmz';

    function b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }
    
// Function to ease KML feature reading
    function addFeatures(text, name, id) {
        if (!name.endsWith("kml")) {
//                var uInt8Array = new Uint8Array(text);
//    var i = uInt8Array.length;
//    var binaryString = new Array(i);
//    while (i--)
//    {
//      binaryString[i] = String.fromCharCode(uInt8Array[i]);
//    }
//    var data = binaryString.join('');
//
//    var base64 = window.btoa(data);
            
            if (name.endsWith("mp3")) {
                console.log("Not handling video for now");
                return;
            }
            
            // convert to Base64
            var blob;
            if (text.type && text.type === 'application/octet-stream') {
                blob = text;
            }
            else {
                var str;
                str = text.replace(/[\u00A0-\u2666]/g, function(c) {
                    return '&#' + c.charCodeAt(0) + ';';
                });
                var base64 = btoa(unescape(encodeURIComponent(str)));
                var end = name.substr(name.lastIndexOf('.')+1);
                blob = b64toBlob(base64, "image/" + end);
                //var blob = new Blob( [ base64 ], { type: "image/" + end } );
            };
            
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL( blob );
            
            //document.getElementById("photo").src = 'data:image/' + end + ';base64,' + base64;
            var img = document.querySelector( "#photo" );
            img.src = imageUrl;

            console.log("addFeatures image: " + id + " in file " + name + " DONE");
            return;
        }
        
        //console.log(text); // log the whole kml file
        var vect = loadKmlText(text, id, name);
        
        layers.push({"id": id, "vector": vect});
        console.log("Cached layers now are " + layers.length);

        myMap.addLayer(vect);

        console.log("addFeatures: " + id + " in file " + name + " DONE");
    }

    function addChild (text, data, tree, parNode, disabled, icon) {
        var newNode = { state: {"closed" : true, "checkbox_disabled" : false, "disabled" : false}, 
            icon: icon, text: text, data: data, selected: true, children : false };
        var retVal = tree.jstree(true).create_node(parNode, newNode, 'last', false, false);
        console.log("Adding " + text + " to tree under " + parNode + " returned " + retVal);
        return retVal;
    }

// Function to parse KML text to get link reference to list any other 
// nested files (kmz or kml)
    function parseKmlText(text, id) {
        //console.log("parseKmlText: " + text);
        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString(text, 'text/xml');
        var links = oDOM.querySelectorAll('NetworkLink Link href');
        var urls = oDOM.querySelectorAll('NetworkLink Url href');

        var kml = oDOM.querySelector('kml');
        
        function getName(children, defaultName) {
            for (var ind=0; ind<children.length; ind++){
                if (children[ind].nodeName === 'name')
                    return children[ind].innerHTML;
            }
            return defaultName;
        }
        
        function addOverlay(overlay, id) {
            var href = overlay.querySelector('Icon href');
            var url;
            var image;
            
            if (href)
                url = href.innerHTML;

            if (overlay.nodeName === "ScreenOverlay") {
                console.log("ScreenOverlay: " + url);
                if (url) {
                    var name, nameIs;
                    var name = overlay.querySelector('name');
                    if (name)
                        nameIs = name.innerHTML;

                    var overlayXY = overlay.querySelector('overlayXY');
                    var screenXY = overlay.querySelector('screenXY');
                    var rotationXY = overlay.querySelector('rotationXY');
                    var size = overlay.querySelector('size');

                    var legend = $("#Legend");
                    legend.href = url;
                    legend.style = {diplay : 'block'};
                
//                var imageExtent = ol.proj.transformExtent([west, south, east, north], prefProj, prefViewProj);
//
//                image = new ol.layer.Image({
//    //                extent: mapExtent,
//    //                origin: [mapExtent[0], mapExtent[1]],
//                    source: new ol.source.ImageStatic({
//                        url: url,
//                        crossOrigin: '',
//                        //projection: 'EPSG:27700',
//                        imageExtent: imageExtent
//                    })
//                });
                }
            }
            else if (overlay.nodeName === "PhotoOverlay") {
                console.log("PhotoOverlay: " + url);
                return;
            }
            else { // GroundOverlay
                var west = parseFloat(overlay.querySelector('west').innerHTML);
                var south = parseFloat(overlay.querySelector('south').innerHTML);
                var east = parseFloat(overlay.querySelector('east').innerHTML);
                var north = parseFloat(overlay.querySelector('north').innerHTML);

                var imageExtent = ol.proj.transformExtent([west, south, east, north], prefProj, prefViewProj);
                
                var name, nameIs;
                var name = overlay.querySelector('name');
                if (name)
                    nameIs = name.innerHTML;

                image = new ol.layer.Image({
                    name: nameIs,
    //                extent: mapExtent,
    //                origin: [mapExtent[0], mapExtent[1]],
                    source: new ol.source.ImageStatic({
                        url: url,
                        crossOrigin: '',
                        //projection: 'EPSG:27700',
                        imageExtent: imageExtent
                  })
                });
            }
            //drawSquare(imageExtent);

            if (image) {
                layers.push({"id": id, "vector" : image});
                console.log("Cached layers now are " + layers.length);

                myMap.addLayer(image);
            }
        }
        
        function listChildren(id, children){

            for(var cind=0; cind<children.length; cind++){

                var child = children[cind];
                var newId;

                if (child.nodeName === 'name'){
//                    var name = child;
//                    if(name.innerHTML !== "") {
//                        newId = addChild('Name', name.innerHTML, tree, id, true);
//                    }
                }
                else if (child.nodeName === 'description') {
                    var description = child;
                    if (description.innerHTML !== "") {
                        newId = addChild('Description', description.innerHTML, $('#MenuTree'), id, false, 'icons/description.png');
                    }
                }
                else if (child.nodeName === 'author') {
                    var author = child;

                    var authText = "<p>";
                    for (var aind=0; aind<author.children.length; aind++){
                        if (aind !== 0)
                            authText += "<br/>";
                        authText += author.children[aind].innerHTML;
                    }
                    authText += "</p>";
                    newId = addChild('Author', authText, $('#MenuTree'), id, false, 'icons/author.png');
                }
                else if(child.nodeName === 'Folder' ||
                        //child.nodeName === 'NetworkLink' ||
                        child.nodeName === 'Document') {
                    newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#MenuTree'), id, true, 'icons/folder.png');
                } 
                else if(child.nodeName === 'Placemark') { // Can move this later to a selectable section TBD
                    newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#MenuTree'), id, true, 'icons/placemark.png');
                } 
                else if(child.nodeName === 'GroundOverlay' ||
                        child.nodeName === 'PhotoOverlay' ||
                        child.nodeName === 'ScreenOverlay') {
                    newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#MenuTree'), id, false, 'icons/overlay.png');
                    addOverlay(child, newId);
                } 
                else {
                    //console.log("Not handling " + child.nodeName);
                }
                
                if (child.children && child.children.length > 0) {
                    var cur = child;
                    var predecessors = [];
                    var par = cur.parentNode;
                    while (par) {
                        predecessors.push(par);
                        par = par.parentNode;
                    }
                    if (predecessors && predecessors.length<4)
                        listChildren(newId, child.children);
                }
            };
        }
        
        if (kml) {
            listChildren(id, kml.children);
        }
        
        var files = Array.prototype.slice.call(links).map(function (el) {
            return el.textContent;
        });

        if (links.length === 0 && urls.length !== 0) {
            files = Array.prototype.slice.call(urls).map(function (el) {
                return el.textContent;
            });
        }

        console.log("NetworkLink files: " + files.length);
        return files;
    }

// Function to unzip content from blob and execute callback on
// first entry (not generic but assumed for the demo)
    function unzipFromBlob(callback, id) {        
        return function unzip(blob) {
            // use a BlobReader to read the zip from a Blob object
            zip.createReader(new zip.BlobReader(blob),
                function (reader) {
                    // get all entries (array of objects) from the zip
                    reader.getEntries(function (entries) {
                        console.log("Got entries: " + entries.length);
                        for (var ind = 0; ind < entries.length; ind++) {
                            var str = entries[ind].filename.toLowerCase();

                            var extendedCallback = function (str1, id1) {
                                console.log("extendedCallback for " + id1 + " at " + str1);
                                return function (text) {
                                    // text contains the entry data as a String
                                    console.log("About to call back " + str1);
                                    callback(text, str1, id1);
                                };
                            };

                            console.log("Entry " + ind + ": " + str);
                            // there is always only one KML in KMZ, namely the doc.kml (name can differ).
                            // we get the kml content as text
                            //console.log("unzipFromBlob entry " + str + "[" + entries[ind].compressedSize + " -> " + entries[ind].uncompressedSize + "]");
                            entries[ind].getData(/* writer, onend, onprogress, checkCrc32 */
                                new zip.TextWriter(),
                                extendedCallback (str, id),
                                function (current, total) {
                                    // onprogress callback
                                    //$("#DebugWindow").append("unzipFrom Blob Total: " + total.toString() + "<br/>");
                                    //console.log("unzipFromBlob Total: " + total.toString() + ", Current: " + current.toString());
                                }
                            );
                        }
                    });
                },
                function (error) {
                    // onerror callback (error is of type Event)
                    //$("#DebugWindow").append("unzipFromBlob Error: " + error + "<br/>");
                    console.log("unzipFromBlob Error: " + error);
                });
        };
    }

    // Fix for ie11 not supporting endsWith (polyfill)
    //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith
    if (!String.prototype.endsWith) {
      String.prototype.endsWith = function(searchString, position) {
          var subjectString = this.toString();
          if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
            position = subjectString.length;
          }
          position -= searchString.length;
          var lastIndex = subjectString.indexOf(searchString, position);
          return lastIndex !== -1 && lastIndex === position;
      };
    }

    function parseURL(url) {
        var parser = document.createElement('a'),
            searchObject = {},
            queries, split, i;
        // Let the browser do the work
        parser.href = url;
        // Convert query string to object
        queries = parser.search.replace(/^\?/, '').split('&');
        for( i = 0; i < queries.length; i++ ) {
            split = queries[i].split('=');
            searchObject[split[0]] = split[1];
        }
        return {
            protocol: parser.protocol,
            host: parser.host,
            hostname: parser.hostname,
            port: parser.port,
            pathname: parser.pathname,
            search: parser.search,
            searchObject: searchObject,
            hash: parser.hash
        };
    }

   
// Function to make ajax call and make a callback on success
    function ajaxKMZ(url, id, callback) {
        //$("#DebugWindow").append("ajaxKMZ: " + url + "<br/>");
        //console.log("ajaxKMZ: " + url);

        // See: https://github.com/pyrsmk/qwest for get documentation
        // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS for Cors documentation
        // See: https://remysharp.com/2011/04/21/getting-cors-working
        qwest.get(url, null, {
            responseType: 'blob',
            timeout: 2000,
//            headers: {'x-requested-with': 'XMLHttpRequest'
//            }
        })
        .then(function (response) {
            // Run when the request is successful
            //$("#DebugWindow").append("ajaxKMZ Response: " + response + "<br/>");
            //console.log("ajaxKMZ OK: " + url);

            var str = url.toLowerCase();
            if (str.endsWith("kml") && typeof (response) === "object") {
                var reader = new FileReader();

                var extendedCallback = function (str1, id1) {
                    return function (e) {
                        var text = e.srcElement.result;
                        callback(text, str1, id1);
                    };
                };

                // This fires after the blob has been read/loaded.
                reader.addEventListener('loadend', extendedCallback(str, id));

                // Start reading the blob as text.
                reader.readAsText(response);
            } else {
                callback(response, str, id);
            }
        })
        .catch(function (e, url) {
            //$("#DebugWindow").append("ajaxKMZ Error: " + e + "<br/>" + url + "<br/>");
            console.log("ajaxKMZ Error: " + e + ": " + url);
            // Process the error
        })
        .complete(function () {
            // Always run
            //console.log("ajaxKMZ DONE: " + url);
        });
    }

// Read reference to other KMZ and add them to the vector layer
    var readAndAddFeatures = function (text, name, id) {
        console.log("readAndAddFeatures >>>> " + id + " from file " + name);

        var str = name.toLowerCase();
        
        if (str.endsWith("kml")) {
            var listFilesNested = parseKmlText(text, id);
            if (listFilesNested.length === 0) {
                //console.log("No nested files");
                addFeatures(text, str, id);
            };

            console.log("listFilesNested are " + listFilesNested.length);
            listFilesNested.forEach(function (el) {
                console.log("readAndAddFeatures ----------");
                // Nested calls. Acceptable for a demo
                // but could be "promisified" instead
                str = el.toLowerCase();
                if (str.endsWith("kmz")) {
                    console.log("readAndAddFeatures kmz element: " + el);
                    ajaxKMZ(el, id, unzipFromBlob(readAndAddFeatures, id));
                } else {
                    console.log("readAndAddFeatures kml element: " + el);
                    ajaxKMZ(el, id, readAndAddFeatures);//kml and other
                }
            });
            console.log("readAndAddFeatures <<<<");
        }
        else {
            console.log("Should store file in " + name);
//            console.log("Storing file in " + name);
//            var cors_api_url = 'https://cors-anywhere.herokuapp.com/';
//            var url = 'http://localhost:11546/WriteFile.php';
//            var xhr = new XMLHttpRequest();//createCORSRequest('POST', url);
//            if (!xhr) {
//              throw new Error('CORS not supported in your browser. Please upgrade your browser or try another one.');
//            }
//            else {
//                // Response handlers.
//                 xhr.onload = function() {
//                    var text = xhr.responseText;
//                    alert('Response from CORS request to ' + url + ': ' + text);
//                };
//
//                xhr.open('POST', cors_api_url+url);
//                //xhr.setRequestHeader('origin', 'ourUrl'); We can not set this, but the browser does
//                xhr.setRequestHeader('x-requested-with', 'XMLHttpRequest');
//                xhr.setRequestHeader('Content-Type', 'text/plain');
//                xhr.send('F='+name+'&D='+text);
//            }
        }
        console.log("readAndAddFeatures <<<<");
    };

    function createCORSRequest(method, url) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

      } else if (typeof XDomainRequest != "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

      } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;

      }
      return xhr;
    }

    function repeat_kmz_calls(url, id) {
        //$("#DebugWindow").append("repeat_kmz_calls: " + url + "<br/>");
        //console.log("repeat_kmz_calls: " + url);

        // make the ajax call to kmz that unzip and read the file
        // this file reference other KMZ so we call each of them
        // and add their content
        var str = url.toLowerCase();
        if (str.endsWith("kmz")) {
            console.log("readAndAddFeatures kmz element: " + url);
            ajaxKMZ(url, id, unzipFromBlob(readAndAddFeatures, id));
        } else {
            console.log("readAndAddFeatures non-kmz element: " + url);
            ajaxKMZ(url, id, readAndAddFeatures);//kml
        }
    }

//vectorKMZ.on('render', function (event) {
//    //console.log("Render event: " + event);
//    var ctx = event.context;
//    ctx.fillStyle = "red";
//    ctx.font = "72px Arial";
//    // get the metrics with font settings
//    var metrics = ctx.measureText("WaterMark Demo");
//    var width = metrics.width;
//
//    if (vectorKMZ.getSource().getFeatures().length === 0) {
//        ctx.fillText("WaterMark Demo", ctx.canvas.width / 2 - (width / 2), ctx.canvas.height / 2);
//    }
//    ctx.restore();
//});

    that.Init = init;

    return that;
})();

$(document).ready(function () {
    console.log("Ready ==============================================================================");
    App4Sea.Map.OpenLayers.Init();
});

$( window ).on( "load", function() {
    console.log( "window loaded" );

    //$("#MenuTree").jstree(true).close_all(); Does come too early => does not work
});

