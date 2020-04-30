/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ========================================================================== */

import Mustache from 'mustache';
import App4Sea from './App4Sea';
import App4SeaUtils from './App4Sea.Utils';

const App4SeaPopUps = (function () {
  const my = {};

  const popupContent = document.getElementById('popup-content');
  const popupCloser = document.getElementById('popup-closer');
  const popupTitle = document.getElementById('popup-title');

  function createOSR() {
    const osr = {
      name: '',
      site_ID: '',
      address: '',
      location: '',
      description: '',
      operator: '',
      operation: '',
      NCA_region: '',

      vessel_IMO: '',
      vessel_MMSI: '',
      vessel_class: '',
      vessel_loa: '',
      vessel_breadth: '',
      vessel_draught: '',
      vessel_GT: '',
      vessel_average_speed: '',
      vessel_build_year: '',

      equipment: '',
      equipment_boats: '',
      equipment_booms: '',
      equipment_booms_ENG: '',
      equipment_booms_L: '',
      equipment_booms_T_M: '',
      equipment_skimmers: '',
      equipment_pumps: '',
      equipment_absorbent_pads: '',
      equipment_absorbent_mats: '',
      equipment_crane: '',
      equipment_crane_capability: '',
      equipment_total_storage_capacity: '',
      equipment_heated_storage: '',

      ape_booms: '',
      ape_sweeping_arms: '',
      ape_sweeping_width: '',
      ape_ro_boom: '',
      ape_bucket_skimmer: '',
      ape_brush_skimmers: '',
      ape_response_divers: '',
      ape_skimmers: '',
      ape_sweeping_system: '',
      ape_free_floating_skimmers: '',

      aircraft_type: '',
      aircraft_specification_class: '',
      aircraft_specification_length: '',
      aircraft_specification_wing_span: '',
      aircraft_specification_height: '',
      aircraft_specification_starting_weight: '',
      aircraft_specification_maximum_take_off_weight: '',
      aircraft_specification_maximum_speed: '',
      aircraft_specification_maximum_range: '',
      aircraft_specification_engine: '',
      aircraft_specification_engine_manufacturer: '',
      aircraft_specification_maximum_fuel_capacity: '',
      aircraft_specification_propellers: '',
      aircraft_specification_dispersane_spraying_system_capacity: '',

      aircraft_equipment_radar: '',
      aircraft_equipment_SLAR_radar: '',
      aircraft_equipment_surveillance_sensors: '',
      aircraft_equipment_surveillance_camera: '',
      aircraft_equipment_sidebar_radar: '',
      aircraft_equipment_cargo_door: '',
      aircraft_equipment_scanner: '',

      linkinfo: '',
      linkicon: '',
      linkimage: '',
      linkvideo: '',
    };

    return osr;
  }

  function populateOSR(feature, osr) {
    osr.name = feature.get('name');

    for (const key in osr) {
      osr[key] = feature.get(key);
    }
  }

  function setA4SOSRGlobalInfo(feature) {
    const osr = createOSR();
    populateOSR(feature, osr);

    let template = `<div style="margin:2px;"
      onmousemove="$.App4Sea.Utils.StopProp(event)"
      onpointermove="$.App4Sea.Utils.StopProp(event)"
    ><table>`;
    if (osr.site_ID) template += `<tr><td>Site ID</td><td><b>{{site_ID}}</b></td></tr>`;
    if (osr.address) template += `<tr><td>Address</td><td><b>{{address}}</b></td></tr>`;
    if (osr.location) template += `<tr><td>Location</td><td><b>{{location}}</b></td></tr>`;
    if (osr.description) template += `<tr><td>Description</td><td><b>{{description}}</b></td></tr>`;
    if (osr.operator) template += `<tr><td>Operator</td><td><b>{{operator}}</b></td></tr>`;
    if (osr.operation) template += `<tr><td>Operation</td><td><b>{{operation}}</b></td></tr>`;

    if (osr.vessel_IMO) template += `<tr><td>IMO</td><td><b>{{vessel_IMO}}</b></td></tr>`;
    if (osr.vessel_MMSI) template += `<tr><td>MMSI</td><td><b>{{vessel_MMSI}}</b></td></tr>`;
    if (osr.vessel_class) template += `<tr><td>Class</td><td><b>{{vessel_class}}</b></td></tr>`;
    if (osr.vessel_loa) template += `<tr><td>LOA</td><td><b>{{vessel_loa}} m</b></td></tr>`;
    if (osr.vessel_breadth) template += `<tr><td>Breadth</td><td><b>{{vessel_breadth}} m</b></td></tr>`;
    if (osr.vessel_draught) template += `<tr><td>Draught</td><td><b>{{vessel_draught}} m</b></td></tr>`;
    if (osr.vessel_GT) template += `<tr><td>GT</td><td><b>{{vessel_GT}} tonnes</b></td></tr>`;
    if (osr.vessel_average_speed) template += `<tr><td>Average speed</td><td><b>{{vessel_average_speed}} kn</b></td></tr>`;
    if (osr.vessel_build_year) template += `<tr><td>Build year</td><td><b>{{vessel_build_year}}</b></td></tr>`;

    if (osr.equipment) template += `<tr><td>Equipment</td><td><b>{{equipment}}</b></td></tr>`;
    if (osr.equipment_total_storage_capacity) template += `<tr><td>Total Storage Capacity</td><td><b>{{equipment_total_storage_capacity}}</b></td></tr>`;
    if (osr.equipment_heated_storage) template += `<tr><td>Heated Storage</td><td><b>{{equipment_heated_storage}}</b></td></tr>`;
    if (osr.equipment_boats) template += `<tr><td>Boats</td><td><b>{{equipment_boats}}</b></td></tr>`;
    if (osr.equipment_booms) template += `<tr><td>Booms</td><td><b>{{equipment_booms}}</b></td></tr>`;
    if (osr.equipment_booms_ENG) template += `<tr><td>Booms ENG</td><td><b>{{equipment_booms_ENG}}</b></td></tr>`;
    if (osr.equipment_booms_L) template += `<tr><td>Booms L</td><td><b>{{equipment_booms_L}}</b></td></tr>`;
    if (osr.equipment_booms_T_M) template += `<tr><td>Booms T/M</td><td><b>{{equipment_booms_T_M}}</b></td></tr>`;
    if (osr.equipment_skimmers) template += `<tr><td>Skimmers</td><td><b>{{equipment_skimmers}}</b></td></tr>`;
    if (osr.equipment_pumps) template += `<tr><td>Pumps</td><td><b>{{equipment_pumps}}</b></td></tr>`;
    if (osr.equipment_absorbent_pads) template += `<tr><td>Absorbent Pads</td><td><b>{{equipment_absorbent_pads}}</b></td></tr>`;
    if (osr.equipment_absorbent_mats) template += `<tr><td>Absorbent Mats</td><td><b>{{equipment_absorbent_mats}}</b></td></tr>`;
    if (osr.equipment_crane) template += `<tr><td>Crane</td><td><b>{{equipment_crane}}</b></td></tr>`;
    if (osr.equipment_crane_capability) template += `<tr><td>Crane capability</td><td><b>{{equipment_crane_capability}} tonnes</b></td></tr>`;
    if (osr.equipment_total_storage_capacity) template += `<tr><td>Total storage capacity</td><td><b>{{equipment_total_storage_capacity}} tonnes</b></td></tr>`;
    if (osr.equipment_heated_storage) template += `<tr><td>Heated storage</td><td><b>{{equipment_heated_storage}} m3</b></td></tr>`;

    if (osr.ape_sweeping_arms) template += `<tr><td>APE Sweeping Arms</td><td><b>{{ape_sweeping_arms}} m3</b></td></tr>`;
    if (osr.ape_sweeping_width) template += `<tr><td>APE Sweeping Width</td><td><b>{{ape_sweeping_width}} m3</b></td></tr>`;
    if (osr.ape_booms) template += `<tr><td>APE Booms</td><td><b>{{ape_booms}} m3</b></td></tr>`;
    if (osr.ape_ro_boom) template += `<tr><td>APE RO Booms</td><td><b>{{ape_ro_boom}} m3</b></td></tr>`;
    if (osr.ape_bucket_skimmer) template += `<tr><td>APE Bucket skimmers</td><td><b>{{ape_bucket_skimmer}} m3</b></td></tr>`;
    if (osr.ape_brush_skimmers) template += `<tr><td>APE Brush skimmers</td><td><b>{{ape_brush_skimmers}} m3</b></td></tr>`;
    if (osr.ape_response_divers) template += `<tr><td>APE Response divers</td><td><b>{{ape_response_divers}} m3</b></td></tr>`;
    if (osr.ape_skimmers) template += `<tr><td>APE Skimmers</td><td><b>{{ape_skimmers}} m3</b></td></tr>`;
    if (osr.ape_sweeping_system) template += `<tr><td>APE Sweeping system</td><td><b>{{ape_sweeping_system}} m3</b></td></tr>`;
    if (osr.ape_free_floating_skimmers) template += `<tr><td>APE Free floating skimmers</td><td><b>{{ape_free_floating_skimmers}} m3</b></td></tr>`;

    if (osr.linkinfo) {
      const links = osr.linkinfo.split(',');
      for (let ind = 0; ind < links.length; ind++) {
        const link = links[ind];
        template += `<tr><td>More information</td><td><a href="${link}" target="_blank">Link</a></td></tr>`;
      }
    }
    if (osr.linkicon) template += `<tr><td>Icon</td><td><img class="osr-image" src="{{linkicon}}" alt="{{name}}"></td></tr>`;
    if (osr.linkimage) template += `<tr><td>Image</td><td><img class="osr-image" src="{{linkimage}}" alt="{{name}}"></td></tr>`;
    // if (osr.linkvideo) template += `<tr><td>Video</td><td><video class="osr-video" src="{{linkvideo}}" alt="{{name}}" autoplay controls></video></td></tr>`;
    if (osr.linkvideo) template += `<tr><td>Video</td><td><iframe height="120px" src="{{linkvideo}}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></td></tr>`;

    if (osr.aircraft_type) template += `<tr><td>Type</td><td><b>{{aircraft_type}}</b></td></tr>`;
    if (osr.aircraft_specification_class) template += `<tr><td>Class</td><td><b>{{aircraft_specification_class}}</b></td></tr>`;
    if (osr.aircraft_specification_length) template += `<tr><td>Length</td><td><b>{{aircraft_specification_length}}</b></td></tr>`;
    if (osr.aircraft_specification_wing_span) template += `<tr><td>Wing span</td><td><b>{{aircraft_specification_wing_span}}</b></td></tr>`;
    if (osr.aircraft_specification_height) template += `<tr><td>Height</td><td><b>{{aircraft_specification_height}}</b></td></tr>`;
    if (osr.aircraft_specification_starting_weight) template += `<tr><td>Starting weight</td><td><b>{{aircraft_specification_starting_weight}}</b></td></tr>`;
    if (osr.aircraft_specification_maximum_take_off_weight) template += `<tr><td>Max take-off weight</td><td><b>{{aircraft_specification_maximum_take_off_weight}}</b></td></tr>`;
    if (osr.aircraft_specification_maximum_speed) template += `<tr><td>Maximum speed</td><td><b>{{aircraft_specification_maximum_speed}}</b></td></tr>`;
    if (osr.aircraft_specification_maximum_range) template += `<tr><td>Max range</td><td><b>{{aircraft_specification_maximum_range}}</b></td></tr>`;
    if (osr.aircraft_specification_engine) template += `<tr><td>Engine</td><td><b>{{aircraft_specification_engine}}</b></td></tr>`;
    if (osr.aircraft_specification_engine_manufacturer) template += `<tr><td>Engine Manufacturer</td><td><b>{{aircraft_specification_engine_manufacturer}}</b></td></tr>`;
    if (osr.aircraft_specification_maximum_fuel_capacity) template += `<tr><td>Fuel capacity</td><td><b>{{aircraft_specification_maximum_fuel_capacity}}</b></td></tr>`;
    if (osr.aircraft_specification_propellers) template += `<tr><td>Crane</td><td><b>{{aircraft_specification_propellers}}</b></td></tr>`;
    if (osr.aircraft_specification_dispersane_spraying_system_capacity) template += `<tr><td>Dispersant spraying system capacity</td><td><b>{{aircraft_specification_dispersane_spraying_system_capacity}}</b></td></tr>`;

    if (osr.aircraft_equipment_radar) template += `<tr><td>Radar</td><td><b>{{aircraft_equipment_radar}}</b></td></tr>`;
    if (osr.aircraft_equipment_SLAR_radar) template += `<tr><td>SLAR radar</td><td><b>{{aircraft_equipment_SLAR_radar}}</b></td></tr>`;
    if (osr.aircraft_equipment_surveillance_sensors) template += `<tr><td>Surveillance sensors</td><td><b>{{aircraft_equipment_surveillance_sensors}}</b></td></tr>`;
    if (osr.aircraft_equipment_surveillance_camera) template += `<tr><td>Surveillance camera</td><td><b>{{aircraft_equipment_surveillance_camera}}</b></td></tr>`;
    if (osr.aircraft_equipment_sidebar_radar) template += `<tr><td>Sidebar radar</td><td><b>{{aircraft_equipment_sidebar_radar}}</b></td></tr>`;
    if (osr.aircraft_equipment_cargo_door) template += `<tr><td>Cargo door</td><td><b>{{aircraft_equipment_cargo_door}}</b></td></tr>`;
    if (osr.aircraft_equipment_scanner) template += `<tr><td>Scanner</td><td><b>{{aircraft_equipment_scanner}}</b></td></tr>`;

    template += `</table></div>`;
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

    const template = `<div style="margin:2px;"
      onmousemove="$.App4Sea.Utils.StopProp(event)"
      onpointermove="$.App4Sea.Utils.StopProp(event)"
    ><table>
      <tr><td>Call sign</td><td><b>{{callsign}}</b></td></tr>
      <tr><td>Type</td><td><b>{{type}}</b></td></tr>
      <tr><td>Cargo type</td><td><b>{{cargotype}}</b></td></tr>
      <tr><td>Flag</td><td><b>{{flag}}</b></td></tr>
    </table></div>`;
    Mustache.parse(template);
    const description = Mustache.to_html(template, shipinfo);

    return description;
  }

  // function getHeight(doc) {
  //   let pageHeight = 0;

  //   function findHighestNode(nodesList) {
  //     for (let i = nodesList.length - 1; i >= 0; i--) {
  //       if (nodesList[i].scrollHeight && nodesList[i].clientHeight && nodesList[i].offsetHeight) {
  //         const elHeight = Math.max(nodesList[i].scrollHeight, nodesList[i].clientHeight, nodesList[i].offsetHeight);
  //         pageHeight = Math.max(elHeight, pageHeight);
  //       }
  //       if (nodesList[i].childNodes.length) {
  //         findHighestNode(nodesList[i].childNodes);
  //       }
  //     }
  //   }

  //   findHighestNode(doc.documentElement.childNodes);

  //   // The entire page height is found
  //   if (App4Sea.logging) console.log('Page height is', pageHeight);

  //   return pageHeight;
  // }

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

  function popUpFeature(feature) {
    let description = feature.get('description');

    // if (App4Sea.logging) console.log(`SchemaUrl: ${feature.get('schemaUrl')}`);

    const styleUrl = feature.get('styleUrl');
    // const vessel_IMO = feature.get('vessel_IMO');
    // const site_ID = feature.get('site_ID');
    // const aircraft_specification_class = feature.get('aircraft_specification_class');
    const Id = feature.get('Id');
    if (styleUrl.endsWith('msn_ferry')) {
      description = setA4SOSRGlobalInfo(feature);
    } else if (styleUrl.endsWith('msn_aircraft')) {
      description = setA4SOSRGlobalInfo(feature);
    } else if (styleUrl.endsWith('msn_ranger_station')) {
      description = setA4SOSRGlobalInfo(feature);
    } else if (Id) { // drake passage example
      description = setShipPassageInfo(feature);
    }

    if (!description || App4SeaUtils.isNaN(description)) {
      description = feature.get('name');
    }

    // const styleUrl = feature.get('styleUrl');
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

  // Add a click handler to the map to render the popup.
  my.SingleClick = function (evt) {
    // if (App4Sea.logging) console.log("my.SingleClick");

    if (App4Sea.Measure.GetType() !== 'NotActive') {
      return;
    }

    const { coordinate } = evt;
    const features = [];

    App4Sea.OpenLayers.Map.forEachFeatureAtPixel(evt.pixel, (feature) => {
      // if (App4Sea.logging) console.log(`SingleClick for feature: ${my.getTitle(feature)}`);
      features.push(feature);
    });

    // if (App4Sea.logging) console.log(`Features are: ${features.length}`);

    popupTitle.innerHTML = '';
    popupContent.innerHTML = '';
    let cont = '';
    for (let ind = 0; ind < features.length; ind++) {
      // if (App4Sea.logging) console.log('SingleClick for feature: ' + my.getTitle(features[ind]));

      const popup = popUpFeature(features[ind]);

      if (features.length === 1) {
        popupTitle.innerHTML = popup.title;

        if (popup.description) {
          cont = popup.description;
        }
      } else {
        popupTitle.innerHTML = 'Select one';
        let clean = popup.description;
        clean = clean.replaceAll('\'', '`');
        clean = clean.replaceAll('\n', '');
        clean = clean.replaceAll('"', '`');

        cont = `${cont}
        <div style="pointer-events: auto;"
        onmousemove="$.App4Sea.Utils.StopProp(event)"
        onpointermove="$.App4Sea.Utils.StopProp(event)"
        onclick="{
          document.getElementById('popup-title').innerHTML='${popup.title}';
          document.getElementById('popup-content').innerHTML=##'${clean}'##;
        }">
          ${ind.toString()} <u style="color: blue">${popup.title}</u>
        </div>`;
      }

      if (ind > 0 && (ind % 25) === 0) {
        cont += '</div><div>';
      }
    }

    cont = cont.replaceAll('`', '\'').replaceAll('##\'', '`').replaceAll('\'##', '`');
    popupContent.innerHTML = `<div><div>${cont}</div></div>`;
    // console.log(popupContent.innerHTML);
    if (features.length === 0) {
      App4Sea.OpenLayers.overlayLayerPopUp.setPosition(undefined);
      popupCloser.blur();
    } else {
      App4Sea.OpenLayers.overlayLayerPopUp.setPosition(coordinate);
    }
  };

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
