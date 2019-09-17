/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

var App4Sea = App4Sea || {};
var App4SeaUtils = (function () {
    "use strict";
    let my = {};

    // private property
    const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    ////////////////////////////////////////////////////////////////////////////
    // GetKMLFromFeatures
    my.GetKMLFromFeatures = function(features, name) {
        let kmlformat = new ol.format.KML({
            maxDepth: 10,
            writeStyles: true,
            internalProjection: App4Sea.prefViewProj,
            externalProjection: App4Sea.prefProj
        });
    
        let pre = "<?xml version='1.0' encoding='utf-8'?>";// +
        // "<kml xmlns='http://www.opengis.net/kml/2.2'>" +
        // "<Document>" +
        // "<Folder>" +
        // "<name>" + name + "</name>";
    
        let kml = kmlformat.writeFeatures(features, {featureProjection: App4Sea.prefViewProj, externalProjection: App4Sea.prefProj});
        let coor = kml.match(/<coordinates>(.|\n)*?<\/coordinates>/g);
        if (coor) {
            let replace = false;
            for (let cind=0; cind<coor.length; cind++) {
                let patt = coor[cind].match(/[\ \,]/g);
                if (patt && patt[1] === ' ') {
                    replace = true;
                }
            }
            if (replace) {
                let match = kml.match(/<coordinates>(.|\n)*? /g, );
                while (match && match.length > 0) {
                    kml = kml.replace(match[0], match[0].substr(0, match[0].length-1) + 'Ðð');
                    match = kml.match(/<coordinates>(.|\n)*? /g, );
                }
                kml = kml.replaceAll('Ðð', ',0 ');
            }
        }
        
        let post = "";// +
        // "</Folder>" +
        // "</Document>" +
        // "</kml>";

        return pre + kml + post; 
    };

    ////////////////////////////////////////////////////////////////////////////
    // DoSaveKML
    my.DoSaveKML = function(text, filename) {
        let pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        pom.setAttribute('download', filename);
    
        if (document.createEvent) {
            let event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    };


    ////////////////////////////////////////////////////////////////////////////
    // altitudeToZoom
    my.altitudeToZoom = function (altitude) {
        const A = 40487.57;
        const B = 0.00007096758;
        const C = 91610.74;
        const D = -40467.74;
    
        return D+(A-D)/(1+Math.pow(altitude/C, B));
    };

    ////////////////////////////////////////////////////////////////////////////
    // GoHome
    my.GoHome = function () {
        let view = App4Sea.OpenLayers.Map.getView();
        view.setZoom(App4Sea.startZoom);
        view.setCenter(App4Sea.mapCenter);
    };

    ////////////////////////////////////////////////////////////////////////////
    // GetFeaturesExtension
    my.GetFeaturesExtension = function(features) {
        if (!features || features.length === 0)
            return;

        let extent = ol.extent.createEmpty();
        for (let ind=0; ind<features.length; ind++) {
            ol.extent.extend(extent, features[ind].getGeometry().getExtent());
        }

        if (App4Sea.logging) console.log("Extent is: " + extent[0] + ", " + extent[1] + ", " + extent[2] + ", " + extent[3]);

        return extent;
    };

    ////////////////////////////////////////////////////////////////////////////
    // LookAt
    my.LookAt = function(vector) {
        let extent = ol.extent.createEmpty();
        let size = App4Sea.OpenLayers.Map.getSize();

        if (vector.getSource) {
            let source = vector.getSource()

            if (source.getExtent) {
                extent = source.getExtent();
                if (App4Sea.logging) console.log("source.getExtent");
            }
            // else {
            //     extent = my.GetFeaturesExtension(source.getFeatures());
            // }
        }
        else {
            extent = vector.getExtent();
            if (App4Sea.logging) console.log("vector.getExtent");
        }
        
        if (!extent || extent[0] === Number.POSITIVE_INFINITY) {
            //if (App4Sea.logging) console.log("calculateExtent");

            extent = App4Sea.OpenLayers.Map.getView().calculateExtent(size);
            if (App4Sea.logging) console.log("view.calculateExtent");
        }

        if (extent) {
            //if (App4Sea.logging) console.log("Extent: " + extent[0] + ", " + extent[1] + ", " + extent[2] + ", " + extent[3]);

            if (extent[0] !== Number.POSITIVE_INFINITY && extent[1]) {
                if (App4Sea.logging) console.log("Look at: " + extent[0] + ", " + extent[1] + ", " + extent[2] + ", " + extent[3] + ". Size is: " + size);
                let view = App4Sea.OpenLayers.Map.getView();
                view.fit(extent, { duration: 1000, maxZoom: 10 });
            }
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // View in fullscreen
    my.toggleFullscreen = function () {
        if (document.fullscreenEnabled) {
            if (App4Sea.logging) console.log("Fullscreen is possible in browser");
        }
        else {
            if (App4Sea.logging) console.log("Fullscreen is not possible in browser");
        }

        if (!document.fullscreenElement) 
            my.openFullscreen();
        else
            my.closeFullscreen();
    };

    ////////////////////////////////////////////////////////////////////////////
    // View in fullscreen
    my.openFullscreen = function () {
        /* Get the documentElement (<html>) to display the page in fullscreen */
        let elem = document.documentElement;

        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // Close fullscreen 
    my.closeFullscreen = function () {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // Parse the URL and return its parts
    my.parseURL = function (url) {
        let parser = document.createElement('a'),
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
    };

    ////////////////////////////////////////////////////////////////////////////
    // SelectAuthority
    my.CheckChanged = function(cb) {
        
        
    }
        ////////////////////////////////////////////////////////////////////////////
    // SelectAuthority
    my.SelectAuthority = function(val) {

        let authNo = "- To be done -";
        let authNa = "- To be done -";
        let authWe = "- To be done -";

        const aNo = document.getElementById("AuthorityNotify");
        const aNa = document.getElementById("AuthorityNational");
        const aWe = document.getElementById("AuthorityWeather");
    
        if (val === "Iceland") {
            authNo = 
            "Operations Centre<br/> \
            The Icelandic Coastguard<br/>  \
            P.O. 7120 127 Reykjavik<br/> \
            Tel:    +354-545 2100 (24 hr)<br/> \
            Fax:    +354-545 2001<br/> \
            Email:  sar@lhg.is<br/> \
            Web: www.lhg.is<br/>";
            authNa =
            "Environmental Agency of Iceland (EAI) (Oil & HNS)<br/> \
            Suðurlandsbraut 24 108 Reykjavik<br/> \
            Tel:    +354-591 2000<br/> \
            Mobile: +354 822 4003<br/> \
            Fax:	+354-591 2010<br/> \
            Email:  ust@ust.is<br/> \
            Web:	www.ust.is<br/>";
            //authWe = "";
        }

        aNo.innerHTML = authNo;
        aNa.innerHTML = authNa;
        aWe.innerHTML = authWe;

    }

    ////////////////////////////////////////////////////////////////////////////
    // String.replaceAll
    String.prototype.replaceAll = function(search, replacement) {
        let target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };
    my.ReplaceAll = String.prototype.replaceAll;

    ////////////////////////////////////////////////////////////////////////////
    // Draw a red square according to extension
    my.drawSquare = function (ext) {

        let extents = { myBox: ext };
        
        let overlay = new ol.layer.Tile({
            extent: extents.myBox,
            source: new ol.source.TileJSON({
                url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
                crossOrigin: 'anonymous'
            })
        });
        
        App4Sea.OpenLayers.Map.addLayer(overlay);
        my.LookAt(overlay);
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //load an xml file and return as Vector
    my.loadXMLDoc =function (filename) {
        let xhttp = new XMLHttpRequest();
        xhttp.open("GET", filename, false);
        xhttp.send();
        return loadResonse(xhttp);
    };

    ////////////////////////////////////////////////////////////////////////////
    //load xml file and return as Vector
    my.loadResponse = function (xml) {
        let theXmlDoc = xml.responseXML;
        return theXmlDoc;
    };

    ////////////////////////////////////////////////////////////////////////////
    // heatMap
    my.heatMap = function (url, id, name) {
        const title = document.getElementById('titleHeatMap');
        const blur = document.getElementById('blur');
        const radius = document.getElementById('radius');

        title.innerHTML = name;
        const vector = new ol.layer.Heatmap({
            source: new ol.source.Vector({
                crossOrigin: 'anonymous',
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
            const name = event.feature.get('name');
            if (name) {
                const magnitude = parseFloat(name.substr(2));
                event.feature.set('weight', magnitude - 5);
            } 
            else {
                const surface = parseFloat(event.feature.values_['SURFACE']);
                event.feature.set('weight', surface - 33);
            }
        });
    
        blur.addEventListener(
            'input', 
            function () {
                vector.setBlur(parseInt(blur.value, 10));
            },
            false,
            {passive: true }
        );
    
        radius.addEventListener(
            'input', 
            function () {
                vector.setRadius(parseInt(radius.value, 10));
            },
            false,
            {passive: true}
        );
            
        return vector; 
    };

    ////////////////////////////////////////////////////////////////////////////
    // load an image
    my.loadImage = function (node, imageExtent, flag, url, id, text, layers, width, height, start) {
        url = url.replaceAll(/&amp;/, '&');

        if (App4Sea.logging) console.log("loadImage: " + url);
        
        let nameIs = text;//name.innerHTML;

        let image = new ol.layer.Image({
            name: nameIs,
            source: new ol.source.ImageStatic({
                url: url,
                imageExtent: imageExtent,
                //projection: App4Sea.prefProj
                crossOrigin: 'anonymous'
            })
        });

        return image;
    };
 
    ////////////////////////////////////////////////////////////////////////////
    // alreadyLayer checks if a node is alreay in the layer array and returns
    // the index if so. Else it returns -1
    my.alreadyLayer = function (id, arr){
        let count = arr.length;
        for (let i = 0; i < count; i++)
        {
            if (arr[i].id === id) {
                return i;
            }
        }
        return -1;
    };

    ////////////////////////////////////////////////////////////////////////////
    // alreadyActive checks if a node is already active (checked)
    my.alreadyActive = function (ol_uid, layers){
        let arr = layers.array_;
        let count = arr.length;
        for (let i = 0; i < count; i++)
        {
            if (arr[i].ol_uid === ol_uid) {
                return i;
            }
        }
        return -1;
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // Check if browser supports html5 storage
    my.supports_html5_storage = function (){
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } 
        catch (e) {
            return false;
        }
    };
    
    ////////////////////////////////////////////////////////////////////////////
    my.NoXML = function (text) {
        let txt;
        let data = text.trim();
        if (data.startsWith('<![CDATA['))
            txt = data.substr(9, data.length-12);
        else
            txt = data;

        return txt;
    };

    ////////////////////////////////////////////////////////////////////////////
    // allowDrop
    my.allowDrop = function (ev) {
        ev.preventDefault();
    };

    ////////////////////////////////////////////////////////////////////////////
    // drag
    my.drag = function (ev) {
        if (App4Sea.logging) console.log("Drag");
        ev.dataTransfer.setData("id", ev.target.id);
        ev.dataTransfer.setData("title", ev.target.name);
        if (App4Sea.logging) console.log(ev.target.id);
        if (App4Sea.logging) console.log(ev.target.name);
    };

    ////////////////////////////////////////////////////////////////////////////
    // drop
    my.drop = function (ev) {
        if (App4Sea.logging) console.log("Drop");
        ev.preventDefault();
        let id = ev.dataTransfer.getData("id");
        //ev.target.appendChild(document.getElementById(data));
        let title = ev.dataTransfer.getData("title");
        if (App4Sea.logging) console.log(id);
        if (App4Sea.logging) console.log(title);
    };

    ////////////////////////////////////////////////////////////////////////////
    // PutPlacemark
    my.PutPlacemark = function() {
        let iconStyle = new ol.style.Style({
            image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                anchor: [0.5, 0.5],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                opacity: 0.60,
                //src: 'https://www.freeiconspng.com/minicovers/file-light-bulb-yellow-icon-svg-2.png'
                //src: '/icons/OIL-TANKER-ISOLATED.png'
                //src: 'icons/OIL-TANKER-TAGGING-SUMMARY-OF-APPROACH-00.png'
                src: 'icons/VesselAndOil.svg',
                scale: 1.0
            }))
        });
        
        let vectorSource = new ol.source.Vector({
            //create empty vector
        });

        let center = App4Sea.OpenLayers.Map.getView().getCenter();
        let location = ol.proj.transform([21, 63], //Math.random()*360-180, Math.random()*180-90
        App4Sea.prefProj, 
        App4Sea.prefViewProj);
        location = center;

        //create a bunch of icons and add to source vector
        for (let i=0;i<1;i++){
            let iconFeature = new ol.Feature({
                geometry: new ol.geom.Point(location),
                name: 'Placemark ' + i,
                type: 'Placemark'
            });
            
            iconFeature.on('change',function(){
                console.log('Feature Moved To:' + this.getGeometry().getCoordinates());
            }, iconFeature);
            
            vectorSource.addFeature(iconFeature);

            let dragInteraction = new ol.interaction.Modify({
                features: new ol.Collection([iconFeature]),
                style: null
            });

            App4Sea.OpenLayers.Map.addInteraction(dragInteraction)
        }
        
        let vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: iconStyle
        });

        App4Sea.OpenLayers.Map.addLayer(vectorLayer);
        my.LookAt(vectorLayer);
    }
    ////////////////////////////////////////////////////////////////////////////
    // PrintReport
    my.PrintReport = function() {
    }
        ////////////////////////////////////////////////////////////////////////////
    // toMap
    let toMap = function() {
        heat.remove('#ControlPlaceInMenu');
        $(heat).appendTo('#ControlPlaceInMap');

        anim.remove('#ControlPlaceInMenu');
        $(anim).appendTo('#ControlPlaceInMap');

        meas.remove('#ControlPlaceInMenu');
        $(meas).appendTo('#ControlPlaceInMap');

        logg.remove('#ControlPlaceInMenu');
        $(logg).appendTo('#ControlPlaceInMap');

        oper.remove('#ControlPlaceInMenu');
        $(oper).appendTo('#ControlPlaceInMap');

        const heatIsOn = heat.style.display !== "none";
        const animIsOn = anim.style.display !== "none";
        const measIsOn = meas.style.display !== "none";
        const loggIsOn = logg.style.display !== "none";
        const operIsOn = oper.style.display !== "none";

        if (heatIsOn || animIsOn || measIsOn || loggIsOn || operIsOn) {
            place.style.visibility = 'visible';
            handle.style.visibility = 'visible';
        }
        else {
            place.style.visibility = 'hidden';
            handle.style.visibility = 'hidden';
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // toMenu
    let toMenu = function () {
        heat.remove('#ControlPlaceInMap');
        $(heat).appendTo('#ControlPlaceInMenu');

        anim.remove('#ControlPlaceInMap');
        $(anim).appendTo('#ControlPlaceInMenu');

        meas.remove('#ControlPlaceInMap');
        $(meas).appendTo('#ControlPlaceInMenu');

        logg.remove('#ControlPlaceInMap');
        $(logg).appendTo('#ControlPlaceInMenu');

        oper.remove('#ControlPlaceInMap');
        $(oper).appendTo('#ControlPlaceInMenu');

        place.style.visibility = 'hidden';
        handle.style.visibility = 'hidden';
    };

    ////////////////////////////////////////////////////////////////////////////
    // isCollapsed
    let isCollapsed = function (elName) {
        let itIs = true;
        if($(elName + ' li.jstree-open').length)
        {
            itIs = false;
        }
        return itIs;
    };

    ////////////////////////////////////////////////////////////////////////////
    // collapse_tree
    my.collapse_tree = function (btn, elName, collapse) {
        const elem = $(elName);
        if (collapse) {
            if (isCollapsed(elName)) {
                elem[0].style.visibility = 'hidden';
                elem[0].style.height = 0;
            }
            else {
                $(elName).jstree(false).close_all();
            }
        }
        else {
            {
                if (elem[0].style.visibility === 'hidden') {
                    elem[0].style.visibility = 'visible';
                    elem[0].style.height = '100%';
                }
                else {
                    $(elName).jstree(false).open_all();
                }
            }
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // section_toggle to make element visible to hidden
    my.section_toggle = function (id) {
        const elem = document.getElementById(id);
       
        if (elem !== null && elem.style.display === "none") {
            // We are opening the element
            my.w3_open(id);

            if (id === "MenuContainer") {
                // We are opening the menu
                toMenu();
            }
            else {
                // We are opening another element
                const menu = document.getElementById("MenuContainer");
                if (menu.style.display === 'block') {
                    // Menu is open
                    toMenu();
                }
                else {
                    toMap();
                }
            }
        }
        else {
            // We are closing the element
            my.w3_close(id);
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // w3_open
    my.w3_open = function (id) {
        const elem = document.getElementById(id);
        if (elem !== null) {
            elem.style.display = "block";
        }

        if (id === "MenuContainer") {
            $("#TreeMenu").jstree(true).close_all();

            toMenu();
        
            tools.style.display = 'none';
            if (window.innerWidth <= 500) {
                for (let ind=0; ind<navs.length; ind++) {
                    navs[ind].style.display = 'none';
                }
            }
        }
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // w3_close
    my.w3_close = function (id) {

        const elem = document.getElementById(id);
        if (elem !== null) {
            elem.style.display = "none";
        }

        if (id === "MenuContainer") {
            toMap();

            tools.style.display = 'block';
            for (let ind=0; ind<navs.length; ind++) {
                navs[ind].style.display = 'block';
            }
        }

        const heatIsOn = heat.style.display !== "none";
        const animIsOn = anim.style.display !== "none";
        const measIsOn = meas.style.display !== "none";
        const loggIsOn = logg.style.display !== "none";

        if (id === "HeatContainer") {
            if (heat !== null) {
                heat.style.display = "none";
            }
        } 
        if (id === "AnimationContainer") {
            if (anim !== null) {
                anim.style.display = "none";
            }
        }
        if (id === "LogContainer") {
            if (logg !== null) {
                logg.style.display = "none";
            }
        }
        if (id === "MeasurementContainer") {
            if (meas !== null) {
                meas.style.display = "none";
            }
        }

        let contentCount = 0;
        for (let ind=0; ind<place.children.length; ind++) {
            if (place.children[ind].style.display !== 'none') {
                contentCount++;
            }
        }

        if (contentCount === 1) { // only has DragHandle, no other content
            place.style.visibility = 'hidden';
            handle.style.visibility = 'hidden';
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // public method for encoding from http://www.webtoolkit.info/
    my.Base64Encode = function (input) {
        let output = "";
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        let i = 0;

        input = _utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output +
            _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
            _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    };

    ////////////////////////////////////////////////////////////////////////////
    // public method for decoding from http://www.webtoolkit.info/
    my.Base64Decode = function (input) {
        let output = "";
        let chr1, chr2, chr3;
        let enc1, enc2, enc3, enc4;
        let i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 !== 64) {
                output = output + String.fromCharCode(chr2);
            }

            if (enc4 !== 64) {
                output = output + String.fromCharCode(chr3);
            }
        }

        output = _utf8_decode(output);

        return output;
    };

    ////////////////////////////////////////////////////////////////////////////
    // private method for UTF-8 encoding from http://www.webtoolkit.info/
    let _utf8_encode = function (string) {
        string = string.replace(/\r\n/g,"\n");
        let utftext = "";

        for (let n = 0; n < string.length; n++) {
            let c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }

            else if((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }

        return utftext;
    };

    ////////////////////////////////////////////////////////////////////////////
    // private method for UTF-8 decoding from http://www.webtoolkit.info/
    let _utf8_decode = function (utftext) {
        let string = "";
        let i = 0;
        let c = c1 = c2 = 0;

        while ( i < utftext.length ) {
            c = utftext.charCodeAt(i);

            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            }
            else if((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i+1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            }
            else {
                c2 = utftext.charCodeAt(i+1);
                c3 = utftext.charCodeAt(i+2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    };

    ////////////////////////////////////////////////////////////////////////////
    // private method for UTF-8 decoding from http://www.webtoolkit.info/
    my.clearLog = function () {
        const logger = document.getElementById('Log');
        logger.innerHTML = '';
    };

    ////////////////////////////////////////////////////////////////////////////
    let getPosition = function (e) {
        e = e || window.event;

        let pos = ['X', 'Y'];

        if (!e.clientX) {
            //if (App4Sea.logging) console.log('Touches : ' + e.touches.length);
            
            let touch = e.touches[0];
            let x = touch.pageX;
            let y = touch.pageY;
            
            //if (App4Sea.logging) console.log('X : ' + x + ', Y: ' + y);

            pos.X = x;
            pos.Y = y;
        }
        else {
            pos.X = e.clientX;
            pos.Y = e.clientY;
        }

        return pos;
    };

    ////////////////////////////////////////////////////////////////////////////
    /*
        This is the order of events fired:
        touchstart
        touchmove
        touchend
        mouseover
        mousemove
        mousedown
        mouseup
        click    
     */
    let dragElement = function (elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        elmnt.addEventListener(
            'touchstart', 
            touchstart,
            false,
            {passive: false }
        );
        elmnt.addEventListener(
            'touchmove', 
            touchmove,
            false,
            {passive: false }
        );
        elmnt.addEventListener(
            'touchend', 
            touchend,
            false,
            {passive: false }
        );

        elmnt.onmousedown = dragMouseDown;
        elmnt.touchstart = touchstart;

        //if (App4Sea.logging) console.log('Have added drag listeners');

        function touchstart(e) {
            e = e || window.event;

            //if (App4Sea.logging) console.log('touchstart: ' + e.target.id);

            if (e.target.id === 'DragHandle')
            {
                e.preventDefault();

                //if (App4Sea.logging) console.log('X : ' + e.clientX + ', Y: ' + e.clientY);

                // get the mouse cursor position at startup:
                let pos = getPosition(e);
                pos3 = pos.X;
                pos4 = pos.Y;
            }
        }

        function touchmove(e) {
            e = e || window.event;

            //if (App4Sea.logging) console.log('touchmove: ' + e.target.id);

            if (e.target.id === 'DragHandle') {
                e.preventDefault();

                elementDrag(e);
            }
        }

        function touchend(e) {
            e = e || window.event;

            //if (App4Sea.logging) console.log('touchend: ' + e.target.id);

            if (e.target.id === 'DragHandle') {
                e.preventDefault();
            }
        }

        function dragMouseDown(e) {
            e = e || window.event;

            //if (App4Sea.logging) console.log('dragMouseDown: ' + e.target.id);

            if (e.target.id === 'DragHandle') {
                e.preventDefault();
                // get the mouse cursor position at startup:
                let pos = getPosition(e);
                pos3 = pos.X;
                pos4 = pos.Y;
                document.onmouseup = closeDragElement;
                // call a function whenever the cursor moves:
                document.onmousemove = elementDrag;
            }
        }

        function elementDrag(e) {
            e = e || window.event;
            
            //if (App4Sea.logging) console.log('elementDrag: ' + e.target.id);
            
            e.preventDefault();

            let pos = getPosition(e);
            // calculate and set the new cursor position:
            if (window.innerWidth > 500) {
                pos1 = pos3 - pos.X;
                pos3 = pos.X;
                elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
            } 
            else {
                pos1 = pos3 - pos.X;
                pos3 = pos.X;
                elmnt.style.left = "0px";
            }

            //if (App4Sea.logging) console.log('ew: ' + elmnt.clientWidth);
            //if (App4Sea.logging) console.log('sl: ' + elmnt.style.left + ', ol: ' + elmnt.offsetLeft + ', or: '  + (elmnt.offsetLeft + elmnt.clientWidth) + ', iw: '  + window.innerWidth);

            // Remember the 50% translation
            let trans = (elmnt.clientWidth/2 + 0.5);
            if (elmnt.offsetLeft - trans > window.innerWidth - 40) {
                elmnt.style.left = (window.innerWidth - 40 + trans) + "px";
            }
            else if (elmnt.offsetLeft - trans + elmnt.clientWidth < 40) {
                elmnt.style.left = (40 - elmnt.clientWidth + trans)  + "px";
            }

            //if (App4Sea.logging) console.log('pos2: ' + pos2 + ', pos4: ' + pos4 + ', Y: ' + pos.Y);
            pos2 = pos4 - pos.Y;
            pos4 = pos.Y;
            elmnt.style.top = (elmnt.offsetTop - pos2) + "px";

            //if (App4Sea.logging) console.log('elementDrag DONE: ' + e.target.id);
        }

        function closeDragElement(e) {
            e = e || window.event;

            // stop moving when mouse button is released:
            //if (App4Sea.logging) console.log('closeDragElement: ' + e.target.id);

            document.onmouseup = null;
            document.onmousemove = null;
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // SpotFromExtent
    my.SpotFromExtent = function (extent) {
        let spot = {lat, long};

        spot.lat = extent[3]-extent[1];
        spot.long = extent[4]-extent[2];

        return spot;
    };

    ////////////////////////////////////////////////////////////////////////////
    // FlyTo
    // location is e.g. london = fromLonLat([-0.12755, 51.507222]);
    // done is a function to callback when done
    my.FlyTo = function (location, done) {
        if (App4Sea.Animation.getAnimationState() !== "Stopped")
            return;

        let duration = 2000;
        let zoom = view.getZoom();
        let parts = 2;
        let called = false;

        function callback(complete) {
            --parts;
            if (called) {
                return;
            }
            if (parts === 0 || !complete) {
                called = true;
                done(complete);
            }
        }

        view.animate({center: location, duration: duration},  callback);
        view.animate({zoom: zoom - 1, duration: duration / 2}, {zoom: zoom, duration: duration / 2}, callback);
    };

    const place = document.getElementById("ControlPlaceInMap");
    const handle = document.getElementById("DragHandle");
    const heat = document.getElementById("HeatContainer");
    const anim = document.getElementById("AnimationContainer");
    const logg = document.getElementById("LogContainer");
    const meas = document.getElementById("MeasurementContainer");
    const oper = document.getElementById("OperationContainer");
    const tools = document.getElementById("ToolButtonsPlaceInMap");
    const navs = document.getElementsByClassName('ol-control');

    // Make the DIV element draggable:
    dragElement(place);

    return my;

}(App4SeaUtils || {}));
