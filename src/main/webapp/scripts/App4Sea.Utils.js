/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

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
        
        App4Sea.OpenLayers.Map.addLayer(overlay);
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

    my.loadImage = function (flag, url, id, text, layers, width, height, start) {
        url = url.replaceAll(/&amp;/, '&');
            
// TBD finish this

        /*var west = parseFloat(overlay.querySelector('west').innerHTML);
        var south = parseFloat(overlay.querySelector('south').innerHTML);
        var east = parseFloat(overlay.querySelector('east').innerHTML);
        var north = parseFloat(overlay.querySelector('north').innerHTML);

        var imageExtent = ol.proj.transformExtent([west, south, east, north], App4Sea.prefProj, App4Sea.prefViewProj);*/
        //console.log("Image: W:" + west + " S:" + south + " E:" + east + " N:" + north + " Pro:" + App4Sea.prefProj + " ViewProj:" + App4Sea.prefViewProj);                
        var nameIs;
        //var name = overlay.querySelector('name');
        //if (name)
            nameIs = text;//name.innerHTML;

        let scale = 0.2;
        let imageExtent = ol.proj.transformExtent([10, 50, 0, 60], App4Sea.prefProj, App4Sea.prefViewProj);
        let image = new ol.layer.Image({
            name: nameIs,
            source: new ol.source.ImageStatic({
                url: url,
                imageExtent: imageExtent,
                crossOrigin: 'anonymous'
            })
        });

        return image;
    }

    my.createCORSRequest = function (method, url) {
      var xhr = new XMLHttpRequest();
      if ("withCredentials" in xhr) {

        // Check if the XMLHttpRequest object has a "withCredentials" property.
        // "withCredentials" only exists on XMLHTTPRequest2 objects.
        xhr.open(method, url, true);

      } 
      else if (typeof XDomainRequest !== "undefined") {

        // Otherwise, check if XDomainRequest.
        // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
        xhr = new XDomainRequest();
        xhr.open(method, url);

      } 
      else {

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
    
    my.allowDrop = function (ev) {
        ev.preventDefault();
    };

    my.drag = function (ev) {
        console.log("Drag");
        ev.dataTransfer.setData("id", ev.target.id);
        ev.dataTransfer.setData("title", ev.target.name);
        console.log(ev.target.id);
        console.log(ev.target.name);
    };

    my.drop = function (ev) {
        console.log("Drop");
        ev.preventDefault();
        var id = ev.dataTransfer.getData("id");
        //ev.target.appendChild(document.getElementById(data));
        var title = ev.dataTransfer.getData("title");
        console.log(id);
        console.log(title);
    };

    my.section_toggle = function (id) {
        if (document.getElementById(id).style.display === "none") {
            my.w3_open(id);
        }
        else {
            my.w3_close(id);
        }
    };

    my.collapse_tree = function (btn, elem) {
        var collapse = false;
        if($(elem+' li.jstree-open').length)
        {
            collapse = true;
        }
        if (collapse) {
            $(elem).jstree(true).close_all();
            btn.innerText="\u25BC";
        }
        else {
            $(elem).jstree(true).open_all();
            btn.innerText="\u25B2";
        }
    };

    my.w3_open = function (id) {
        if (id === "MenuContainer") {
            $("#TreeMenu").jstree(true).close_all();
        }
        document.getElementById(id).style.display = "block";
    };
    
    my.w3_close = function (id) {
        document.getElementById(id).style.display = "none";
    };


    /**
    *  Base64 encode / decode
    *  http://www.webtoolkit.info/
    **/

    //my.Base64 = {

        // private property
        const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        // public method for encoding
        my.Base64Encode = function (input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

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

        // public method for decoding
        my.Base64Decode = function (input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

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

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }

                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }

            output = _utf8_decode(output);

            return output;
        };

        // private method for UTF-8 encoding
        let _utf8_encode = function (string) {
            string = string.replace(/\r\n/g,"\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);

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

        // private method for UTF-8 decoding
         let _utf8_decode = function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

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
    //}
    
    return my;

}(App4Sea.Utils || {}));