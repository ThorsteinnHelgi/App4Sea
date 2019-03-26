/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

qwest = qwest || {};
ol = ol || {};
zip = zip || {};
App4Sea = App4Sea || {};

App4Sea.KML = (function () {
    "use strict";
    var my = {};
    
    ////////////////////////////////////////////////////////////////////////////
    // Declare worker scripts path for zip manipulation
    zip.workerScriptsPath = 'static/js/';
    
    ////////////////////////////////////////////////////////////////////////////
    //load kml and return as Vector (This function only handle simple kml files)
    // See https://developers.google.com/kml/documentation/kmlreference
    my.loadKml = function (url) {
        //$("#DebugWindow").append("loadKml: " + url + "<br/>");
        console.log("loadKml: " + url);
        var vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                url: url,
                crossOrigin: 'anonymous',
                //rendermode: 'image',
                format: new ol.format.KML({
                    extractStyles: true,
                    extractAttributes: true,
                    showPointNames: false
                })
            })
        });

        // TBD also return an array of external kml or kmz files together with timestamps if applicable

        return vector;
    };

    ////////////////////////////////////////////////////////////////////////////
    //load kmz or kml and recurse through nested files
    // See https://developers.google.com/kml/documentation/kmzarchives
    my.loadKmlKmz = function (url, id) {
        console.log("loadKmz: " + id + " from " + url);
        repeat_kml_kmz_calls(url, id);
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Recursion
    function repeat_kml_kmz_calls(url, id) {

        // make the ajax call to kmz that unzip and read the file
        // this file reference other KMZ so we call each of them
        // and add their content
        var str = url.toLowerCase();
        if (str.endsWith("kmz")) {
            console.log("readAndAddFeatures kmz element: " + url);
            ajaxKMZ(url, id, unzipFromBlob(readAndAddFeatures, id));
        } 
        else {
            console.log("readAndAddFeatures non-kmz element: " + url);
            ajaxKMZ(url, id, readAndAddFeatures);//kml
        }
    }

    ////////////////////////////////////////////////////////////////////////////
    // Function to make ajax call and make a callback on success (both kml and kmz)
    function ajaxKMZ(url, id, callback) {
        console.log("ajaxKMZ: " + url);

        // See: https://github.com/pyrsmk/qwest for get documentation
        // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS for Cors documentation
        // See: https://remysharp.com/2011/04/21/getting-cors-working
        qwest.get(url, null, {
            responseType: 'blob',
            timeout: 2000
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
            } 
            else {
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

    ////////////////////////////////////////////////////////////////////////////
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
    
    ////////////////////////////////////////////////////////////////////////////
    // Read reference to other KMZ and add them to the vector layer
    var readAndAddFeatures = function (text, name, id) {
        console.log("readAndAddFeatures >>>> " + id + " from file " + name);

        var str = name.toLowerCase();
        
        if (str.endsWith("kml")) {
            var listFilesNested = parseKmlText(name, text, id);
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
                } 
                else {
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

    ////////////////////////////////////////////////////////////////////////////
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
                blob = App4Sea.Utils.b64toBlob(base64, "image/" + end);
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
        
        App4Sea.Map.OpenLayers.layers.push({"id": id, "vector": vect});
        console.log("Cached layers now are " + App4Sea.Map.OpenLayers.layers.length);

        App4Sea.Map.OpenLayers.Map.addLayer(vect);

        console.log("addFeatures: " + id + " in file " + name + " DONE");
    }

    ////////////////////////////////////////////////////////////////////////////
    // Load kml content and return as Vector
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
            dataProjection: App4Sea.prefProj, //Projection of the data we are reading.
            featureProjection: App4Sea.prefViewProj//Projection of the feature geometries created by the format reader.
        });

        console.log("kml_features are: " + kml_features.length);
        
//        if (kml_features.length > 0) {
//            var description = kml_features[0].get('description');
//            
//            if (description) {
//                addChild('Description', description, $('#TreeMenu'), id, false);
//            }
//        }

        var vector = new ol.layer.Vector({
            source: new ol.source.Vector({
                crossOrigin: 'anonymous',
                //rendermode: 'image',
                format: formatter
            })
        });
        vector.getSource().addFeatures(kml_features);

        return vector;
    }

    ////////////////////////////////////////////////////////////////////////////
    function getStyleEntry(newId, parentId, node) {
        return { type: node.nodeName, id: node.id, newId: newId, parentId: parentId, node: node, value: node.innerHTML };
    }

    ////////////////////////////////////////////////////////////////////////////
    function addStyleMap (parentId, node) {
        // TBD !!!!!
        var newID = parentId + "-" + node.id;
        var newStyleMap;
        
        switch (node.nodeName) 
        {
            case 'StyleMap':
                newStyleMap = getStyleEntry(newID, parentId, node);
                App4Sea.Map.OpenLayers.styleMaps.push(newStyleMap);
                break;

            case 'Style':
                newStyleMap = getStyleEntry(newID, parentId, node);
                App4Sea.Map.OpenLayers.styleMaps.push(newStyleMap);
                newID = App4Sea.Map.OpenLayers.styleMaps.length;
                break;
/*
            case 'Pair':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'BalloonStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'LabelStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'PolyStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'LineStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'ListStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'styleUrl':
                newStyleMap = getStyleEntry(name, id, parNode, text);
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'key':
                newStyleMap = getStyleEntry(name, id, parNode, text);
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'text':
                newStyleMap = getStyleEntry(name, id, parNode, text);
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'gx:IconStackStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'IconStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;
*/
        }
        
        return newID;
        //var newStyleMap = { state: {"closed" : true, "checkbox_disabled" : false, "disabled" : false}, 
          //  icon: icon, text: text, data: data, selected: true, children : false };
        //var retVal = tree.jstree(true).create_node(parNode, newNode, 'last', false, false);
        //console.log("Adding " + text + " to tree under " + parNode + " returned " + retVal);
        //return retVal;
    }

    ////////////////////////////////////////////////////////////////////////////
    // addChild to the menu tree (jstree)
    // returns the new id for the node in the tree (format example: j1_4)
    function addChild (text, data, tree, parNode, disabled, icon) {
        var newNode = { state: {"closed" : true, "checkbox_disabled" : false, "disabled" : disabled}, // TBD disabled should always be false
            icon: icon, text: text, data: data, selected: true, children : false };
        var retVal = tree.jstree(true).create_node(parNode, newNode, 'last', false, false); //[par, node, pos, callback, is_loaded]
        console.log("Adding " + text + " to tree under " + parNode + " returned " + retVal);
        return retVal;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Function to parse KML text to get link reference to list any other 
    // nested files (kmz or kml)
    function parseKmlText(path, text, id) {
        //console.log("parseKmlText: " + text);
        var oParser = new DOMParser();
        var oDOM = oParser.parseFromString(text, 'text/xml');
        var links = oDOM.querySelectorAll('NetworkLink Link href');
        var urls = oDOM.querySelectorAll('NetworkLink Url href');
        
        // Collect data for animation of GrounOverlay
        var canAnimate = false;
        var gol = oDOM.querySelectorAll('GroundOverlay Icon href');
        var golw = []; // when
        var golb = []; // begin
        var gole = []; // end
        var goll = []; // layerID
        var count = 0;
        if (gol.length > 0) {
            canAnimate = true;
            golw = oDOM.querySelectorAll('GroundOverlay TimeStamp when');
            if (golw.length === 0) {
                golb = oDOM.querySelectorAll('GroundOverlay TimeSpan begin');
                gole = oDOM.querySelectorAll('GroundOverlay TimeSpan end');
                golw = [];
            }
            else {
                golb = [];
                gole = [];
            }
            
            App4Sea.Animation.AniData = [gol, golw, golb, gole, goll];
        }
        else
            App4Sea.Animation.AniData = [null, null, null, null, null];

        var kml = oDOM.querySelector('kml');
        
        function getName(children, defaultName) {
            for (var ind=0; ind<children.length; ind++){
                if (children[ind].nodeName === 'name' || children[ind].nodeName === 'atom:name')
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
                /*
			<ScreenOverlay>
				<name>colorbar</name>
				<Icon>
					<href>http://people.eng.unimelb.edu.au/mpeel/Koppen/World_Koppen_Map_Legend.png</href>
				</Icon>
				<overlayXY x="0.5" y="-1" xunits="fraction" yunits="fraction"/>
				<screenXY x="0.5" y="0" xunits="fraction" yunits="fraction"/>
				<rotationXY x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
				<size x="-1" y="-1" xunits="pixels" yunits="pixels"/>
			</ScreenOverlay>

                */
                if (url) {
                    var name, nameIs;
                    var name = overlay.querySelector('name');
                    if (name)
                        nameIs = name.innerHTML;

                    var overlayXY = overlay.querySelector('overlayXY');
                    var screenXY = overlay.querySelector('screenXY');
                    var rotationXY = overlay.querySelector('rotationXY');
                    var size = overlay.querySelector('size');
                    
                    $('#imgLegend').src = url;
                    
                    function GetValUnit(val, unitin)
                    {
                        var valout = val;
                        
                        if (unitin === 'fraction') {
                            valout = val*100 + '%';
                        }
                        else if (unitin === 'pixels')
                            valout = val+'px';
                        else
                            valout = '?';
                        
                        return valout;
                    }
                    
                    // TBD $('#overlayLegend').style.left = GetValUnit(screenXY.attributes.x.value, screenXY.attributes.xunits.value);
                    //$('#overlayLegend').style.top = GetValUnit(screenXY.attributes.y.value, screenXY.attributes.yunits.value);
                }
            }
            else if (overlay.nodeName === "PhotoOverlay") {
                console.log("PhotoOverlay: " + url);
                return;
            }
            else { // GroundOverlay
                /*
                <GroundOverlay id="3">
                    <name>growth at1989-01-01T00:00:00</name>
                    <TimeStamp id="6">
                        <when>1989-01-01T00:00:00Z</when>
                    </TimeStamp>
                    <Icon id="4">
                        <href>http://opendap.deltares.nl/thredds/wms/opendap/imares/plaice_large_1989/plaice_large_1989_day_1.nc?VERSION=1.1.1&REQUEST=GetMap&bbox=-6.9166666666665,48.349629629499994,16.7500000000475,60.0622221915&SRS=EPSG%3A4326&WIDTH=512&HEIGHT=512&LAYERS=Band1&STYLES=boxfill/sst_36&TRANSPARENT=TRUE&FORMAT=image/gif&COLORSCALERANGE=-0.1,0.2</href>
                        <refreshMode>onStop</refreshMode>
                        <viewBoundScale>0.75</viewBoundScale>
                    </Icon>
                    <LatLonBox>
                        <north>60.0622221915</north>
                        <south>48.3496296295</south>
                        <east>16.75</east>
                        <west>-6.91666666667</west>
                    </LatLonBox>
                </GroundOverlay>
                */
                console.log("GroundOverlay: " + url);
                
                url = url.replaceAll(/&amp;/, '&');
                
                var west = parseFloat(overlay.querySelector('west').innerHTML);
                var south = parseFloat(overlay.querySelector('south').innerHTML);
                var east = parseFloat(overlay.querySelector('east').innerHTML);
                var north = parseFloat(overlay.querySelector('north').innerHTML);

                var imageExtent = ol.proj.transformExtent([west, south, east, north], App4Sea.prefProj, App4Sea.prefViewProj);
                console.log("GroundOverlay: W:" + west + " S:" + south + " E:" + east + " N:" + north + " Pro:" + App4Sea.prefProj + " ViewProj:" + App4Sea.prefViewProj);                
                var nameIs;
                var name = overlay.querySelector('name');
                if (name)
                    nameIs = name.innerHTML;

                image = new ol.layer.Image({
                    name: nameIs,
    //                extent: mapExtent,
    //                origin: [mapExtent[0], mapExtent[1]],
                    source: new ol.source.ImageStatic({
                        url: url,
//                        crossOrigin: 'anonymous',
                        //projection: 'EPSG:27700',
                        imageExtent: imageExtent
                  })
                });

                if (image) {
                    App4Sea.Map.OpenLayers.layers.push({"id": id, "vector" : image});
                    console.log("Cached layers now are " + App4Sea.Map.OpenLayers.layers.length);

                    App4Sea.Map.OpenLayers.Map.addLayer(image);
                }
            }
        }

        function listChildren(id, children){

            for(var cind=0; cind<children.length; cind++){

                var child = children[cind];
                var newId;

                if (child.nodeName === 'name' || child.nodeName === 'atom:name'){
                    console.log("Name item not handled");
                    // TBD
//                    var name = child;
//                    if(name.innerHTML !== "") {
//                        newId = addChild('Name', name.innerHTML, tree, id, true);
//                    }
                }
                else if (child.nodeName === 'description') {
                    var description = child;
                    if (description.innerHTML !== "") {
                        newId = addChild('Description', description.innerHTML, $('#TreeMenu'), id, false, 'icons/description.png');
                    }
                }
                else if (child.nodeName === 'author' || child.nodeName === 'atom:author') {
                    var author = child;

                    var authText = "<p>";
                    for (var aind=0; aind<author.children.length; aind++){
                        if (aind !== 0)
                            authText += "<br/>";
                        authText += author.children[aind].innerHTML;
                    }
                    authText += "</p>";
                    newId = addChild('Author', authText, $('#TreeMenu'), id, false, 'icons/author.png');
                }
                else if(child.nodeName === 'Folder' ||
                        child.nodeName === 'Document') {
                    newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id, true, 'icons/folder.png');
                } 
                else if(child.nodeName === 'Camera') {
                    console.log("Camera item not handled");
                    // TBD
                } 
                else if(child.nodeName === 'Placemark') { // Can move this later to a selectable section TBD
                    newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id, true, 'icons/placemark.png');
                } 
                else if(child.nodeName === 'GroundOverlay' ||
                        child.nodeName === 'PhotoOverlay' ||
                        child.nodeName === 'ScreenOverlay') {
                    newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id, false, 'icons/overlay.png');
                    addOverlay(child, newId);
                    
                    var href = "";
                    for(var hind=0; hind<child.children.length; hind++){
                        var str = child.children[hind].localName;
                        str = str.substr(0, 4);
                        if (str === 'Icon') {
                            href = child.children[hind].children[0].innerHTML;
                            break;
                        }
                    }
                    if (child.nodeName === 'GroundOverlay' && href === gol[count].innerHTML) {
                        goll[count] = newId;
                        count += 1;
                    }
                } 
                else if(child.nodeName === 'StyleMap' ||
                        child.nodeName === 'Style') { // Included in StyleMap
                    //console.log("Not handling Style attributes: " + child.nodeName + ": " + child.id);
                    //    function addStyleMap (parentId, node) {

                    newId = addStyleMap(id, child);
                }
                else if (child.nodeName === 'TimeSpan') {
                    console.log(child.nodeName + " item not handled");
                }
                else if (child.nodeName === 'TimeStamp') {
                    console.log(child.nodeName + " item not handled");
                }
                else if(child.nodeName === 'Link' ||
                        child.nodeName === 'atom:link' ||
                        child.nodeName === 'NetworkLink' ||
                        child.nodeName === 'open' ||
                        child.nodeName === 'href' ||
                        child.nodeName === 'visibility' ||
                        child.nodeName === 'refreshMode' ||
                        child.nodeName === 'refreshInterval' ||
                        child.nodeName === 'ExtendedData' || // Included in feature
                        child.nodeName === 'Icon' ||
                        child.nodeName === 'LatLonBox' ||
                        child.nodeName === 'MultiGeometry' ||
                        child.nodeName === 'gx:Tour' ||
                        child.nodeName === 'gx:Playlist' ||
                        child.nodeName === 'Schema' ||
                        child.nodeName === 'SimpleField' || // Included in Schema
                        child.nodeName === 'LineString' ||
                        child.nodeName === 'Point' ||
                        child.nodeName === 'Snippet' ||
                        child.nodeName === 'Region' ||
                        
                        child.nodeName === 'key' || // Included in Pair as in StyleMap
                        child.nodeName === 'styleUrl' || // Included in feature or Pair as in StyleMap
                        child.nodeName === 'Pair' || // Included in StyleMap
                        child.nodeName === 'BalloonStyle' || // Included in Style
                        child.nodeName === 'text' || // Included is BalloonStyle
                        child.nodeName === 'LabelStyle' || // Included in Style
                        child.nodeName === 'PolyStyle' || // Included in Style
                        child.nodeName === 'LineStyle' || // Included in Style
                        child.nodeName === 'ListStyle' || // Included in Style
                        child.nodeName === 'gx:IconStackStyle' || // Included in Style
                        child.nodeName === 'IconStyle') { // Included in Style
                    // Currently not handling this
                    console.log(child.nodeName + " item not handled");
                    // TBD

                } 
                else {
                    console.log("Not handling " + child.nodeName);
                }
                
                if (child.children && child.children.length > 0) {
                    var predecessors = [];
                    var par = child.parentNode;
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
            
            if (canAnimate)
                App4Sea.Animation.Animate(path, "Title");
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
        
        return files;//, canAnimate;//, gol, golw, golb, gole;
    }
    
    return my;
    
}(App4Sea.KML || {}));