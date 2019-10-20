/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

App4SeaPopUps = (function () {
    "use strict";

    let my = {};
   
    my.overlayLayerPopUp;// Used for popup information when clicking on icons
    const popupContent = document.getElementById('popup-content');
    const popupCloser = document.getElementById('popup-closer');
    const popupTitle = document.getElementById('popup-title');

    function setA4SOSRVesselInfo(features) {
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
        descripequipment_heatedStoragetion: "", 
        linkinfo: "", 
        linkicon: "", 
        linkimage: "", 
        linkvideo: ""};
            
        osr.name = features[0].get('name');
        osr.vessel_IMO = features[0].get('vessel_IMO');
        osr.vessel_MMSI = features[0].get('vessel_MMSI');
        osr.SiteID = features[0].get('SiteID');
        osr.address = features[0].get('address');
        osr.location = features[0].get('location');
        osr.description = features[0].get('description');
        osr.operation = features[0].get('operation');
        osr.vessel_class = features[0].get('vessel_class');
        osr.vessel_loa = features[0].get('vessel_loa');
        osr.vessel_breadth = features[0].get('vessel_breadth');
        osr.vessel_draught = features[0].get('vessel_draught');
        osr.vessel_GT = features[0].get('vessel_GT');
        osr.vessel_averageSpeed = features[0].get('vessel_averageSpeed');
        osr.vessel_build = features[0].get('vessel_build');
        osr.equipment_crane = features[0].get('equipment_crane');
        osr.equipment_craneCapability = features[0].get('equipment_craneCapability');
        osr.equipment_totalStorageCapacity = features[0].get('equipment_totalStorageCapacity');
        osr.equipment_heatedStorage = features[0].get('equipment_heatedStorage');
        osr.linkinfo = features[0].get('linkinfo');
        osr.linkicon = features[0].get('linkicon');
        osr.linkimage = features[0].get('linkimage');
        osr.linkvideo = features[0].get('linkvideo');

        const template = //$('#RescueSite').html();
        `<div style="margin:2px;"><table>
        <tr><td>IMO</td><td><b>{{vessel_IMO}}</b></td></tr>
        <tr><td>MMSI</td><td><b>{{vessel_MMSI}}</b></td></tr>
        <tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>
        <tr><td>Address</td><td><b>{{address}}</b></td></tr>
        <tr><td>Location</td><td><b>{{location}}</b></td></tr>
        <tr><td>Description</td><td><b>` + osr.description + `</b></td></tr>
        <tr><td>Operation</td><td><b>{{operation}}</b></td></tr>
        <tr><td>Class</td><td><b>{{vessel_class}}</b></td></tr>
        <tr><td>LOA</td><td><b>{{vessel_loa}}</b></td></tr>
        <tr><td>Breadth</td><td><b>{{vessel_breadth}}</b></td></tr>
        <tr><td>Draught</td><td><b>{{vessel_draught}}</b></td></tr>
        <tr><td>GT</td><td><b>{{vessel_GT}}</b></td></tr>
        <tr><td>Average speed</td><td><b>{{vessel_averageSpeed}}</b></td></tr>
        <tr><td>Build year</td><td><b>{{vessel_build}}</b></td></tr>
        <tr><td>Crane</td><td><b>{{equipment_crane}}</b></td></tr>
        <tr><td>Crane capability</td><td><b>{{equipment_craneCapability}}</b></td></tr>
        <tr><td>Total storage capacity</td><td><b>{{equipment_totalStorageCapacity}}</b></td></tr>
        <tr><td>Heated storage</td><td><b>{{equipment_heatedStorage}}</b></td></tr>
        <tr><td>Information</td><td><b>` + osr.linkinfo + `</b></td></tr>
        <tr><td>Icon</td><td><img class='osr-image' src='{{linkicon}}' alt='{{name}}'><img></td></tr>
        <tr><td>Image</td><td><img class='osr-image' src='{{linkimage}}' alt='{{name}}'><img></td></tr>
        <tr><td>Video</td><td><video class='osr-video' src='{{linkvideo}}' alt='{{name}}' autoplay controls></video></td></tr>
        </table></div>`;
        Mustache.parse(template);
        let description = Mustache.to_html(template, osr);
        
        return description;
    }

    function setA4SOSRSiteInfo(features) {
        let osr = {name: "", 
        SiteID: "", 
        address: "", 
        description: "", 
        linkinfo: "", 
        linkicon: "", 
        linkimage: "", 
        linkvideo: ""};
            
        osr.name = features[0].get('name');
        osr.SiteID = features[0].get('SiteID');
        osr.address = features[0].get('address');
        osr.description = features[0].get('description');
        osr.equipment_totalStorageCapacity = features[0].get('equipment_totalStorageCapacity');
        osr.equipment_heatedStorage = features[0].get('equipment_heatedStorage');
        osr.linkinfo = features[0].get('linkinfo');
        osr.linkicon = features[0].get('linkicon');
        osr.linkimage = features[0].get('linkimage');
        osr.linkvideo = features[0].get('linkvideo');

        const template = //$('#RescueSite').html();
        `<div style="margin:2px;"><table>
        <tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>
        <tr><td>Address</td><td><b>{{address}}</b></td></tr>
        <tr><td>Description</td><td><b>` + osr.description + `</b></td></tr>
        <tr><td>Information</td><td><b>` + osr.linkinfo + `</b></td></tr>
        <tr><td>Icon</td><td><img class='osr-image' src='{{linkicon}}' alt='{{name}}'><img></td></tr>
        <tr><td>Image</td><td><img class='osr-image' src='{{linkimage}}' alt='{{name}}'><img></td></tr>
        <tr><td>Video</td><td><video class='osr-video' src='{{linkvideo}}' alt='{{name}}' autoplay controls></video></td></tr>
        </table></div>`;
        Mustache.parse(template);
        let description = Mustache.to_html(template, osr);
        
        return description;
    }

    function setNorwegianOSRInfo(features) {
        let beredskap = {name: "", region: "", region2: "", region3: "", region4: "", address: "", link: ""};

        beredskap.name = features[0].get('navn');
        beredskap.address = features[0].get('gateadresse');
        beredskap.region = features[0].get('fylke');
        beredskap.region2 = features[0].get('kyv_region');
        beredskap.region3 = features[0].get('kommune');
        beredskap.region4 = features[0].get('lua');
        beredskap.link = features[0].get('lenke_faktaark');

        const template = //$('#RescueSite').html();
            `<div style="margin:2px;">
                <tr><td>Address</td><td><b>{{address}}</b></td></tr>
                <tr><td>Region</td><td><b>{{region}}</b></td></tr>
                <tr><td>Coastguard region</td><td><b>{{region2}}</b></td></tr>
                <tr><td>Commune</td><td><b>{{region3}}</b></td></tr>
                <tr><td>LUA</td><td><b>{{region4}}</b></td></tr>
                <tr><td>Link</td><td><b>` + beredskap.link +`</b></td></tr>
            </div>`;
        Mustache.parse(template);
        let description = Mustache.to_html(template, beredskap);
        
        return description;
    };

    function setShipPassageInfo(features) {
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
        shipinfo.name =  features[0].get('Name');
        shipinfo.callsign =  features[0].get('Call_Sign');
        shipinfo.type =  features[0].get('Type');
        shipinfo.cargotype =  features[0].get('Cargo_Type');
        shipinfo.flag =  features[0].get('Flag');
        
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

        // if (node.nodeName === 'StyleMap' && node.children.length > 0) {
        //     template = node.children[0].innerHTML;
        //     return template;
        // }
        
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
            features.push(feature);
        });
        
        if (features.length > 0) {
            let description = features[0].get('description');

            if (features[0].get('vessel_IMO')) {
                description = setA4SOSRVesselInfo(features);
            }
            else if (features[0].get('SiteID')) {
                description = setA4SOSRSiteInfo(features);
            }
            else if (features[0].get('navn')) {
                description = setNorwegianOSRInfo(features);
            }
            else if(features[0].get('Id')){  //drake passage example
                description = setShipPassageInfo(features);
            } 

            if (!description) {
                description = features[0].get('name');
            }

            let styleUrl = features[0].get('styleUrl');
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

                description = App4Sea.PopUps.PopulateTemplate(moreRealTemplate, features[0]);
            } 

            let title = getTitle(features[0]);
            if (title) {
                popupTitle.innerHTML = title;
            }
            else {
                popupTitle.innerHTML = "";
            }

            if (description) {
                popupContent.innerHTML = description;
                my.overlayLayerPopUp.setPosition(coordinate);
            }
        } 
        else {
            my.overlayLayerPopUp.setPosition(undefined);
            popupCloser.blur();
        }
    };
   
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
            let feature = map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return feature;
            });
            if (feature) {
                let name = getTitle(feature);
                if (name) {
                    let inf = $('#ToolTipInfo');
                    inf.tooltip('hide')
                            .attr('data-original-title', name)
                            //.tooltip('fixTitle')
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

        let retVal = Mustache.to_html(template, feature.values_);

        return retVal;
    };

    return my;
    
}());
App4Sea.PopUps = App4SeaPopUps;