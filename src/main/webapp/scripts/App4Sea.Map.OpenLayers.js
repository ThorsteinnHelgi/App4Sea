/* 
 * (c) 2018 Arni Geir Sigurðsson            arni.geir.sigurdsson(at)gmail.com
 *          Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 */
/* global ol, Mustache */

var App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map)? App4Sea.Map : {};
App4Sea.Map.OpenLayers = (function(){
    "use strict";
    var myMap;
    var currentLayer;
    var osmTileLayer;
    var esriWSPTileLayer;
    var esriWITileLayer;
    var cloudNow;
    var that = {};
    var zoom = 4;
    var center = ol.proj.transform([-3, 65], 'EPSG:4326', 'EPSG:3857'); 
    var interaction = new ol.interaction.DragRotateAndZoom(); // create an interaction to add to the map that isn't there by default
    var timespan = {begin: "", end: ""};
//    var networklink = {timespan, link: ""};
    var networklinkarray = [];
    var indNow = 0;
    var layers = []; // array to hold layers as they are created    
    var layerNode = { id: "", text: "", path: "" };

// Declare layer
var vectorKMZ = new ol.layer.Vector({
    source: new ol.source.Vector({
        format: new ol.format.KML({
            extractStyles: true
        })
    })
});
    ////////////////////////////////////////////////////////////////////////////
    //initialize maps and models when page DOM is ready..
    function init(){
        
        var container = document.getElementById('popup');
        var content = document.getElementById('popup-content');
        var closer = document.getElementById('popup-closer');
        
        // Create an overlay to anchor the popup to the map.
        var overlay = new ol.Overlay({
            element: container,
            autoPan: true,
            autoPanAnimation: {
                duration: 250
            }
        });
    
       // Add a click handler to hide the popup.
       // @return {boolean} Don't follow the href.
        closer.onclick = function() {
            overlay.setPosition(undefined);
            closer.blur();
            return false;
        };

        //init OpenLayer map with MapBox tiles
        myMap = new ol.Map({
            target: 'MapContainer',
            interaction: interaction,
            overlays: [overlay, vectorKMZ],
            view: new ol.View({
                center: center,
                zoom: zoom,
                minZoom: 3,
                maxZoom: 18
            })
        });
      
        // Add a click handler to the map to render the popup.
        myMap.on('singleclick', function(evt) {
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

                if(features[0].get('navn')){
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
            }            
            else {
                overlay.setPosition(undefined);
                closer.blur();
            }
        });

        // Init osmTileLayer base map
        osmTileLayer =   new ol.layer.Tile({
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
        //animationMap();

        // Test heatMap
        heatMap();
        
        // Add standard map controls
        myMap.addControl(new ol.control.ZoomSlider());        
        myMap.addControl(new ol.control.Zoom());        
        myMap.addControl(new ol.control.FullScreen());        
        myMap.addControl(new ol.control.Rotate({autoHide: true}));  
        let ctrl = new ol.control.MousePosition({
            projection: 'EPSG:4326',
            coordinateFormat: function(coordinate) {
                return ol.coordinate.format(coordinate, '{x}, {y}', 4);
            }
        });
        myMap.addControl(ctrl);        
        myMap.addControl(new ol.control.OverviewMap({
            layers: [currentLayer],
            collapsed: false
        }));        
        myMap.addControl(new ol.control.ScaleLine());        
                
        // Hook events to menu
        $(".MenuSection input[type='checkbox']").click(function(){
            update();
        });
        $(".MenuSection select").change(function(){
            update();
        });
        
        // Update the page
        update();
    }

    ////////////////////////////////////////////////////////////////////////////
    //load kml and return as Vector
    // See https://developers.google.com/kml/documentation/kmlreference
    function loadKml(url){
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
    function loadKmz(url){
        //$("#DebugWindow").append("loadKmz: " + url + "<br/>");
        console.log("loadKmz: " + url);
        repeat_kmz_calls(url);
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
            'checkbox' : { 'keep_selected_style' : false, 'real_checkboxes': true },
            'core' : {
                'check_callback' : false,
                'themes' : { 
                    'dots': false,
                    'icons': false 
                },
                'error' : function (e) {
                    console.log('Error: ' + e.error);
                    console.log('Id: ' + e.id);
                    console.log('Plugin: ' + e.plugin);
                    console.log('Reason: ' + e.reason);
                    console.log('Data: ' + e.data);
                },
                'data' : {
                    'dataType': 'json',
                    'contentType':'application/json; charset=utf-8',
                    url : function (node) { 
                        var theUrl = node.id === '#' ?
                            'data/a4s.json' : 
                            'data/'+node.id+'.json';                        
                        console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    data : function (node) { 
                        let nodeObj = {"id":node.id, "text":"", "path":""};
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
            'plugins' : [ "checkbox" ]
        });

        // 
        $('#MenuTree').on("changed.jstree", function (e, data) {
            console.log("On Action: " + data.action);
     
           if (typeof data.node === 'undefined')
                return;
            
            for (let lind=0; lind<layers.length; lind++)
            {
                let isSel = false;
                for (let sind=0; sind<data.selected.length; sind++) {
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
            for (let ind=0; ind<data.selected.length; ind++){
                let nod = $(this).jstree('get_node', data.selected[ind]);
                let path = nod.a_attr.path;
                
                if (path === "" || nod.children.length > 0) {//This is a folder/parent node
                    continue;
                }
                
                console.log("Layer being added: " + nod.text);

                var index = alreadyLayer(nod.id, layers);

                if (path.length > 3){
                    var ext = path.substr(path.length-3, 3);
                    if (ext === "kmz") {
                        loadKmz(path);
                    }
                    else {
                        if (index === -1){
                            var vect =  loadKml(path);
                            layers.push({"id": nod.id, "vector" : vect});

                            myMap.addLayer(vect);
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
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Set up setUpInfoTree
    // https://www.jstree.com
    // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
    // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
    function setUpInfoTree() {

        // First we load the tree based on a json file that we fetch using ajax (core)
        $('#InfoTree').jstree({
            'core' : {
                'check_callback' : false,
                //'themes' : { 'stripes' : false },
                'themes' : { 
                    'dots': false,
                    'icons': false 
                },
                'error' : function (e) {
                    console.log('Error: ' + e.error);
                    console.log('Id: ' + e.id);
                    console.log('Plugin: ' + e.plugin);
                    console.log('Reason: ' + e.reason);
                    console.log('Data: ' + e.data);
                },
                'data' : {
                    url : function (node) { 
                        var theUrl = node.id === '#' ?
                            'data/info.json' : 
                            'data/info_ch.json';                        
                        console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    //'type': 'GET',
                    'dataType': 'json',
                    'contentType':'application/json; charset=utf-8',
                    data : function (node) { 
                        console.log("Node.id: " + node.id);
                        return { 'id' : node.id }; //, 'parent' : node.parent };//, 'text' : node.text, 'a_attr.path' : node.a_attr.path }; 
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
            'plugins' : [  ]
            }
        );

        // 
        $('#InfoTree').on("changed.jstree", function (e, data) {
            console.log("On: " + data.selected);
            
            if (typeof data.node !== 'undefined')
                if (data.node.a_attr.path !== '')
                    window.open(data.node.a_attr.path);
        });

    };
    
    ////////////////////////////////////////////////////////////////////////////
    // alreadyLayer checks if a node is alreay in the layer array and returns
    // the index if so. Else it returns -1
    function alreadyLayer(id, arr)
    {
        var count=arr.length;
        for(var i=0;i<count;i++)
        {
            if(arr[i].id === id){return i;}
        }
        return -1;
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // heatMap
    function heatMap () {
        var blur = document.getElementById('blur');
        var radius = document.getElementById('radius');

        var vector = new ol.layer.Heatmap({
            source: new ol.source.Vector({
                url: 'https://openlayers.org/en/v4.6.5/examples/data/kml/2012_Earthquakes_Mag5.kml',
                format: new ol.format.KML({
                    extractStyles: false
                })
            }),
            blur: parseInt(blur.value, 10),
            radius: parseInt(radius.value, 10)
        });

        vector.getSource().on('addfeature', function(event) {
            // 2012_Earthquakes_Mag5.kml stores the magnitude of each earthquake in a
            // standards-violating <magnitude> tag in each Placemark.  We extract it from
            // the Placemark's name instead.
            var name = event.feature.get('name');
            var magnitude = parseFloat(name.substr(2));
            event.feature.set('weight', magnitude - 5);
        });

        myMap.addLayer(vector);

        blur.addEventListener('input', function() {
            vector.setBlur(parseInt(blur.value, 10));
        });

        radius.addEventListener('input', function() {
            vector.setRadius(parseInt(radius.value, 10));
        });
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // animationMap 
    function animationMap(){
        
        function toArray(list) {
            var i, array = [];
            for  (i=0; i<list.length;i++) {
                array[i] = list[i];
            }
            return array;
        }
        function getXmlValue(tag) {
            var val = tag.textContent;
            return val;
        }
        function getNetWorkLink (element) {
            var nodeTimeSpan = element.children[0];
            var nodeLink = element.children[1];

            var ts = {begin: "", end: ""};
            var nwl = {timespan, link: ""};
            
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

        var length = networkLinks.length-1;
        for (var ind = 0; ind < length; ind += 2) { 
            networklinkarray[ind/2] = getNetWorkLink(networkLinks[ind+1]);
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // animationGo starts the animation
    function animationGo (){
        var frameRate = 0.5; // frames per second
        var animationId = null;
        
        ///function someHoursAgo(hours) {
           // return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * hours);
        //}
        
        var extent = ol.proj.transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');
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
            
            if (link.length > 3){
                var ext = link.substr(link.length-3, 3);
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
            if (indNow > networklinkarray.length-1)
                indNow = 0;
        }

        setTime();

        var stop = function() {
            if (animationId !== null) {
                window.clearInterval(animationId);
                animationId = null;
            }
        };

        var play = function() {
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
    function animationMapOld(){
        
      function someHoursAgo(hours) {
        return new Date(Math.round(Date.now() / 3600000) * 3600000 - 3600000 * hours);
      }

      var extent = ol.proj.transformExtent([-126, 24, -66, 50], 'EPSG:4326', 'EPSG:3857');
      var startDate = someHoursAgo(3);
      var frameRate = 0.5; // frames per second
      var animationId = null;

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

      function updateInfo() {
        var el = document.getElementById('info');
        el.innerHTML = startDate.toISOString();
      }

      function setTime() {
        startDate.setMinutes(startDate.getMinutes() + 15);
        if (startDate > Date.now()) {
          startDate = someHoursAgo(3);
        }
        cloudTileLayer.getSource().updateParams({'TIME': startDate.toISOString()});
        updateInfo();
      }
      setTime();

      var stop = function() {
        if (animationId !== null) {
          window.clearInterval(animationId);
          animationId = null;
        }
      };

      var play = function() {
        stop();
        animationId = window.setInterval(setTime, 1000 / frameRate);
      };

      var startButton = document.getElementById('play');
      startButton.addEventListener('click', play, false);

      var stopButton = document.getElementById('pause');
      stopButton.addEventListener('click', stop, false);

      updateInfo();
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Update layers
    function update(){
        // Set base map
        var selectedMapLayer = $("#MenuLayer_Select").val();
        if(selectedMapLayer !== currentLayer.name){
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
        
        //animationGo();
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // Put a text on the window with location info for where you clicked
    function onMapClick(e) {
       $("#DebugWindow").append("["+e.latlng.lat+","+e.latlng.lng+"],<br/>");
    } 

    /// KMZ start
    // https://rawgit.com/webgeodatavore/ol3-extras-demos/master/kmz/static/js/demo-kmz.js
// Declare worker scripts path for zip manipulation
zip.workerScriptsPath = 'static/js/';


/*
// Declare map and add MapQuest layer and KML layer
var map = new ol.Map({
    target: 'map',
    layers: [
        new ol.layer.Tile({
            source: new ol.source.OSM()
        }),
        vector
    ],
    view: new ol.View({
        center: ol.proj.transform(
                [-98.579416, 39.828328],
                'EPSG:4326',
                'EPSG:3857'
                ),
        zoom: 4
    })
});
*/

// Url to KMZ file (in fact, it's a kml zipped file and not a gzipped file)
//var url = 'http://www.spc.noaa.gov/products/watch/ActiveWW.kmz';
// var url = '/proxy/www.spc.noaa.gov/products/watch/ActiveWW.kmz';

// Function to ease KML feature reading
function addFeatures(text) {
    var formatter = new ol.format.KML();
    var kml_features = formatter.readFeatures(text, {
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
    });
    vectorKMZ.getSource().addFeatures(kml_features);
    console.log("addFeatures" + kml_features);
}

// Function to parse KML text to get link reference to other KMZ
function parseKmlText(text) {
    var oParser = new DOMParser();
    var oDOM = oParser.parseFromString(text, 'text/xml');
    var links = oDOM.querySelectorAll('NetworkLink Link href');
    var files = Array.prototype.slice.call(links).map(function (el) {
        return el.textContent;
    });
    console.log("Files: " + files.length);
    return files;
}

// Function to unzip content from blob and execute callback on
// first entry (not generic but assumed for the demo)
function unzipFromBlob(callback) {
    return function unzip(blob) {
        // use a BlobReader to read the zip from a Blob object
        zip.createReader(new zip.BlobReader(blob), 
        function (reader) {
            // get all entries (array of objects) from the zip
            reader.getEntries(function (entries) {
                if (entries.length) {
                    // get first entry content as text (there is always only one in KMZ, namely the doc.kml)
                    console.log("unzipFromBlob entry " + entries[0].filename + "[" + entries[0].compressedSize + " -> " +entries[0].uncompressedSize + "]");
                    entries[0].getData(/* writer, onend, onprogress, checkCrc32 */
                        new zip.TextWriter(), 
                        function (text) {
                            // text contains the entry data as a String
                            callback(text);

                            // close the zip reader
                            reader.close(function () {
                                // onclose callback
                            });

                        }, 
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

// Function to make ajax call and make a callback on success
function ajaxKMZ(url, callback) {
    //$("#DebugWindow").append("ajaxKMZ: " + url + "<br/>");
    console.log("ajaxKMZ: " + url);
    // See: https://github.com/pyrsmk/qwest for get documentation
    qwest.get(url, null, {
        responseType: 'blob'
        ,headers: {'x-requested-with': 'XMLHttpRequest'}
        //,family: '4'
        //,port: '80'
    })
    .then(function (response) {
        // Run when the request is successful
        //$("#DebugWindow").append("ajaxKMZ Response: " + response + "<br/>");
        console.log("ajaxKMZ OK: " + url);
        callback(response);
    })
    .catch(function (e, url) {
        //$("#DebugWindow").append("ajaxKMZ Error: " + e + "<br/>" + url + "<br/>");
        console.log("ajaxKMZ Error: " + e + ": " + url);
        // Process the error
    })
    .complete(function () {
        // Always run
        console.log("ajaxKMZ DONE: " + url);
    });
}

// Read reference to other KMZ and add them to the vector layer
var readAndAddFeatures = function (text) {
    var listFilesKMZ = parseKmlText(text);
    //console.log(listFilesKMZ);
    listFilesKMZ.forEach(function (el) {
        console.log("readAndAddFeatures -----------------------------------------");
        console.log("readAndAddFeatures element: " + el);
        // Nested calls. Acceptable for a demo
        // but could be "promisified" instead
        var str = el.toLowerCase();
        console.log(str);
        if (str.endsWith("kmz"))
            ajaxKMZ(el, unzipFromBlob(addFeatures));//unzipFromBlob(readAndAddFeatures));
        else
            ajaxKMZ(el, unzipFromBlob(addFeatures));//kml
    });
    console.log("readAndAddFeatures =========================================");
};

function repeat_kmz_calls(url) {
    //$("#DebugWindow").append("repeat_kmz_calls: " + url + "<br/>");
    console.log("repeat_kmz_calls: " + url);
    
    var combinedCallback = unzipFromBlob(readAndAddFeatures);
    // make the ajax call to kmz that unzip and read the file
    // this file reference other KMZ so we call each of them
    // and add their content
    //ajaxKMZ(url, combinedCallback);
    ajaxKMZ(url, combinedCallback);
    //setTimeout(repeat_kmz_calls, 60000);
}

vectorKMZ.on('render', function (event) {
    console.log("Render event: " + event);
    var ctx = event.context;
    ctx.fillStyle = "red";
    ctx.font = "72px Arial";
    // get the metrics with font settings
    var metrics = ctx.measureText("WaterMark Demo");
    var width = metrics.width;

    if (vectorKMZ.getSource().getFeatures().length === 0) {
        ctx.fillText("WaterMark Demo", ctx.canvas.width / 2 - (width / 2), ctx.canvas.height / 2);
    }
    ctx.restore();
});

    that.Init = init;

    return that;
})();

$(document).ready(function(){
    console.log("Ready ==============================================================================");
    App4Sea.Map.OpenLayers.Init();
});

