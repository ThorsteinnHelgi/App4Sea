/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

ol = ol || {};
App4Sea = App4Sea || {};

App4Sea.Utils = (function () {
    "use strict";
    var my = {};

    my.parseURL = function (url) {
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
    };

    String.prototype.replaceAll = function(search, replacement) {
        var target = this;
        return target.replace(new RegExp(search, 'g'), replacement);
    };
    my.ReplaceAll = String.prototype.replaceAll;

    my.test = function () {
        console.log("Testing ...");

        my.layers.length = 0;

        var pdf = 'data/2017-05-09-EPPR-COSRVA-guts-and-cover-letter-size-digital-complete.pdf';
        var btn = document.getElementById('testBtn');
        //var oNewDoc = this.extractPages({42, 42, pdf});
    };

    //https://gis.stackexchange.com/questions/121555/wms-server-with-cors-enabled/147403#147403
//    (function() {
//        var cors_api_host = 'cors-anywhere.herokuapp.com';
//        var cors_api_url = 'https://' + cors_api_host + '/';
//        var slice = [].slice;
//        var origin = window.location.protocol + '//' + window.location.host;
//        var open = XMLHttpRequest.prototype.open;
//        XMLHttpRequest.prototype.open = function() {
//            var args = slice.call(arguments);
//            var targetOrigin = /^https?:\/\/([^\/]+)/i.exec(args[1]);
//            console.log("Ajax call: " + args[1]);
//            if (targetOrigin && targetOrigin[0].toLowerCase() !== origin &&
//                targetOrigin[1] !== cors_api_host) {
//                args[1] = cors_api_url + args[1];
//            }
//            return open.apply(this, args);
//        };
//    })();

    my.drawSquare = function (ext) {

        var extents = { myBox: ext };
        
        var overlay = new ol.layer.Tile({
            extent: extents.myBox,
            source: new ol.source.TileJSON({
                url: 'https://api.tiles.mapbox.com/v3/mapbox.world-light.json?secure',
                crossOrigin: 'anonymous'
            })
        });
        
        App4Sea.Map.OpenLayers.Map.addLayer(overlay);
    };
    
    ////////////////////////////////////////////////////////////////////////////
    //load an xml file and return as Vector
    my.loadXMLDoc =function (filename) {
        var xhttp = new XMLHttpRequest();
        xhttp.open("GET", filename, false);
        xhttp.send();
        return loadResonse(xhttp);
    };

    ////////////////////////////////////////////////////////////////////////////
    //load xml file and return as Vector
    my.loadResponse = function (xml) {
        var theXmlDoc = xml.responseXML;
        return theXmlDoc;
    };

    ////////////////////////////////////////////////////////////////////////////
    my.b64toBlob = function (b64Data, contentType, sliceSize) {
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
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // heatMap
    my.heatMap = function (url, id, name) {
        var blur = document.getElementById('blur');
        var radius = document.getElementById('radius');
        var title = document.getElementById('titleHeatMap');

        title.innerHTML = name;
        var vector = new ol.layer.Heatmap({
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
            var name = event.feature.get('name');
            var magnitude = parseFloat(name.substr(2));
            event.feature.set('weight', magnitude - 5);
        });

        blur.addEventListener('input', {passive: true}, function () {
            vector.setBlur(parseInt(blur.value, 10));
        });

        radius.addEventListener('input', {passive: true}, function () {
            vector.setRadius(parseInt(radius.value, 10));
        });
        
        return vector; 
    };
    
    my.createCORSRequest = function (method, url) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

      } else if (typeof XDomainRequest !== "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

      } else {

        // Otherwise, CORS is not supported by the browser.
        xhr = null;

      }
      return xhr;
    };
    
    ////////////////////////////////////////////////////////////////////////////
    // alreadyLayer checks if a node is alreay in the layer array and returns
    // the index if so. Else it returns -1
    my.alreadyLayer = function (id, arr){
        var count = arr.length;
        for (var i = 0; i < count; i++)
        {
            if (arr[i].id === id) {
                return i;
            }
        }
        return -1;
    };
    my.alreadyActive = function (ol_uid, layers){
        var arr = layers.array_;
        var count = arr.length;
        for (var i = 0; i < count; i++)
        {
            if (arr[i].ol_uid === ol_uid) {
                return i;
            }
        }
        return -1;
    };
    
    my.supports_html5_storage = function (){
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } 
        catch (e) {
            return false;
        }
    };
    
    return my;
}(App4Sea.Utils || {}));