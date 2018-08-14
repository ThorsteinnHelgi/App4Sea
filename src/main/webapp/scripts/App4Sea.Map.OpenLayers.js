/* 
 * (c) 2018 Arni Geir Sigurðsson            arni.geir.sigurdsson(at)gmail.com
 *          Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *              Added treeview in menu (reading json over ajax) and kmz support
 *              Added tooltip, all data reading is recursive, animation stylished
 */
/* global ol, Mustache, zip, qwest */

//import ImageLayer from 'ol/layer/Image.js';
//import Projection from 'ol/proj/Projection.js';
//import Static from 'ol/source/ImageStatic.js';

var App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map) ? App4Sea.Map : {};
App4Sea.Map.OpenLayers = (function () {
    "use strict";
    var myMap;
    //var imageLayer;

    var currentLayer;
    var osmTileLayer;
    var esriWSPTileLayer;
    var esriWITileLayer;
    var cloudNow;
    var that = {};
    var zoom = 4;
    var prefProj = 'EPSG:4326';
    var prefViewProj = 'EPSG:3857'; //Default is EPSG:3857 (Spherical Mercator).
    var center = ol.proj.transform([-3, 65], prefProj, prefViewProj);//'EPSG:3857'); 
    var interaction = new ol.interaction.DragRotateAndZoom(); // create an interaction to add to the map that isn't there by default
    var timespan = {begin: "", end: ""};
//    var networklink = {timespan, link: ""};
    var networklinkarray = [];
    var indNow = 0;
    var layers = []; // array to hold layers as they are created    
    //var layerNode = { id: "", text: "", path: "" };

    ////////////////////////////////////////////////////////////////////////////
    //initialize maps and models when page DOM is ready..
    function init() {

        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');
        var closer = document.getElementById('popup-closer');
        
        // Create an overlay to anchor the popup to the map.
        var overlay = new ol.Overlay({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 1000
            }
        });

//        imageLayer = new ol.ImageLayer({
//            source: new ol.Static({
//                //attributions: '© <a href="http://xkcd.com/license.html">xkcd</a>',
//                //url: 'https://imgs.xkcd.com/comics/online_communities.png',
//                projection: projection,
//                imageExtent: extent
//            })
//        });

        // Add a click handler to hide the popup.
        // @return {boolean} Don't follow the href.
        closer.onclick = function () {
            overlay.setPosition(undefined);
            closer.blur();
            return false;
        };

        //init OpenLayer map with MapBox tiles
        myMap = new ol.Map({
            target: 'MapContainer',
            interaction: interaction,
            overlays: [overlay],
            view: new ol.View({
                center: center,
                zoom: zoom,
                minZoom: 2,
                maxZoom: 18
            })
        });

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
        };        //        myMap.addLayer(imageLayer);
 
        // Add a click handler to the map to render the popup.
        myMap.on('singleclick', function (evt) {
            var coordinate = evt.coordinate;
            //var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'));
            //content.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
            var features = [];
            myMap.forEachFeatureAtPixel(evt.pixel, function (feature) {
                features.push(feature);
            });
            if (features.length > 0) {
                var description = features[0].get('description');
                var template;

                if (features[0].get('navn')) {
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
                    description = Mustache.to_html(template, beredskap);
                }
//                else {
//                    var template = $('#DefaultPop').html();
//                    var cont = {"description": description};
//                    Mustache.parse(template);
//                    description = Mustache.to_html(template, cont);
//                }
//                content.style.paddingTop = "50px";
//                content.style.backgroundColor = "#ffffff";
                content.innerHTML = description;

                overlay.setPosition(coordinate);
            } else {
                overlay.setPosition(undefined);
                closer.blur();
            }
        });

        // Init osmTileLayer base map
        osmTileLayer = new ol.layer.Tile({
            source: new ol.source.OSM()
        });
        osmTileLayer.name = "osmTileLayer";

        // Init esriWSPTileLayer base map
        var attributionESRIWSM = new ol.Attribution({
            html: 'Tiles &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/0">ArcGIS</a>'
        });

        esriWSPTileLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                attributions: [attributionESRIWSM],
                rendermode: 'image',
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
            })
        });
        esriWSPTileLayer.name = "esriWSPTileLayer";

        // Init esriWITileLayer base map
        var attributionWIM = new ol.Attribution({
            html: 'Tiles &copy; <a href="https://http://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0">ArcGIS</a>'
        });
        esriWITileLayer = new ol.layer.Tile({
            source: new ol.source.XYZ({
                attributions: [attributionWIM],
                rendermode: 'image',
                url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            })
        });
        esriWITileLayer.name = "esriWITileLayer";

        // Set current base map layer
        currentLayer = esriWSPTileLayer;
        myMap.addLayer(currentLayer);

        // Set up MenuTree
        setUpMenuTree();

        // Set up InfoTree
        setUpInfoTree();

        // Prepare animation
        //animationMapOld();

        // Test heatMap
        heatMap();

        // Add standard map controls
        myMap.addControl(new ol.control.ZoomSlider());
        myMap.addControl(new ol.control.Zoom());
        //myMap.addControl(new ol.control.FullScreen());
        myMap.addControl(new ol.control.Rotate({autoHide: true}));
        var ctrl = new ol.control.MousePosition({
            projection: prefProj,
            coordinateFormat: function (coordinate) {
                return ol.coordinate.format(coordinate, '{x}, {y}', 4);
            }
        });
        myMap.addControl(ctrl);
        myMap.addControl(new ol.control.OverviewMap({
            layers: [currentLayer],
            collapsed: false
        }));
        //myMap.addControl(new ol.control.ScaleLine());        Not correct scale

        // Hook events to menu
        $(".MenuSection input[type='checkbox']").click(function () {
            update();
        });
        $(".MenuSection select").change(function () {
            update();
        });

        // Update the page
        update();
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
                rendermode: 'image',
                format: new ol.format.KML({
                    extractStyles: true,
                    extractAttributes: true,
                    showPointNames: true
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
            'core': {
                'check_callback': false,
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
                                'data/a4s.json' :
                                'data/' + node.id + '.json';
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
            console.log("On Action: " + data.action);

            if (typeof data.node === 'undefined')
                return;

            for (var lind = 0; lind < layers.length; lind++)
            {
                var isSel = false;
                for (var sind = 0; sind < data.selected.length; sind++) {
                    if (data.selected[sind].id === layers[lind].id) {
                        isSel = true;
                    }
                }
                if (!isSel) {
                    myMap.removeLayer(layers[lind].vector);
                    console.log("Layer removed: " + layers[lind].id);
                }
            }

            // Add layer
            for (var ind = 0; ind < data.selected.length; ind++) {
                var nod = $(this).jstree('get_node', data.selected[ind]);
                var path = nod.a_attr.path;

                if (path === "" || nod.children.length > 0) {//This is a folder/parent node
                    continue;
                }

                console.log("Layer being added: " + nod.text);

                var index = alreadyLayer(nod.id, layers);

                if (path.length > 3) {
                    var ext = path.substr(path.length - 3, 3);
                    //if (ext === "kmz") {
                    if (index === -1) {
                        var vect = loadKmz(path, nod.id);
                    } else {
                        myMap.addLayer(layers[index].vector);
                    }
//                    }
//                    else {
//                        if (index === -1){
//                            var vect =  loadKml(path);
//                            layers.push({"id": nod.id, "vector" : vect});
//
//                            myMap.addLayer(vect);
//                        }
//                        else{
//                            myMap.addLayer(layers[index].vector);
//                        }
//                    }
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
                                'data/info.json' :
                                'data/' + node.id + '.json';
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
    function heatMap() {
        var blur = document.getElementById('blur');
        var radius = document.getElementById('radius');

        var vector = new ol.layer.Heatmap({
            source: new ol.source.Vector({
                //url: 'https://openlayers.org/en/v4.6.5/examples/data/kml/2012_Earthquakes_Mag5.kml',
                url: 'data/2012_Earthquakes_Mag5.kml',
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

        myMap.addLayer(vector);

        blur.addEventListener('input', function () {
            vector.setBlur(parseInt(blur.value, 10));
        });

        radius.addEventListener('input', function () {
            vector.setRadius(parseInt(radius.value, 10));
        });
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
    // animationGo starts the animation
    function animationGo() {
        var frameRate = 0.5; // frames per second
        var animationId = null;

        ///function someHoursAgo(hours) {
        // return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * hours);
        //}

        var extent = ol.proj.transformExtent([-126, 24, -66, 50], prefProj, prefViewProj);//'EPSG:3857');
        //var startDate = someHoursAgo(3);

        //var cloudTileLayer = new ol.layer.Tile({
        //  extent: extent,
        //source: new ol.source.TileWMS({
        //  attributions: ['Animated Google Cloude Maps'],
        //url: networklinkarray[indNow].link
//            })
        //      });

        function setTime() {
            function updateInfo() {
                var el = document.getElementById('info');
                el.innerHTML = indNow.toString() + '<br>' +
                        networklinkarray[indNow].timespan.begin + '<br>' +
                        networklinkarray[indNow].timespan.end + '<br>' +
                        networklinkarray[indNow].link;
            }

            var cloudVector;
            var link = networklinkarray[indNow].link;

            if (link.length > 3) {
                var ext = link.substr(link.length - 3, 3);
                if (ext === "kmz")
                    cloudVector = loadKmz(networklinkarray[indNow].link);
                else
                    cloudVector = loadKml(networklinkarray[indNow].link);
            }
            myMap.removeLayer(cloudNow);
            myMap.addLayer(cloudVector);
            cloudNow = cloudVector;

            updateInfo();

            indNow++;
            if (indNow > networklinkarray.length - 1)
                indNow = 0;
        }

        setTime();

        var stop = function () {
            if (animationId !== null) {
                window.clearInterval(animationId);
                animationId = null;
            }
        };

        var play = function () {
            stop();
            animationId = window.setInterval(setTime, 1000 / frameRate);
        };

        var startButton = document.getElementById('play');
        startButton.addEventListener('click', play, false);

        var stopButton = document.getElementById('pause');
        stopButton.addEventListener('click', stop, false);
    }

    ////////////////////////////////////////////////////////////////////////////
    // animationMapOld 
    function animationMapOld() {

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
            cloudTileLayer.getSource().updateParams({'TIME': currentDate.toISOString()});
            updateInfo();
        }

        var playStop = function () {
            stop();

            var btn = document.getElementById('playStop');
            if (btn.innerText === "Play") { // Playing
                btn.innerText = "Stop";
                animationId = window.setInterval(setTime, 1000 / frameRate);
            } else { // Stopping
                btn.innerText = "Play";

                if (animationId !== null) {
                    window.clearInterval(animationId);
                    animationId = null;
                }
            }
        };

        var button = document.getElementById('playStop');
        button.addEventListener('click', playStop, false);

        var dateOpt = {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'};
        var extent = ol.proj.transformExtent([-126, 24, -66, 50], prefProj, prefViewProj);
        var endDate = someHoursAgo(0);
        var startDate = someHoursAgo(3);
        var currentDate = startDate;
        var frameRate = 0.2; // frames per second
        var animationId = null;

        document.getElementById('title').innerText = "Animated Google Cloude Maps";

        var cloudTileLayer = new ol.layer.Tile({
            extent: extent,
            source: new ol.source.TileWMS({
                attributions: ['Animated Google Cloude Maps'],
                //url: 'data/animation.kml',
                url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi',
                params: {'LAYERS': 'nexrad-n0r-wmst'}
            })
        });

        myMap.addLayer(cloudTileLayer);
        initInfo();

        setTime();
    }

    ////////////////////////////////////////////////////////////////////////////
    // Update layers
    function update() {
        // Set base map
        var selectedMapLayer = $("#MenuLayer_Select").val();
        if (selectedMapLayer !== currentLayer.name) {
            myMap.removeLayer(currentLayer);
            if (selectedMapLayer === 'osmTileLayer') {
                currentLayer = osmTileLayer;
            } else if (selectedMapLayer === 'esriWSPTileLayer') {
                currentLayer = esriWSPTileLayer;
            } else if (selectedMapLayer === 'esriWITileLayer') {
                currentLayer = esriWITileLayer;
            }
            myMap.addLayer(currentLayer);
        }

        //animationGo();
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
    function loadKmlText(text, name) {
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
            //dataProjection: proj.wb,//'EPSG:4326'//, //Projection of the data we are reading.
            //featureProjection: proj.wb//'EPSG:3857' // Projection of the feature geometries created by the format reader.
            dataProjection: prefProj, //Projection of the data we are reading.
            featureProjection: prefViewProj//'EPSG:3857' // Projection of the feature geometries created by the format reader.
        });

        console.log("kml_features are: " + kml_features.length);
        
        if (kml_features.length > 0) {
            var description = kml_features[0].get('description');
            
            if (description) {
                document.getElementById("DebugWindow").innerHTML=description;

                //$("#DebugWindow").val(description);
            }
        }

        // http://geoadmin.github.io/ol3/apidoc/ol.layer.Vector.html
        var vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                rendermode: 'image',
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
            var str = text.replace(/[\u00A0-\u2666]/g, function(c) {
                return '&#' + c.charCodeAt(0) + ';';
            });
            var base64 = btoa(unescape(encodeURIComponent(str)));
            var end = name.substr(name.lastIndexOf('.')+1);
            var blob = b64toBlob(base64, "image/" + end);
            //var blob = new Blob( [ base64 ], { type: "image/" + end } );
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL( blob );
            
            //document.getElementById("photo").src = 'data:image/' + end + ';base64,' + base64;
            var img = document.querySelector( "#photo" );
            img.src = imageUrl;

            console.log("addFeatures image: " + id + " in file " + name + " DONE");
            return;
        }
        
        console.log(text);
        var vect = loadKmlText(text, name);
        layers.push({"id": id, "vector": vect});
        myMap.addLayer(vect);

        console.log("addFeatures: " + id + " in file " + name + " DONE");
    }

// Function to parse KML text to get link reference to list any other 
// nested files (kmz or kml)
    function parseKmlText(text) {
        //console.log("parseKmlText: " + text);
        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString(text, 'text/xml');
        var links = oDOM.querySelectorAll('NetworkLink Link href');
        var urls = oDOM.querySelectorAll('NetworkLink Url href');
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
            headers: {'x-requested-with': 'XMLHttpRequest'
            }
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
                    }
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

        var listFilesNested = parseKmlText(text);

        var str = name.toLowerCase();
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
            if (str.endsWith("kml")) {
                console.log("readAndAddFeatures kml element: " + el);
                ajaxKMZ(el, id, readAndAddFeatures);//kml
            } else {
                console.log("readAndAddFeatures kmz element: " + el);
                ajaxKMZ(el, id, unzipFromBlob(readAndAddFeatures, id));
            }
        });
        console.log("readAndAddFeatures <<<<");
    };

    function repeat_kmz_calls(url, id) {
        //$("#DebugWindow").append("repeat_kmz_calls: " + url + "<br/>");
        //console.log("repeat_kmz_calls: " + url);

        // make the ajax call to kmz that unzip and read the file
        // this file reference other KMZ so we call each of them
        // and add their content
        var str = url.toLowerCase();
        if (str.endsWith("kml") || str.endsWith("png")) {
            console.log("readAndAddFeatures kml element: " + url);
            ajaxKMZ(url, id, readAndAddFeatures);//kml
        } else {
            console.log("readAndAddFeatures kmz element: " + url);
            ajaxKMZ(url, id, unzipFromBlob(readAndAddFeatures, id));
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

