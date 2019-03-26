/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

Mustache = Mustache || {};
App4Sea = App4Sea || {};
App4Sea.Map = App4Sea.Map || {};
App4Sea.Map.OpenLayers = App4Sea.Map.OpenLayers || {};

App4Sea.PopUps = (function () {
    "use strict";

    var my = {};
   
    my.overlayLayerPopUp;// Used for popup information when clicking in icons
    var popupContent;
    var popupContainer;
    var popupCloser;

    my.Init = function(){
        popupContent = document.getElementById('popup-content');
        popupContainer = document.getElementById('popup');
        popupCloser = document.getElementById('popup-closer');

        // Create an overlay to anchor the popup to the map.
        my.overlayLayerPopUp = App4Sea.Map.OpenLayers.initOverlay(popupContainer, popupCloser);
    
        App4Sea.Map.OpenLayers.Map.addOverlay(my.overlayLayerPopUp);
    };
    
//        <script id="DefaultPop" type="text/template">
//            <div style="margin:2px;">
//                <p>{{description}}</p>
//            </div>
//        </script>
    
    function setNorwegianOSRInfo(features) {
        var beredskap = {name: "", region: "", region2: "", region3: "", region4: "", address: "", link: ""};

        beredskap.name = features[0].get('navn');
        beredskap.address = features[0].get('gateadresse');
        beredskap.region = features[0].get('fylke');
        beredskap.region2 = features[0].get('kyv_region');
        beredskap.region3 = features[0].get('kommune');
        beredskap.region4 = features[0].get('lua');
        beredskap.link = features[0].get('lenke_faktaark');

        var template = //$('#RescueSite').html();
            `<div style="margin:2px;">
                <h3>{{name}}</h3>
                <p>{{address}}</p>
                <p>{{region}}</p>
                <p>{{region2}}</p>
                <p>{{region3}}</p>
                <p>{{region4}}</p>
                <p>{{{link}}}</p>
            </div>`;
        Mustache.parse(template);
        var description = Mustache.to_html(template, beredskap);
        
        return description;
    };

     function setShipPassageInfo(features) {
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
        
        var template = //$('#ShipInfo').html();
            `<div style="margin:2px;">
                <h3>{{name}}</h3>
                <p>{{callsign}}</p>
                <p>{{type}}</p>
                <p>{{cargotype}}</p>
                <p>{{flag}}</p>
            </div>`;
        Mustache.parse(template);       
        var description = Mustache.to_html(template, shipinfo);

        return description;
    };

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
    
    // Finds BalloonStyle template from the text element of the Style node passed
    // returns the temmplate
    function FindTemplate (node) {
        var template;

        if (node.nodeName === 'styleUrl') {
            for (var i = App4Sea.Map.OpenLayers.styleMaps.length - 1; i >= 0; i--) {
                var styleUrlCore = App4Sea.Utils.parseURL(node.innerHTML);
                if ("#"+App4Sea.Map.OpenLayers.styleMaps[i].id === styleUrlCore.hash) {
                    template = FindTemplate(App4Sea.Map.OpenLayers.styleMaps[i].node);
                    if (template)
                        return template;
                }
            }
        }

        if (node.nodeName === 'BalloonStyle' && node.children.length > 0) {
            template = node.children[0].innerHTML;
            return template;
        }

        for(var cind=0; cind<node.children.length; cind++){

            var child = node.children[cind];

            //if (child.children && child.children.length > 0) {
                //var cur = child;
                //var predecessors = [];
                //var par = cur.parentNode;
                //while (par) {
                //    predecessors.push(par);
                //    par = par.parentNode;
                //}
                //if (predecessors && predecessors.length<4) {
                    template = FindTemplate(child);
                    if (template)
                        return template;
                //}
            //}
        };        

        return template;
    }        
    
    // Add a click handler to the map to render the popup.
    my.SingleClick = function(evt) {
        console.log("my.SingleClick");
        
        var coordinate = evt.coordinate;
        //var hdms = ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326'));
        //popupContent.innerHTML = '<p>You clicked here:</p><code>' + hdms + '</code>';
        var features = [];
        App4Sea.Map.OpenLayers.Map.forEachFeatureAtPixel(evt.pixel, function (feature) {
            features.push(feature);
        });
        
        if (features.length > 0) {
            var description = features[0].get('description');

            if (features[0].get('navn')) {
                description = setNorwegianOSRInfo(features);
            }
            else if(features[0].get('Id')){  //drake passage example
                description = setShipPassageInfo(features);
            } 

            if (!description) {
                description = features[0].get('name');
            }

            var styleUrl = features[0].get('styleUrl');
            var template;
            for (var i = App4Sea.Map.OpenLayers.styleMaps.length - 1; i >= 0; i--) {
                var styleUrlCore = App4Sea.Utils.parseURL(styleUrl);
                if ("#"+App4Sea.Map.OpenLayers.styleMaps[i].id === styleUrlCore.hash) {
                    template = FindTemplate(App4Sea.Map.OpenLayers.styleMaps[i].node);

                    if (template)
                        break;
                }
            }

            if (template) {
                var realTemplate = template.substr(9);
                realTemplate = realTemplate.substr(0, realTemplate.length-3);

                var moreRealTemplate = realTemplate.replaceAll(/\$\[(.+?)\//, '{{');
                moreRealTemplate = moreRealTemplate.replaceAll(']', '}}');

                // make http (and https) links active
                moreRealTemplate = moreRealTemplate.replaceAll('{{http', '{{{http');
                moreRealTemplate = moreRealTemplate.replaceAll(/{{{(.+?)}}/, /{{{(.+?)}}}/);

                description = App4Sea.PopUps.PopulateTemplate(moreRealTemplate, features[0]);
            } 

            popupContent.innerHTML = description;
            my.overlayLayerPopUp.setPosition(coordinate);
        } 
        else {
            my.overlayLayerPopUp.setPosition(undefined);
            popupCloser.blur();
        }
    };
   
    my.initToolTip = function () {
        var map = App4Sea.Map.OpenLayers.Map;

        var displayFeatureInfo = function (pixel) {
            $('#ToolTipInfo').css({
                left: pixel[0] + 'px',
                top: (pixel[1] - 15) + 'px'
            });
            var feature = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return feature;
            });
            if (feature) {
                var name = feature.get('name');
                if (!name) {// for vaare norske venner
                    name = feature.get('navn');
                }
                if (name) {
                    var inf = $('#ToolTipInfo');
                    inf.tooltip('hide')
                            .attr('data-original-title', name)
                            .tooltip('fixTitle')
                            .tooltip('show');
                }
                else {
                    $('#ToolTipInfo').tooltip('hide');
                }
            } 
            else {
                $('#ToolTipInfo').tooltip('hide');
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

    my.PopulateTemplate = function (template, feature) {
        Mustache.parse(template);

        var retVal = Mustache.to_html(template, feature.values_);

        return retVal;
    };

    return my;
    
}(App4Sea.PopUps || {}));