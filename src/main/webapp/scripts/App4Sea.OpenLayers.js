/* ==========================================================================
 * (c) 2018 Arni Geir Sigurðsson            arni.geir.sigurdsson(at)gmail.com
 *          Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * ========================================================================== */

import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import XYZ from 'ol/source/XYZ';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import ZoomSlider from 'ol/control/ZoomSlider';
import Zoom from 'ol/control/Zoom';
import FullScreen from 'ol/control/FullScreen';
import Rotate from 'ol/control/Rotate';
import MousePosition from 'ol/control/MousePosition';
import OverviewMap from 'ol/control/OverviewMap';
import ScaleLine from 'ol/control/ScaleLine';
import * as proj from 'ol/proj';
import * as coordinate from 'ol/coordinate';
import App4Sea from './App4Sea';
import 'ol/ol.css';

// @ts-check
const App4SeaOpenLayers = (function () {
  const my = {};

  // Some further definitions
  my.Map;
  my.styleMaps = []; // array to hold styles as they are created
  my.layers = []; // array to hold layers as they are created
  my.descriptionContainer;

  let currentLayer;
  let osmTileLayer;
  let esriWSPTileLayer;
  let esriWITileLayer;
  let blackTileLayer;

  // //////////////////////////////////////////////////////////////////////////
  // initialize maps and models when page DOM is ready..
  my.Init = function () {
    initBasemapLayerTiles();

    CreateBaseMap();

    currentLayer = esriWSPTileLayer;

    updateBaseMap();

    SetMapControls();

    initMenu();

    InitPopup();

    // let res = App4Sea.Utils.supports_html5_storage();
    // if (App4Sea.logging) console.log("Support for html5 local storage: " + res);
  };

  // //////////////////////////////////////////////////////////////////////////
  // Init all base maps
  function initBasemapLayerTiles() {
    my.descriptionContainer = document.getElementById('InfoPopup');
    // overlayDescription = my.InitOverlay(my.descriptionContainer);

    // Init osmTileLayer base map
    osmTileLayer = new TileLayer({
      name: 'osmTileLayer',
      crossOriginKeyword: 'anonymous',
      source: new OSM(),
    });

    // Init esriWSPTileLayer base map
    esriWSPTileLayer = new TileLayer({
      name: 'esriWSPTileLayer',
      crossOriginKeyword: 'anonymous',
      source: new XYZ({
        attributions: ['&copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/0">ArcGIS World Street Map</a>'],
        // //                rendermode: 'image',
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    // Init esriWITileLayer base map (Satelite Images)
    esriWITileLayer = new TileLayer({
      name: 'esriWITileLayer',
      crossOriginKeyword: 'anonymous',
      source: new XYZ({
        attributions: ['&copy; <a href="https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/0">ArcGIS World Imagery Map</a>'],
        // rendermode: 'image',
        url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      }),
    });

    blackTileLayer = new TileLayer({
      name: 'blackTileLayer',
      crossOriginKeyword: 'anonymous',
      source: new XYZ({
        attributions: ['&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'],
        // rendermode: 'image',
        url: 'http://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      }),
    });
  }

  // //////////////////////////////////////////////////////////////////////////
  // Create base map and store in my.Map
  function CreateBaseMap() {
    // init OpenLayer map with MapBox tiles
    const map = new Map({
      target: 'MapContainer',
      // interaction: interaction,
      view: new View({
        center: App4Sea.mapCenter,
        zoom: App4Sea.startZoom,
        minZoom: App4Sea.minZoom,
        maxZoom: App4Sea.maxZoom,
      }),
    });

    my.Map = map;

    my.Map.on('singleclick', (evt) => {
      App4Sea.PopUps.SingleClick(evt);
    });

    my.Map.on('not_working', (evt) => {
      App4Sea.Weather.NotWorking(evt);
    });
  }

  // //////////////////////////////////////////////////////////////////////////
  // MapChange
  my.MapChange = function () {
    const mapSelector2 = $('#MenuLayer_Select2');
    const mapSelector = $('#MenuLayer_Select');
    mapSelector[0].selectedIndex = mapSelector2[0].selectedIndex;
    updateBaseMap();
  };

  // //////////////////////////////////////////////////////////////////////////
  // Update base map
  function updateBaseMap() {
    // Set base map
    const selectedMapLayer = $('#MenuLayer_Select').val();
    if (selectedMapLayer !== currentLayer.name) {
      my.Map.removeLayer(currentLayer);
      const el = $('#MenuContainer');
      const el2 = $('#ButtonsForMenu');
      const el3 = $('#ButtonsForTools');
      const el4 = $('#ButtonsForSettings');
      const el5 = $('#ButtonsForToolsInMap');
      const cursPos = document.getElementsByClassName('ol-mouse-position');
      if (selectedMapLayer === 'osmTileLayer') {
        // el[0].style.backgroundColor = 'white';
        el[0].style.backgroundImage = 'let(--gradientWhite)';
        el[0].style.color = 'black';
        el2[0].style.filter = 'invert(0%)';
        el3[0].style.filter = 'invert(0%)';
        el4[0].style.filter = 'invert(0%)';
        el5[0].style.filter = 'invert(0%)';
        if (cursPos && cursPos.length > 0) cursPos[0].style.color = 'black';
        currentLayer = osmTileLayer;
      } else if (selectedMapLayer === 'esriWSPTileLayer') {
        el[0].style.backgroundImage = 'let(--gradientBeige)';
        el[0].style.color = 'black';
        el2[0].style.filter = 'invert(0%)';
        el3[0].style.filter = 'invert(0%)';
        el4[0].style.filter = 'invert(0%)';
        el5[0].style.filter = 'invert(0%)';
        if (cursPos && cursPos.length > 0) cursPos[0].style.color = 'black';
        currentLayer = esriWSPTileLayer;
      } else if (selectedMapLayer === 'esriWITileLayer') {
        // el[0].style.backgroundColor = '#163e6f';
        el[0].style.backgroundImage = 'let(--gradientBlue)';
        el[0].style.color = 'beige';
        el2[0].style.filter = 'invert(100%)';
        el3[0].style.filter = 'invert(100%)';
        el4[0].style.filter = 'invert(100%)';
        el5[0].style.filter = 'invert(100%)';
        if (cursPos && cursPos.length > 0) cursPos[0].style.color = 'beige';
        currentLayer = esriWITileLayer;
      } else if (selectedMapLayer === 'blackTileLayer') {
        // el[0].style.backgroundColor = '#0d0d0d';
        el[0].style.backgroundImage = 'let(--gradientGray)';
        el[0].style.color = 'gray';
        el2[0].style.filter = 'invert(100%)';
        el3[0].style.filter = 'invert(100%)';
        el4[0].style.filter = 'invert(100%)';
        el5[0].style.filter = 'invert(100%)';
        if (cursPos && cursPos.length > 0) cursPos[0].style.color = 'gray';
        currentLayer = blackTileLayer;
      }
      const layers = my.Map.getLayerGroup().getLayers();
      layers.insertAt(0, currentLayer);
      // my.Map.addLayer(currentLayer);
    }
  }

  // //////////////////////////////////////////////////////////////////////////7
  // Set the basic map controls
  function SetMapControls() {
    // Add standard map controls
    my.Map.addControl(new ZoomSlider());
    my.Map.addControl(new Zoom());
    my.Map.addControl(new FullScreen());
    my.Map.addControl(new Rotate({ autoHide: false, class: 'ol-rotate' }));
    const ctrl = new MousePosition({
      projection: App4Sea.prefProj,
      coordinateFormat(coord) {
        const xy = proj.transform(coord, App4Sea.prefProj, App4Sea.prefViewProj);
        let str = coordinate.toStringHDMS(coord);
        str = `${str}<br>${coordinate.toStringXY(coord, 6)}`;
        str = `${str}<br>${coordinate.toStringXY(xy, 0)}`;
        return str;
      },
      undefinedHTML: '',
    });
    my.Map.addControl(ctrl);
    my.Map.addControl(new OverviewMap({
      layers: [currentLayer],
      collapsed: true,
    }));
    my.Map.addControl(new ScaleLine());// Not correct scale
  }

  // //////////////////////////////////////////////////////////////////////////
  // Init all menu items
  function initMenu() {
    // Set up TreeMenu
    App4Sea.TreeMenu.SetUp();

    // Set up TreeInfo
    App4Sea.TreeInfo.SetUp();

    // Hook events to menu
    $("#MenuContainer input[type='checkbox']").click(() => {
      updateBaseMap();
    });
    $('#MenuContainer select').change(() => {
      updateBaseMap();
    });
  }

  function InitPopup() {
    const popupContainer = document.getElementById('popup');
    const popupCloser = document.getElementById('popup-closer');

    // Create an overlay to anchor the popup to the map.
    App4Sea.PopUps.overlayLayerPopUp = InitOverlay(popupContainer, popupCloser);

    my.Map.addOverlay(App4Sea.PopUps.overlayLayerPopUp);

    InitToolTip();
  }

  // //////////////////////////////////////////////////////////////////////////
  // InitToolTip
  function InitToolTip() {
    const map = my.Map;

    const displayFeatureInfo = function (pixel) {
      $('#ToolTipInfo').css({
        left: `${pixel[0]}px`,
        top: `${pixel[1] - 15}px`,
      });

      const features = [];

      map.forEachFeatureAtPixel(pixel, (feature, layer) => {
        // if (App4Sea.logging) console.log('displayFeatureInfo for feature: ' + App4Sea.PopUps.getTitle(feature));
        features.push(feature);
      });

      // if (App4Sea.logging) console.log('Features are: ' + features.length);

      const tips = [];
      let txt = '';
      $('#ToolTipInfo').tooltip('hide');
      const inf = $('#ToolTipInfo');
      inf.innerHTML = '';
      for (let ind = 0; ind < features.length; ind++) {
        const name = App4Sea.PopUps.getTitle(features[ind]);
        if (name) {
          if (features.length === 1) {
            txt = name;
          } else {
            txt = `${txt + ind.toString()} ${name}<br>`;
            // if (App4Sea.logging) console.log('Tooltip: ' + txt);
          }
          inf.tooltip('hide')
            .attr('data-original-title', txt)
            .tooltip('show');
        }
      }
    };
    map.on('pointermove', (evt) => {
      if (evt.dragging) {
        $('#ToolTipInfo').tooltip('hide');
        return;
      }
      displayFeatureInfo(map.getEventPixel(evt.originalEvent));
    });

    $(map.getViewport()).on('mousemove', (evt) => {
      displayFeatureInfo(map.getEventPixel(evt.originalEvent));
    });
  }

  // //////////////////////////////////////////////////////////////////////////
  // Overlay with auto pan
  function InitOverlay(container, closer) {
    const overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 2000,
      },
    });

    if (closer) {
      // Add a click handler to hide the overlay.
      // @return {boolean} Don't follow the href.
      closer.onclick = function () {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };
    }

    return overlay;
  }

  return my;
}());
App4Sea.OpenLayers = App4SeaOpenLayers;

export default { App4SeaOpenLayers };
