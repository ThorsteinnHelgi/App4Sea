/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * Adapted from https://openlayers.org/en/latest/examples/measure.html
 *
 * ========================================================================== */


import { Polygon, LineString } from 'ol/geom';
import {
  Style, Fill, Stroke, Circle,
} from 'ol/style';
import { Vector } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';
import Overlay from 'ol/Overlay';
import { Feature } from 'ol';
import {
  GPX, GeoJSON, IGC, KML, TopoJSON,
} from 'ol/format';
import * as sphere from 'ol/sphere';
import * as interaction from 'ol/interaction';
import * as proj from 'ol/proj';
import App4Sea from './App4Sea';


const App4SeaMeasure = (function () {
  const my = {};
  let tempLayers = []; // array to hold droped layers as they are created

  // //////////////////////////////////////////////////////////////////////////
  let draw; // global so we can remove it later
  let source;
  let vector;
  let sketch; // Currently drawn feature. @type {module:ol/Feature~Feature}
  let helpTooltipElement; // The help tooltip element. @type {Element}
  let helpTooltip; // Overlay to show the help messages. @type {module:ol/Overlay}
  let measureTooltipElement; // The measure tooltip element. @type {Element}
  let measureTooltip; // Overlay to show the measurement. @type {module:ol/Overlay}
  const continuePolygonMsg = 'Click to continue drawing\nthe polygon to measure area'; // Message to show when the user is drawing a polygon. @type {string}
  const continueLineMsg = 'Click to continue drawing\nthe line to measure length'; // Message to show when the user is drawing a line. @type {string}
  let type = 'NotActive';// 'Polygon' 'LineString' or 'NotActive'
  let dragAndDropInteraction;

  // //////////////////////////////////////////////////////////////////////////
  // pointerMoveHandler
  // @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt The event.
  const pointerMoveHandler = function (evt) {
    if (type === 'NotActive' || evt.dragging) {
      return;
    }

    let helpMsg = 'Click to start measuring'; // @type {string}

    if (sketch) {
      const geom = (sketch.getGeometry());
      if (geom instanceof Polygon) {
        helpMsg = continuePolygonMsg;
      } else if (geom instanceof LineString) {
        helpMsg = continueLineMsg;
      }
    }

    helpTooltipElement.innerHTML = helpMsg;
    helpTooltip.setPosition(evt.coordinate);

    helpTooltipElement.classList.remove('hidden');
  };

  // //////////////////////////////////////////////////////////////////////////
  // Format length output.
  // @param {module:ol/geom/LineString~LineString} line The line.
  // @return {string} The formatted length.
  const formatLength = function (line) {
    const length = sphere.getLength(line);
    let output;
    if (length > 100) {
      output = `${Math.round(length / 1000 * 100) / 100} ` + 'km';
    } else {
      output = `${Math.round(length * 100) / 100} ` + 'm';
    }

    return output;
  };

  // //////////////////////////////////////////////////////////////////////////
  // Format area output.
  // @param {module:ol/geom/Polygon~Polygon} polygon The polygon.
  // @return {string} Formatted area.
  const formatArea = function (polygon) {
    const area = sphere.getArea(polygon);
    let output;
    if (area > 10000) {
      output = `${Math.round(area / 1000000 * 100) / 100} ` + 'km<sup>2</sup>';
    } else {
      output = `${Math.round(area * 100) / 100} ` + 'm<sup>2</sup>';
    }

    return output;
  };

  // //////////////////////////////////////////////////////////////////////////
  function addInteraction(typ) {
    type = typ;
    draw = new interaction.Draw({
      source,
      type,
      style: new Style({
        fill: new Fill({ color: 'rgba(255, 55, 55, 0.2)' }),
        stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2 }),
        image: new Circle({
          radius: 5,
          stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }),
          fill: new Fill({ color: 'rgba(255, 55, 55, 0.2)' }),
        }),
      }),
    });
    App4Sea.OpenLayers.Map.addInteraction(draw);

    createMeasureTooltip();
    createHelpTooltip();

    let listener;
    draw.on('drawstart',
      (evt) => {
        // set sketch
        sketch = evt.feature;

        let tooltipCoord = evt.coordinate; // @type {module:ol/coordinate~Coordinate|undefined}

        listener = sketch.getGeometry().on('change', (evt) => {
          const geom = evt.target;
          let output;
          if (geom instanceof Polygon) {
            output = formatArea(geom);
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
          } else if (geom instanceof LineString) {
            output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
          }
          measureTooltipElement.innerHTML = output;
          measureTooltip.setPosition(tooltipCoord);
        });
      }, this);

    draw.once('drawend',
      () => {
        measureTooltipElement.className = 'tooltip tooltip-static';
        measureTooltip.setOffset([0, -7]);

        // unset sketch
        sketch = null;
        // unset tooltip so that a new one can be created
        measureTooltipElement = null;
        createMeasureTooltip();
      }, this);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Creates a new help tooltip
  function createHelpTooltip() {
    if (helpTooltipElement && helpTooltipElement.parentNode) {
      helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'tooltip hidden';
    helpTooltip = new Overlay({
      element: helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left',
    });
    App4Sea.OpenLayers.Map.addOverlay(helpTooltip);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Creates a new measure tooltip
  function createMeasureTooltip() {
    if (measureTooltipElement && measureTooltipElement.parentNode) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'tooltip tooltip-measure';
    measureTooltip = new Overlay({
      element: measureTooltipElement,
      offset: [0, -30],
      positioning: 'bottom-center',
    });
    App4Sea.OpenLayers.Map.addOverlay(measureTooltip);
  }

  // //////////////////////////////////////////////////////////////////////////
  function removeAllMeasureToolTips(className) {
    const all = document.getElementsByClassName(className);
    if (all) {
      while (all.length) {
        if (all[0] && all[0].parentNode) {
          all[0].parentNode.removeChild(all[0]);
        }
      }
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // DoLength Creates a new measure tooltip
  my.DoLength = function () {
    DeinitMeasure();
    InitMeasure('LineString');
    const btnArea = document.getElementById('btnArea');
    const btnLength = document.getElementById('btnLength');
    btnArea.style.borderStyle = 'none';
    btnLength.style.borderStyle = 'inset';
  };

  // //////////////////////////////////////////////////////////////////////////
  // DoArea Creates a new measure tooltip
  my.DoArea = function () {
    DeinitMeasure();
    InitMeasure('Polygon');
    const btnArea = document.getElementById('btnArea');
    const btnLength = document.getElementById('btnLength');
    btnArea.style.borderStyle = 'inset';
    btnLength.style.borderStyle = 'none';
  };

  // //////////////////////////////////////////////////////////////////////////
  // DoClearAll
  my.DoClearAll = function () {
    DeinitMeasure();

    if (helpTooltipElement && helpTooltipElement.parentNode) {
      helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }
    if (measureTooltipElement && measureTooltipElement.parentNode) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }

    tempLayers.forEach((element) => {
      App4Sea.OpenLayers.Map.removeLayer(element);
    });
    tempLayers = [];

    removeAllMeasureToolTips('tooltip tooltip-measure');
    removeAllMeasureToolTips('tooltip tooltip-static');

    DeinitVector();

    const btnArea = document.getElementById('btnArea');
    const btnLength = document.getElementById('btnLength');
    btnArea.style.borderStyle = 'none';
    btnLength.style.borderStyle = 'none';
  };

  // //////////////////////////////////////////////////////////////////////////
  // DoAcceptDragAndDrop
  my.DoAcceptDragAndDrop = function () {
    dragAndDropInteraction = new interaction.DragAndDrop({
      formatConstructors: [
        GPX,
        GeoJSON,
        IGC,
        KML,
        TopoJSON,
      ],
    });

    dragAndDropInteraction.on('addfeatures', (event) => {
      const vectorSource = new Vector({
        features: event.features,
      });

      const vect = new VectorLayer({ source: vectorSource });

      tempLayers.push(vect);
      App4Sea.OpenLayers.Map.addLayer(vect);

      App4Sea.Utils.LookAt(vectorSource);
    });

    // let interaction = ol.interaction.defaults ().extend([dragAndDropInteraction])
    App4Sea.OpenLayers.Map.addInteraction(dragAndDropInteraction);
  };

  // //////////////////////////////////////////////////////////////////////////
  // DoSaveAll
  my.DoSaveAll = function () {
    if (!source) return;

    const features = source.getFeatures();

    const name = `App4Sea_${Date.now().toString()}.kml`;

    const kmlText = App4Sea.Utils.GetKMLFromFeatures(features, name);

    App4Sea.Utils.DoSaveKML(kmlText, name);
  };

  // //////////////////////////////////////////////////////////////////////////
  // DoNothing Disables measurements and closes measurement toolbox
  my.DoNothing = function (id) {
    my.DoClearAll();

    App4Sea.Utils.w3_close(id);
  };

  // //////////////////////////////////////////////////////////////////////////
  let DeinitVector = function () {
    App4Sea.OpenLayers.Map.removeLayer(vector);
    vector = null;
    source = null;
  };

  // //////////////////////////////////////////////////////////////////////////
  const InitVector = function () {
    App4Sea.OpenLayers.Map.removeLayer(vector);

    source = new Vector();
    vector = new VectorLayer({
      source,
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 55, 55, 0.2)',
        }),
        stroke: new Stroke({
          color: '#ffcc33',
          width: 2,
        }),
        image: new Circle({
          radius: 7,
          fill: new Fill({
            color: '#ffcc33',
          }),
        }),
      }),
    });

    App4Sea.OpenLayers.Map.addLayer(vector);
  };

  // //////////////////////////////////////////////////////////////////////////
  // Creates a new measure tooltip
  let InitMeasure = function (typ) {
    if (!vector) InitVector();

    addInteraction(typ);

    App4Sea.OpenLayers.Map.on('pointermove', pointerMoveHandler);

    App4Sea.OpenLayers.Map.getViewport().addEventListener('mouseout', () => {
      helpTooltipElement.classList.add('hidden');
    }, false, { passive: true });
  };

  // //////////////////////////////////////////////////////////////////////////
  //
  let DeinitMeasure = function () {
    type = 'NotActive';
    App4Sea.OpenLayers.Map.removeInteraction(draw);
  };

  // //////////////////////////////////////////////////////////////////////////
  // GetType
  my.GetType = function () {
    return type;
  };

  // //////////////////////////////////////////////////////////////////////////
  my.DropMarker = function () {
    const marker = new Feature({
      geometry: new Point(
        proj.fromLonLat([0, 50]),
      ),
    });

    const vectorSource = new Vector({
      features: [marker],
    });

    const markerVectorLayer = new VectorLayer({
      source: vectorSource,
    });

    App4Sea.OpenLayers.Map.addLayer(markerVectorLayer);
  };

  /** ************************************************************************* */

  return my;
}());
App4Sea.Measure = App4SeaMeasure;
