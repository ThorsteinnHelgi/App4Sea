/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

App4Sea = App4Sea || {};
App4Sea.KML = (function () {
    "use strict";
    var my = {};

    let ynd = 0;
    
    var title = "";
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
    my.loadKmlKmz = function (url, id, name) {
        console.log("loadKmz: " + id + " from " + url);
        title = name;
        repeat_kml_kmz_calls(url, id);
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Recursion
    function repeat_kml_kmz_calls(url, id) {

        // make the ajax call to kmz that unzip and read the file
        // this file reference other KMZ so we call each of them
        // and add their content
        var str = url.toLowerCase();
        console.log(str);
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
    // We are getting data from the internet
    function ajaxKMZ(url, id, callback) {
        console.log("ajaxKMZ: " + url);

        // See: https://github.com/pyrsmk/qwest for get documentation
        // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS for Cors documentation
        // See: https://remysharp.com/2011/04/21/getting-cors-working
        qwest.get(url, null, {
            responseType: 'blob',
            cache: true, // Cors Origin fix (not working!)
            timeout: 2000,
            headers: {
                //'x-requested-with': 'XMLHttpRequest',
                crossOrigin: 'anonymous'
            }
        })
        .then(function (xhr, response) {
            // Run when the request is successful
            //$("#DebugWindow").append("ajaxKMZ Response: " + response + "<br/>");
            console.log("ajaxKMZ OK: " + url);

            let str = url.toLowerCase();
            if (str.endsWith("kml") && typeof (response) === "object") {
                
                let extendedCallback = function (str1, id1, callb) {
                    return function (e) {
                        console.log("Callback: " + id1 + ": " + str1);
                        let text = e.srcElement.result;
                        console.log(text);
                        callb(text, str1, id1);
                    };
                };
                
                //console.log(response);

                // This will fire after the blob has been read/loaded.
                let reader = new FileReader();
                reader.addEventListener('loadend', extendedCallback(str, id, callback), {passive: true});
                
                // Start reading the blob as text. readAsText
                reader.readAsBinaryString(response);
            } 
            else {
                console.log("Now handlilng " + str);
                callback(response, str, id);
            }
        })
        .catch(function (e, xhr) {
            console.log("ajaxKMZ Error: " + e + ": Url: " + url + ", id: " + id);
            //console.log(xhr);
            // Process the error
        })
        .complete(function () {
            // Always run
            //console.log("ajaxKMZ DONE: " + url);
        });
    }

    ////////////////////////////////////////////////////////////////////////////
    // Function to unzip content from blob and execute callback
    // We are getting data from local file
    function unzipFromBlob(callback, id) {        
        return function unzip(blob) {
            console.log("Unzip id " + id);
            // use a BlobReader to read the zip from a Blob object
            zip.createReader(
                new zip.BlobReader(blob),
                function (reader) {
                    // get all entries (array of objects) from the zip
                    reader.getEntries(function (entries) {
                        console.log("Got entries: " + entries.length);
                        for (let ind = 0; ind < entries.length; ind++) {

                            console.log("Entry: " + entries[ind]);

                            let extendedCallback = function (str1, id1, callb, ntries) {
                                return function (text) {
                                    console.log("extendedCallback for " + id1 + " at " + str1 + " next call " + callb);
                                    // text contains the entry data as a String (even though it may be a blob)
                                    //console.log("About to call back for " + str1);
                                    callb(text, str1, id1, ntries);
                                };
                            };

                            let str = entries[ind].filename.toLowerCase();

                            if (str.endsWith(".kml")) {
                                console.log("Entry " + ind + ": " + str);
                                // there is always only one KML in KMZ, namely the doc.kml (name can differ).
                                // we get the kml content as text, but also any other content (as text)
                                entries[ind].getData(/* writer, onend, onprogress, checkCrc32 */
                                    new zip.TextWriter(),
                                    extendedCallback (str, id, callback, entries),
                                    function (current, total) {
                                        // onprogress callback
                                        //console.log("unzipFromBlob Total: " + total.toString() + ", Current: " + current.toString());
                                    }
                                );
                            }
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
    // Read a KML and add any features to the vector layer recursively
    // This call will either be called with a kml file or the individual entries (as text)
    // from the entries in the kmz file (of which the doc.kml file is one).
    let readAndAddFeatures = function (text, name, id, entries) {
        console.log("readAndAddFeatures >>>> " + name + " from file " + id);

        let str = name.toLowerCase();
        
        if (str.endsWith("kml")) {
            let listFilesNested = parseKmlText(name, text, id, entries);
            //if (listFilesNested.length === 0) {
                //console.log("No nested files");
                addKMLFeatures(text, str, id);
            //};

            console.log("listFilesNested are " + listFilesNested.length);
            listFilesNested.forEach(function (el) {
                console.log("readAndAddFeatures ----------");
                // Nested calls. Acceptable for a demo
                // but could be "promisified" instead
                repeat_kml_kmz_calls(el, id);
            });
        }
        else {
          ///  addKMLFeatures(text, str, id);
        }
        console.log("readAndAddFeatures <<<<");
    };

    ////////////////////////////////////////////////////////////////////////////
    // Function to ease KML feature reading
    function addKMLFeatures (text, name, id) {
        console.log(">>> addKMLFeatures: " + name)

        if (name.endsWith("kml")) {
            //console.log(text); // log the whole kml file
            var vect = loadKmlText(text, id, name);
            
            App4Sea.OpenLayers.layers.push({"id": id, "vector": vect});
            console.log("Cached layers now are " + App4Sea.OpenLayers.layers.length);

            App4Sea.OpenLayers.Map.addLayer(vect);

            console.log("addKMLFeatures: " + id + " in file " + name + " DONE");
        }
        
        console.log("<<< addKMLFeatures")
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
                App4Sea.OpenLayers.styleMaps.push(newStyleMap);
                break;

            case 'Style':
                newStyleMap = getStyleEntry(newID, parentId, node);
                App4Sea.OpenLayers.styleMaps.push(newStyleMap);
                newID = App4Sea.OpenLayers.styleMaps.length;
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
        //console.log("Adding " + text + " to tree under " + parNode + " returned " + retVal);
        return retVal;
    }

    ////////////////////////////////////////////////////////////////////////////
    // Function to parse KML text to get link reference to list any other 
    // nested files (kmz or kml)
    function parseKmlText(path, text, id, entries) {
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
                
                const west = parseFloat(overlay.querySelector('west').innerHTML);
                const south = parseFloat(overlay.querySelector('south').innerHTML);
                const east = parseFloat(overlay.querySelector('east').innerHTML);
                const north = parseFloat(overlay.querySelector('north').innerHTML);

                var imageExtent = ol.proj.transformExtent([west, south, east, north], App4Sea.prefProj, App4Sea.prefViewProj);
                //console.log("GroundOverlay: W:" + west + " S:" + south + " E:" + east + " N:" + north + " Pro:" + App4Sea.prefProj + " ViewProj:" + App4Sea.prefViewProj);                
                let nameIs = "";
                const name = overlay.querySelector('name');
                if (name) {
                    nameIs = name.innerHTML;
                }

                function loadImageFromKmz(ent1, url1, ext1, nam1, id1) {

                    let extendedCallback = function (ur, ex, nm, en, id) {
                        return function (data) {
                            let kmzurl =  URL.createObjectURL(data);
                            let source = new ol.source.ImageStatic({
                                url: kmzurl,
                                imageExtent: ex
                            });
                            let image = new ol.layer.Image({
                                name: nm,
                                source: source
                            });
                            if (image) {
                                App4Sea.OpenLayers.layers.push({"id": id, "vector" : image});
                                console.log("Added image from kmz. Cached layers now are " + App4Sea.OpenLayers.layers.length + ": " + ur);
            
                                App4Sea.OpenLayers.Map.addLayer(image);
                            }
                            else {
                                console.log("No image created from kmz");
                            }
                        };
                    };
                        
                    ent1.getData(new zip.BlobWriter('text/plain'), extendedCallback(url1, ext1, nam1, ent1, id1));
                };

                function findIn (filesInKmz, url_, ext, nam, ide) {
                    for (let ind=0; ind<filesInKmz.length; ind++) {
                        if (filesInKmz[ind].filename === url_) {
                            return loadImageFromKmz(filesInKmz[ind], url_, ext, nam, ide);
                        }
                    };

                    console.log("Didn't find file in kmz: " + nam);

                    return null;
                };

                let image;
                ynd = ynd + 1;// && ynd % 2 === 1
                if (!url.startsWith("http")) {
                    if (entries && entries.length > 1) {
                        //console.log("Getting image from kmz: " + url);
                        findIn(entries, url, imageExtent, nameIs, id);
                    } 
                    else {
                        console.log("Getting image from same location as parent");

                    }

                }
                else {
                    //console.log("Getting image from url: " + url);
                    let source = new ol.source.ImageStatic({
                        url: url,
                        crossOrigin: 'anonymous',
                        imageExtent: imageExtent
                    });
                    image = new ol.layer.Image({
                        name: nameIs,
                        source: source
                    });
                    if (image) {
                        App4Sea.OpenLayers.layers.push({"id": id, "vector" : image});
                        console.log("Added image from url. Cached layers now are " + App4Sea.OpenLayers.layers.length + ": " + url);
    
                        App4Sea.OpenLayers.Map.addLayer(image);
                    }
                }
            }
        }

        function listChildren(id, children){

            for(var cind=0; cind<children.length; cind++){

                var child = children[cind];
                var newId;

                if (child.nodeName === 'name' || child.nodeName === 'atom:name'){
                    console.log("Name item not handled: " + child.innerHTML);
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
                    console.log("Camera item not handled: " + child.innerHTML);
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
                    console.log(child.nodeName + " item not handled: " + child.innerHTML);
                }
                else if (child.nodeName === 'TimeStamp') {
                    console.log(child.nodeName + " item not handled: " + child.innerHTML);
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
                    //console.log(child.nodeName + " item not handled: " + child.innerHTML);
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
                App4Sea.Animation.Animate(path, title);
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