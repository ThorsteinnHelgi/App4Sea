/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ========================================================================== */

import App4Sea from './App4Sea';


const App4SeaPopUps = (function () {
  const my = {};

  my.overlayLayerPopUp;// Used for popup information when clicking on icons
  const popupContent = document.getElementById('popup-content');
  const popupCloser = document.getElementById('popup-closer');
  const popupTitle = document.getElementById('popup-title');

  function setA4SOSRVesselInfo(feature) {
    const osr = {
      name: '',
      vessel_IMO: '',
      vessel_MMSI: '',
      SiteID: '',
      address: '',
      location: '',
      description: '',
      operation: '',
      vessel_class: '',
      vessel_loa: '',
      vessel_breadth: '',
      vessel_draught: '',
      vessel_GT: '',
      vessel_averageSpeed: '',
      vessel_build_year: '',
      equipment_crane: '',
      equipment_craneCapability: '',
      equipment_totalStorageCapacity: '',
      equipment_heatedStorage: '',
      linkinfo: '',
      linkicon: '',
      linkimage: '',
      linkvideo: '',
    };

    // ape_Norlense Offshore oil boom
    // ape_brush skimmer free floating
    // ape_sweepingArms
    // ape_sweepingWidth
    // Anti-pollution equipment
    // ape_LamorBrushSkimmers
    // ape_freefloatingskimmers
    // ape_Skimmer
    // ape_Bucketskimmer
    // ape_responsedivers
    // ape_boom
    // ape_Cargocontainer
    // ape_Towingcapacity
    // ape_Advancefirefightingfoam
    // ape_Recoverysystem
    // ape_Multihose
    // ape_Responsedivers
    // ape_Koseq
    // ape_Vikoma
    // ape_Desmi
    // ape_Miros
    // ape_Hig-capacity
    // ape_Navico
    // ape_Expandi4300
    // ape_FoxtailVAB4
    // ape_Bandskimmer
    // ape_EmergencyoffloadingpumpTK150
    // ape_Oildetectionradar

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
    osr.vessel_build_year = feature.get('vessel_build_year');
    osr.equipment_crane = feature.get('equipment_crane');
    osr.equipment_craneCapability = feature.get('equipment_craneCapability');
    osr.equipment_totalStorageCapacity = feature.get('equipment_totalStorageCapacity');
    osr.equipment_heatedStorage = feature.get('equipment_heatedStorage');
    osr.linkinfo = feature.get('linkinfo');
    osr.linkicon = feature.get('linkicon');
    osr.linkimage = feature.get('linkimage');
    osr.linkvideo = feature.get('linkvideo');

    let template = '<div style="margin:2px;"><table>';
    if (osr.vessel_IMO) template += '<tr><td>IMO</td><td><b>{{vessel_IMO}}</b></td></tr>';
    if (osr.vessel_MMSI) template += '<tr><td>MMSI</td><td><b>{{vessel_MMSI}}</b></td></tr>';
    if (osr.SiteID) template += '<tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>';
    if (osr.address) template += '<tr><td>Address</td><td><b>{{address}}</b></td></tr>';
    if (osr.location) template += '<tr><td>Location</td><td><b>{{location}}</b></td></tr>';
    if (osr.description) template = `${template}<tr><td>Description</td><td><b>${osr.description}</b></td></tr>`;
    if (osr.operation) template += '<tr><td>Operation</td><td><b>{{operation}}</b></td></tr>';
    if (osr.vessel_class) template += '<tr><td>Class</td><td><b>{{vessel_class}}</b></td></tr>';
    if (osr.vessel_loa) template += '<tr><td>LOA</td><td><b>{{vessel_loa}} m</b></td></tr>';
    if (osr.vessel_breadth) template += '<tr><td>Breadth</td><td><b>{{vessel_breadth}} m</b></td></tr>';
    if (osr.vessel_draught) template += '<tr><td>Draught</td><td><b>{{vessel_draught}} m</b></td></tr>';
    if (osr.vessel_GT) template += '<tr><td>GT</td><td><b>{{vessel_GT}} tonnes</b></td></tr>';
    if (osr.vessel_averageSpeed) template += '<tr><td>Average speed</td><td><b>{{vessel_averageSpeed}} kn</b></td></tr>';
    if (osr.vessel_build_year) template += '<tr><td>Build year</td><td><b>{{vessel_build_year}}</b></td></tr>';
    if (osr.equipment_crane) template += '<tr><td>Crane</td><td><b>{{equipment_crane}}</b></td></tr>';
    if (osr.equipment_craneCapability) template += '<tr><td>Crane capability</td><td><b>{{equipment_craneCapability}} tonnes</b></td></tr>';
    if (osr.equipment_totalStorageCapacity) template += '<tr><td>Total storage capacity</td><td><b>{{equipment_totalStorageCapacity}} tonnes</b></td></tr>';
    if (osr.equipment_heatedStorage) template += '<tr><td>Heated storage</td><td><b>{{equipment_heatedStorage}} m3</b></td></tr>';
    if (osr.linkinfo) template = `${template}<tr><td>Information</td><td><b>${osr.linkinfo}</b></td></tr>`;
    if (osr.linkicon) template = `${template}<tr><td>Icon</td><td><img class='osr-image' src='${osr.linkicon}' alt='{{name}}'></img></td></tr>`;
    if (osr.linkimage) template = `${template}<tr><td>Image</td><td><img class='osr-image' src='${osr.inkimage}' alt='{{name}}'></img></td></tr>`;
    if (osr.linkvideo) template = `${template}<tr><td>Video</td><td><video class='osr-video' src='${osr.linkvideo}' alt='{{name}}' autoplay controls></video></td></tr>`;
    template = `${template}</table></div>`;
    Mustache.parse(template);
    const description = Mustache.to_html(template, osr);

    return description;
  }

  function setA4SOSRAircraftInfo(feature) {
    const osr = {
      name: '',
      SiteID: '',
      address: '',
      location: '',
      description: '',
      operation: '',
      aircraft_specification_class: '',
      aircraft_specification_length: '',
      aircraft_specification_wingsWidth: '',
      aircraft_specification_height: '',
      aircraft_specification_startingWeight: '',
      aircraft_specification_maximumSpeed: '',
      aircraft_specification_engineManufacturer: '',
      aircraft_specification_maximumFuelCapacity: '',
      aircraft_specification_propellers: '',
      linkinfo: '',
      linkicon: '',
      linkimage: '',
      linkvideo: '',
    };
    /*
						<SimpleData name="cockpit_equipment_AIS_Systems">Yes</SimpleData>
						<SimpleData name="cockpit_equipment_Surveillance radar">Yes</SimpleData>
						<SimpleData name="cockpit_equipment_SLAR radar">Yes</SimpleData>
						<SimpleData name="cockpit_equipment_Scanner">UV/IR</SimpleData>
						<SimpleData name="cockpit_equipment_autopilot">Yes</SimpleData>
						<SimpleData name="cockpit_equipment_weather radar">Yes</SimpleData>
						<SimpleData name="cabin_equipment_loading space">Yes</SimpleData>
						<SimpleData name="cabin_equipment_door opener for lifegaurds"
            */

    osr.name = feature.get('name');
    osr.SiteID = feature.get('SiteID');
    osr.address = feature.get('address');
    osr.location = feature.get('location');
    osr.description = feature.get('description');
    osr.operation = feature.get('operation');
    osr.aircraft_specification_class = feature.get('aircraft_specification_class');
    osr.aircraft_specification_length = feature.get('aircraft_specification_length');
    osr.aircraft_specification_wingsWidth = feature.get('aircraft_specification_wingsWidth');
    osr.aircraft_specification_height = feature.get('aircraft_specification_height');
    osr.aircraft_specification_startingWeight = feature.get('aircraft_specification_startingWeight');
    osr.aircraft_specification_maximumSpeed = feature.get('aircraft_specification_maximumSpeed');
    osr.aircraft_specification_engineManufacturer = feature.get('aircraft_specification_engineManufacturer');
    osr.aircraft_specification_maximumFuelCapacity = feature.get('aircraft_specification_maximumFuelCapacity');
    osr.aircraft_specification_propellers = feature.get('aircraft_specification_propellers');
    osr.linkinfo = feature.get('linkinfo');
    osr.linkicon = feature.get('linkicon');
    osr.linkimage = feature.get('linkimage');
    osr.linkvideo = feature.get('linkvideo');

    let template = '<div style="margin:2px;"><table>';
    if (osr.SiteID) template += '<tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>';
    if (osr.address) template += '<tr><td>Address</td><td><b>{{address}}</b></td></tr>';
    if (osr.location) template += '<tr><td>Location</td><td><b>{{location}}</b></td></tr>';
    if (osr.description) template = `${template}<tr><td>Description</td><td><b>${osr.description}</b></td></tr>`;
    if (osr.operation) template += '<tr><td>Operation</td><td><b>{{operation}}</b></td></tr>';
    if (osr.aircraft_specification_class) template += '<tr><td>Class</td><td><b>{{aircraft_specification_class}}</b></td></tr>';
    if (osr.aircraft_specification_length) template += '<tr><td>Length</td><td><b>{{aircraft_specification_length}}</b></td></tr>';
    if (osr.aircraft_specification_wingsWidth) template += '<tr><td>Wing span</td><td><b>{{aircraft_specification_wingsWidth}}</b></td></tr>';
    if (osr.aircraft_specification_height) template += '<tr><td>Height</td><td><b>{{aircraft_specification_height}}</b></td></tr>';
    if (osr.aircraft_specification_startingWeight) template += '<tr><td>Starting weight</td><td><b>{{aircraft_specification_startingWeight}}</b></td></tr>';
    if (osr.aircraft_specification_maximumSpeed) template += '<tr><td>Maximum speed</td><td><b>{{aircraft_specification_maximumSpeed}}</b></td></tr>';
    if (osr.aircraft_specification_engineManufacturer) template += '<tr><td>Engine Manufacturer</td><td><b>{{aircraft_specification_engineManufacturer}}</b></td></tr>';
    if (osr.aircraft_specification_maximumFuelCapacity) template += '<tr><td>Fuel capacity</td><td><b>{{aircraft_specification_maximumFuelCapacity}}</b></td></tr>';
    if (osr.aircraft_specification_propellers) template += '<tr><td>Crane</td><td><b>{{aircraft_specification_propellers}}</b></td></tr>';
    if (osr.linkinfo) template = `${template}<tr><td>Information</td><td><b>${osr.linkinfo}</b></td></tr>`;
    if (osr.linkicon) template = `${template}<tr><td>Icon</td><td><img class='osr-image' src='${osr.linkicon}' alt='{{name}}'></img></td></tr>`;
    if (osr.linkimage) template = `${template}<tr><td>Image</td><td><img class='osr-image' src='${osr.linkimage}' alt='{{name}}'></img></td></tr>`;
    if (osr.linkvideo) template = `${template}<tr><td>Video</td><td><video class='osr-video' src='${osr.linkvideo}' alt='{{name}}' autoplay controls></video></td></tr>`;
    template = `${template}</table></div>`;
    Mustache.parse(template);
    const description = Mustache.to_html(template, osr);

    return description;
  }

  function setA4SOSRSiteInfo(feature) {
    const osr = {
      name: '',
      SiteID: '',
      address: '',
      description: '',
      linkinfo: '',
      linkicon: '',
      linkimage: '',
      linkvideo: '',
    };

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

    let template = '<div style="margin:2px;"><table>';
    if (osr.SiteID) template += '<tr><td>Site ID</td><td><b>{{SiteID}}</b></td></tr>';
    if (osr.address) template += '<tr><td>Address</td><td><b>{{address}}</b></td></tr>';
    if (osr.description) template = `${template}<tr><td>Description</td><td><b>${osr.description}</b></td></tr>`;
    if (osr.linkinfo) template = `${template}<tr><td>Information</td><td><b>${osr.linkinfo}</b></td></tr>`;
    if (osr.linkicon) template = `${template}<tr><td>Icon</td><td><img class='osr-image' src='${osr.linkicon}' alt='{{name}}'></img></td></tr>`;
    if (osr.linkimage) template = `${template}<tr><td>Image</td><td><img class='osr-image' src='${osr.linkimage}' alt='{{name}}'></img></td></tr>`;
    if (osr.linkvideo) template = `${template}<tr><td>Video</td><td><video class='osr-video' src='${osr.linkvideo}' alt='{{name}}' autoplay controls></video></td></tr>`;
    template = `${template}</table></div>`;
    Mustache.parse(template);
    const description = Mustache.to_html(template, osr);

    return description;
  }

  function setShipPassageInfo(feature) {
    const shipinfo = {
      name: '', callsign: '', type: '', cargotype: '', flag: '',
    };
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
    shipinfo.name = feature.get('Name');
    shipinfo.callsign = feature.get('Call_Sign');
    shipinfo.type = feature.get('Type');
    shipinfo.cargotype = feature.get('Cargo_Type');
    shipinfo.flag = feature.get('Flag');

    const template = // $('#ShipInfo').html();
            `<div style="margin:2px;"><table>
                <tr><td>Call sign</td><td><b>{{callsign}}</b></td></tr>
                <tr><td>Type</td><td><b>{{type}}</b></td></tr>
                <tr><td>Cargo type</td><td><b>{{cargotype}}</b></td></tr>
                <tr><td>Flag</td><td><b>{{flag}}</b></td></tr>
            </table></div>`;
    Mustache.parse(template);
    const description = Mustache.to_html(template, shipinfo);

    return description;
  }

  function getHeight(doc) {
    let pageHeight = 0;

    function findHighestNode(nodesList) {
      for (let i = nodesList.length - 1; i >= 0; i--) {
        if (nodesList[i].scrollHeight && nodesList[i].clientHeight && nodesList[i].offsetHeight) {
          const elHeight = Math.max(nodesList[i].scrollHeight, nodesList[i].clientHeight, nodesList[i].offsetHeight);
          pageHeight = Math.max(elHeight, pageHeight);
        }
        if (nodesList[i].childNodes.length) {
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
  function FindTemplate(node) {
    let template;

    if (node.nodeName === 'styleUrl') {
      for (let i = App4Sea.OpenLayers.styleMaps.length - 1; i >= 0; i--) {
        const styleUrlCore = App4Sea.Utils.parseURL(node.innerHTML);
        if (`#${App4Sea.OpenLayers.styleMaps[i].id}` === styleUrlCore.hash) {
          template = FindTemplate(App4Sea.OpenLayers.styleMaps[i].node);
          if (template) return template;
        }
      }
    }

    if (node.nodeName === 'BalloonStyle' && node.children.length > 0) {
      template = node.children[0].innerHTML;
      return template;
    }

    for (let cind = 0; cind < node.children.length; cind++) {
      const child = node.children[cind];

      template = FindTemplate(child);
      if (template) return template;
    }

    return template;
  }

  // Add a click handler to the map to render the popup.
  my.SingleClick = function (evt) {
    // if (App4Sea.logging) console.log("my.SingleClick");

    if (App4Sea.Measure.GetType() !== 'NotActive') {
      return;
    }

    const { coordinate } = evt;
    const features = [];

    App4Sea.OpenLayers.Map.forEachFeatureAtPixel(evt.pixel, (feature) => {
      if (App4Sea.logging) console.log(`SingleClick for feature: ${my.getTitle(feature)}`);
      features.push(feature);
    });

    if (App4Sea.logging) console.log(`Features are: ${features.length}`);

    const popups = [];
    popupTitle.innerHTML = 'Select one';
    popupContent.innerHTML = '';
    for (let ind = 0; ind < features.length; ind++) {
      // if (App4Sea.logging) console.log('SingleClick for feature: ' + my.getTitle(features[ind]));

      const popup = popUpFeature(features[ind]);

      if (features.length === 1) {
        popupTitle.innerHTML = popup.title;

        if (popup.description) {
          popupContent.innerHTML = popup.description;
          my.overlayLayerPopUp.setPosition(coordinate);
        }
      } else {
        const clean = popup.description.replaceAll("\'", '`').replaceAll('\n', '');// replaceAll("\"", "`")
        popupContent.innerHTML = `${popupContent.innerHTML
        }<div onclick="{ document.getElementById(\'popup-title\').innerHTML='${popup.title
        }'; document.getElementById(\'popup-content\').innerHTML='${clean
        }'; }">${
          ind.toString()} ${popup.title
        }</div><br>`;

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

    if (App4Sea.logging) console.log(`SchemaUrl: ${feature.get('schemaUrl')}`);

    const vessel_IMO = feature.get('vessel_IMO');
    const SiteID = feature.get('SiteID');
    const aircraft_specification_class = feature.get('aircraft_specification_class');
    const Id = feature.get('Id');
    if (vessel_IMO) {
      description = setA4SOSRVesselInfo(feature);
    } else if (aircraft_specification_class) {
      description = setA4SOSRAircraftInfo(feature);
    } else if (SiteID) {
      description = setA4SOSRVesselInfo(feature);
      // description = setA4SOSRSiteInfo(feature);
    } else if (Id) { // drake passage example
      description = setShipPassageInfo(feature);
    }

    if (description !== description || !description) {
      description = feature.get('name');
    }

    const styleUrl = feature.get('styleUrl');
    let template;
    for (let i = App4Sea.OpenLayers.styleMaps.length - 1; i >= 0; i--) {
      const styleUrlCore = App4Sea.Utils.parseURL(styleUrl);
      if (`#${App4Sea.OpenLayers.styleMaps[i].id}` === styleUrlCore.hash) {
        template = FindTemplate(App4Sea.OpenLayers.styleMaps[i].node);

        if (template) break;
      }
    }

    if (template === '$[description]') template = description;

    if (template) {
      const txt = App4Sea.Utils.NoXML(template);
      const realTemplate = txt;

      let moreRealTemplate = realTemplate.replaceAll(/\$\[(.+?)\//, '{{');
      moreRealTemplate = moreRealTemplate.replaceAll(']', '}}');

      // make http (and https) links active
      moreRealTemplate = moreRealTemplate.replaceAll('{{http', '{{{http');
      moreRealTemplate = moreRealTemplate.replaceAll(/{{{(.+?)}}/, /{{{(.+?)}}}/);

      description = App4Sea.PopUps.PopulateTemplate(moreRealTemplate, feature);
    }

    let title = my.getTitle(feature);

    if (!title) {
      title = '';
    }
    if (!description) {
      description = '';
    }

    return { title, description };
  }

  my.getTitle = function (feature) {
    let name = feature.get('name');
    if (!name) { // for vaare norske venner
      name = feature.get('navn');
    }

    return name;
  };

  my.PopulateTemplate = function (template, feature) {
    Mustache.parse(template);

    const retVal = Mustache.to_html(template, feature.values_);

    return retVal;
  };

  return my;
}());
App4Sea.PopUps = App4SeaPopUps;
