/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

//import App4Sea from App4Sea.js;

// @ts-check
let App4SeaPopUps = (function () {
    "use strict";

    let my = {};
   
    my.overlayLayerPopUp;// Used for popup information when clicking on icons
    const popupContent = document.getElementById('popup-content');
    const popupCloser = document.getElementById('popup-closer');
    const popupTitle = document.getElementById('popup-title');

    function setA4SOSRVesselInfo(feature) {
        let osr = {name: "", 
        vessel_IMO: "", 
        vessel_MMSI: "", 
        SiteID: "", 
        address: "", 
        location: "", 
        description: "", 
        operation: "", 
        vessel_class: "", 
        vessel_loa: "", 
        vessel_breadth: "", 
        vessel_draught: "", 
        vessel_GT: "", 
        vessel_averageSpeed: "", 
        vessel_build: "", 
        equipment_crane: "", 
        equipment_craneCapability: "", 
        equipment_totalStorageCapacity: "", 
        equipment_heatedStorage: "", 
        linkinfo: "", 
        linkicon: "", 
        linkimage: "", 
        linkvideo: ""};
            
        osr.name = feature.get('name');
        osr.vessel_IMO = feature.get('vessel_IMO');
        osr.vessel_MMSI = feature.get('vessel_MMSI');
        osr.SiteID = feature.get('SiteID');
        osr.address = feature.get('address');
        osr.location = feature.get('location');
        osr.description = feature.get('description');
        osr.operation = feature.get('operation');
        osr.vessel_class = feature.get('vessel_class');
        osr.vessel_loa = feature.get('vessel_loa');
        osr.vessel_breadth = feature.get('vessel_breadth');
        osr.vessel_draught = feature.get('vessel_draught');
        osr.vessel_GT = feature.get('vessel_GT');
        osr.vessel_averageSpeed = feature.get('vessel_averageSpeed');
        osr.vessel_build = feature.get('vessel_build');
        osr.equipment_crane = feature.get('equipment_crane');
        osr.equipment_craneCapability = feature.get('equipment_craneCapability');
        osr.equipment_totalStorageCapacity = feature.get('equipment_totalStorageCapacity');
        osr.equipment_heatedStorage = feature.get('equipment_heatedStorage');
        osr.linkinfo = feature.get('linkinfo');
        osr.linkicon = feature.get('linkicon');
        osr.linkimage = feature.get('linkimage');
        osr.linkvideo = feature.get('linkvideo');

        let template = `<div style="margin:2px;"><table>`;
        if (osr.vessel_IMO) template = template + `<tr><td>IMO</td><td><b>{{vessel_IMO}}</b></td></tr>`;
        if (osr.vessel_MMSI) template = template + `<tr><td>MMSI</td><td><b>{{vessel_MMSI}}</b></td></tr>`;
        if (osr.SiteID) template = template + `<tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>`;
        if (osr.address) template = template + `<tr><td>Address</td><td><b>{{address}}</b></td></tr>`;
        if (osr.location) template = template + `<tr><td>Location</td><td><b>{{location}}</b></td></tr>`;
        if (osr.description) template = template + `<tr><td>Description</td><td><b>` + osr.description + `</b></td></tr>`;
        if (osr.operation) template = template + `<tr><td>Operation</td><td><b>{{operation}}</b></td></tr>`;
        if (osr.vessel_class) template = template + `<tr><td>Class</td><td><b>{{vessel_class}}</b></td></tr>`;
        if (osr.vessel_loa) template = template + `<tr><td>LOA</td><td><b>{{vessel_loa}}</b></td></tr>`;
        if (osr.vessel_breadth) template = template + `<tr><td>Breadth</td><td><b>{{vessel_breadth}}</b></td></tr>`;
        if (osr.vessel_draught) template = template + `<tr><td>Draught</td><td><b>{{vessel_draught}}</b></td></tr>`;
        if (osr.vessel_GT) template = template + `<tr><td>GT</td><td><b>{{vessel_GT}}</b></td></tr>`;
        if (osr.vessel_averageSpeed) template = template + `<tr><td>Average speed</td><td><b>{{vessel_averageSpeed}}</b></td></tr>`;
        if (osr.vessel_build) template = template + `<tr><td>Build year</td><td><b>{{vessel_build}}</b></td></tr>`;
        if (osr.equipment_crane) template = template + `<tr><td>Crane</td><td><b>{{equipment_crane}}</b></td></tr>`;
        if (osr.equipment_craneCapability) template = template + `<tr><td>Crane capability</td><td><b>{{equipment_craneCapability}}</b></td></tr>`;
        if (osr.equipment_totalStorageCapacity) template = template + `<tr><td>Total storage capacity</td><td><b>{{equipment_totalStorageCapacity}}</b></td></tr>`;
        if (osr.equipment_heatedStorage) template = template + `<tr><td>Heated storage</td><td><b>{{equipment_heatedStorage}}</b></td></tr>`;
        if (osr.linkinfo) template = template + `<tr><td>Information</td><td><b>`+ osr.linkinfo + `</b></td></tr>`;
        if (osr.linkicon) template = template + `<tr><td>Icon</td><td><img class='osr-image' src='{{linkicon}}' alt='{{name}}'></img></td></tr>`;
        if (osr.linkimage) template = template + `<tr><td>Image</td><td><img class='osr-image' src='{{linkimage}}' alt='{{name}}'></img></td></tr>`;
        if (osr.linkvideo) template = template + `<tr><td>Video</td><td><video class='osr-video' src='{{linkvideo}}' alt='{{name}}' autoplay controls></video></td></tr>`;
        template = template + `</table></div>`;
        Mustache.parse(template);
        let description = Mustache.to_html(template, osr);
        
        return description;
    }

    function setA4SOSRSiteInfo(feature) {
        let osr = {name: "", 
        SiteID: "", 
        address: "", 
        description: "", 
        linkinfo: "", 
        linkicon: "", 
        linkimage: "", 
        linkvideo: ""};
            
        osr.name = feature.get('name');
        osr.SiteID = feature.get('SiteID');
        osr.address = feature.get('address');
        osr.description = feature.get('description');
        osr.equipment_totalStorageCapacity = feature.get('equipment_totalStorageCapacity');
        osr.equipment_heatedStorage = feature.get('equipment_heatedStorage');
        osr.linkinfo = feature.get('linkinfo');
        osr.linkicon = feature.get('linkicon');
        osr.linkimage = feature.get('linkimage');
        osr.linkvideo = feature.get('linkvideo');

        let template = `<div style="margin:2px;"><table>`;
        if (osr.SiteID) template = template + `<tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>`;
        if (osr.address) template = template + `<tr><td>Address</td><td><b>{{address}}</b></td></tr>`;
        if (osr.description) template = template + `<tr><td>Description</td><td><b>` + osr.description + `</b></td></tr>`;
        if (osr.linkinfo) template = template + `<tr><td>Information</td><td><b>`+ osr.linkinfo + `</b></td></tr>`;
        if (osr.linkicon) template = template + `<tr><td>Icon</td><td><img class='osr-image' src='{{linkicon}}' alt='{{name}}'></img></td></tr>`;
        if (osr.linkimage) template = template + `<tr><td>Image</td><td><img class='osr-image' src='{{linkimage}}' alt='{{name}}'></img></td></tr>`;
        if (osr.linkvideo) template = template + `<tr><td>Video</td><td><video class='osr-video' src='{{linkvideo}}' alt='{{name}}' autoplay controls></video></td></tr>`;
        template = template + `</table></div>`;
        Mustache.parse(template);
        let description = Mustache.to_html(template, osr);
        
        return description;
    }

    function setShipPassageInfo(feature) {
        let shipinfo = {name: "", callsign: "", type: "", cargotype: "", flag: ""};
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
        shipinfo.name =  feature.get('Name');
        shipinfo.callsign =  feature.get('Call_Sign');
        shipinfo.type =  feature.get('Type');
        shipinfo.cargotype =  feature.get('Cargo_Type');
        shipinfo.flag =  feature.get('Flag');
        
        const template = //$('#ShipInfo').html();
            `<div style="margin:2px;"><table>
                <tr><td>Call sign</td><td><b>{{callsign}}</b></td></tr>
                <tr><td>Type</td><td><b>{{type}}</b></td></tr>
                <tr><td>Cargo type</td><td><b>{{cargotype}}</b></td></tr>
                <tr><td>Flag</td><td><b>{{flag}}</b></td></tr>
            </table></div>`;
        Mustache.parse(template);       
        let description = Mustache.to_html(template, shipinfo);

        return description;
    };

    function getHeight(doc) {
        let pageHeight = 0;

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
        if (App4Sea.logging) console.log('Page height is', pageHeight);

        return pageHeight;
    }
    
    // Finds BalloonStyle template from the text element of the Style node passed
    // returns the temmplate
    function FindTemplate (node) {
        let template;

        if (node.nodeName === 'styleUrl') {
            for (var i = App4Sea.OpenLayers.styleMaps.length - 1; i >= 0; i--) {
                var styleUrlCore = App4Sea.Utils.parseURL(node.innerHTML);
                if ("#"+App4Sea.OpenLayers.styleMaps[i].id === styleUrlCore.hash) {
                    template = FindTemplate(App4Sea.OpenLayers.styleMaps[i].node);
                    if (template)
                        return template;
                }
            }
        }

        if (node.nodeName === 'BalloonStyle' && node.children.length > 0) {
            template = node.children[0].innerHTML;
            return template;
        }

        for(let cind=0; cind<node.children.length; cind++){

            let child = node.children[cind];

            template = FindTemplate(child);
            if (template)
                return template;
        };        

        return template;
    }        
    
    // Add a click handler to the map to render the popup.
    my.SingleClick = function(evt) {
        //if (App4Sea.logging) console.log("my.SingleClick");
        
        if (App4Sea.Measure.GetType() !== 'NotActive') {
            return;
        }

        let coordinate = evt.coordinate;
        let features = [];

        App4Sea.OpenLayers.Map.forEachFeatureAtPixel(evt.pixel, function (feature) {
            if (App4Sea.logging) console.log('SingleClick for feature: ' + getTitle(feature));
            features.push(feature);
        });
        
        if (App4Sea.logging) console.log('Features are: ' + features.length);

        let popups = [];
        popupTitle.innerHTML = "Select one";
        popupContent.innerHTML = '';
        for (let ind = 0; ind<features.length; ind++) {
            //if (App4Sea.logging) console.log('SingleClick for feature: ' + getTitle(features[ind]));

            let popup = popUpFeature(features[ind]);

            if (features.length === 1) {
                popupTitle.innerHTML = popup.title;

                if (popup.description) {
                    popupContent.innerHTML = popup.description;
                    my.overlayLayerPopUp.setPosition(coordinate);
                }
            }
            else {
                let clean = popup.description.replaceAll("\"", "`").replaceAll("\'", "`").replaceAll("\n", "");
                popupContent.innerHTML = popupContent.innerHTML 
                    + `<div onclick="{ document.getElementById(\'popup-title\').innerHTML='` + popup.title 
                    + `'; document.getElementById(\'popup-content\').innerHTML='` + clean
                    + `'; }">` 
                    + ind.toString() + ' ' + popup.title 
                    + '</div><br>';

                my.overlayLayerPopUp.setPosition(coordinate);
            }
        } 
        if (features.length === 0) {
            my.overlayLayerPopUp.setPosition(undefined);
            popupCloser.blur();
        }
    };

    function popUpFeature(feature) {
        let description = feature.get('description');

        if (App4Sea.logging) console.log('SchemaUrl: ' + feature.get('schemaUrl'));

        const vessel_IMO = feature.get('vessel_IMO');
        const SiteID = feature.get('SiteID');
        const Id = feature.get('Id');
        if (vessel_IMO) {
            description = setA4SOSRVesselInfo(feature);
        }
        else if (SiteID) {
            description = setA4SOSRVesselInfo(feature);
            //description = setA4SOSRSiteInfo(feature);
        }
        else if (Id) {  //drake passage example
            description = setShipPassageInfo(feature);
        } 

        if (description !== description || !description) {
            description = feature.get('name');
        }

        let styleUrl = feature.get('styleUrl');
        let template;
        for (let i = App4Sea.OpenLayers.styleMaps.length - 1; i >= 0; i--) {
            let styleUrlCore = App4Sea.Utils.parseURL(styleUrl);
            if ("#"+App4Sea.OpenLayers.styleMaps[i].id === styleUrlCore.hash) {
                template = FindTemplate(App4Sea.OpenLayers.styleMaps[i].node);

                if (template)
                    break;
            }
        }

        if (template === '$[description]')
            template = description;

        if (template) {
            let txt = App4Sea.Utils.NoXML(template);
            let realTemplate = txt;

            let moreRealTemplate = realTemplate.replaceAll(/\$\[(.+?)\//, '{{');
            moreRealTemplate = moreRealTemplate.replaceAll(']', '}}');

            // make http (and https) links active
            moreRealTemplate = moreRealTemplate.replaceAll('{{http', '{{{http');
            moreRealTemplate = moreRealTemplate.replaceAll(/{{{(.+?)}}/, /{{{(.+?)}}}/);

            description = App4Sea.PopUps.PopulateTemplate(moreRealTemplate, feature);
        } 

        let title = getTitle(feature);

        if (!title) {
            title = "";
        }
        if (!description) {
            description = "";
        }

        return {'title' : title, 'description' : description};
    }
   
    function getTitle (feature) {
        let name = feature.get('name');
        if (!name) {// for vaare norske venner
            name = feature.get('navn');
        }

        return name;
    };

    my.initToolTip = function () {
        let map = App4Sea.OpenLayers.Map;

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
            
                let name = getTitle(features[ind]);
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

    my.PopulateTemplate = function (template, feature) {
        Mustache.parse(template);

        let retVal = Mustache.to_html(template, feature.values_);

        return retVal;
    };

    return my;
    
}());
App4Sea.PopUps = App4SeaPopUps;