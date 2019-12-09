/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 * Adaptedrom https://openlayers.org/en/latest/examples/measure.html
 * 
 * ==========================================================================*/
 
import { App4Sea } from './App4Sea.js';

 
let App4SeaMeasure = (function () {
    "use strict";
    let my = {};
    let tempLayers = []; // array to hold droped layers as they are created   

    ////////////////////////////////////////////////////////////////////////////
    let draw; // global so we can remove it later
    let source;
    let vector;
    let sketch; //Currently drawn feature. @type {module:ol/Feature~Feature}
    let helpTooltipElement; // The help tooltip element. @type {Element}
    let helpTooltip; // Overlay to show the help messages. @type {module:ol/Overlay}
    let measureTooltipElement; // The measure tooltip element. @type {Element}
    let measureTooltip; // Overlay to show the measurement. @type {module:ol/Overlay}
    const continuePolygonMsg = 'Click to continue drawing\nthe polygon to measure area'; // Message to show when the user is drawing a polygon. @type {string}
    const continueLineMsg = 'Click to continue drawing\nthe line to measure length'; // Message to show when the user is drawing a line. @type {string}
    let type = 'NotActive';// 'Polygon' 'LineString' or 'NotActive'
    let dragAndDropInteraction;

    ////////////////////////////////////////////////////////////////////////////
    // pointerMoveHandler
    // @param {module:ol/MapBrowserEvent~MapBrowserEvent} evt The event.
    let pointerMoveHandler = function(evt) {
        if (type === 'NotActive' || evt.dragging) {
            return;
        }

        let helpMsg = 'Click to start measuring'; //@type {string}

        if (sketch) {
            let geom = (sketch.getGeometry());
            if (geom instanceof ol.geom.Polygon) {
                helpMsg = continuePolygonMsg;
            } 
            else if (geom instanceof ol.geom.LineString) {
                helpMsg = continueLineMsg;
            }
        }

        helpTooltipElement.innerHTML = helpMsg;
        helpTooltip.setPosition(evt.coordinate);

        helpTooltipElement.classList.remove('hidden');
    };

    ////////////////////////////////////////////////////////////////////////////
    // Format length output.
    // @param {module:ol/geom/LineString~LineString} line The line.
    // @return {string} The formatted length.
    let formatLength = function(line) {
        let length = ol.sphere.getLength(line);
        let output;
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
        } 
        else {
            output = (Math.round(length * 100) / 100) + ' ' + 'm';
        }

        return output;
    };

    ////////////////////////////////////////////////////////////////////////////
    // Format area output.
    // @param {module:ol/geom/Polygon~Polygon} polygon The polygon.
    // @return {string} Formatted area.
    let formatArea = function(polygon) {
        let area = ol.sphere.getArea(polygon);
        let output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) + ' ' + 'km<sup>2</sup>';
        } 
        else {
            output = (Math.round(area * 100) / 100) + ' ' + 'm<sup>2</sup>';
        }

        return output;
    };

    ////////////////////////////////////////////////////////////////////////////
    function addInteraction(typ) {
        type = typ;
        draw = new ol.interaction.Draw({
            source: source,
            type: type,
            style: new ol.style.Style({
                fill: new ol.style.Fill({color: 'rgba(255, 55, 55, 0.2)'}),
                stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2}),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.7)'}),
                    fill: new ol.style.Fill({color: 'rgba(255, 55, 55, 0.2)'})
                })
            })
        });
        App4Sea.OpenLayers.Map.addInteraction(draw);

        createMeasureTooltip();
        createHelpTooltip();

        let listener;
        draw.on('drawstart',
            function(evt) {
                // set sketch
                sketch = evt.feature;

                let tooltipCoord = evt.coordinate; //@type {module:ol/coordinate~Coordinate|undefined}

                listener = sketch.getGeometry().on('change', function(evt) {
                    let geom = evt.target;
                    let output;
                    if (geom instanceof ol.geom.Polygon) {
                        output = formatArea(geom);
                        tooltipCoord = geom.getInteriorPoint().getCoordinates();
                    } 
                    else if (geom instanceof ol.geom.LineString) {
                        output = formatLength(geom);
                        tooltipCoord = geom.getLastCoordinate();
                    }
                    measureTooltipElement.innerHTML = output;
                    measureTooltip.setPosition(tooltipCoord);
                });
            }, this
        );

        draw.on('drawend',
            function() {
                measureTooltipElement.className = 'tooltip tooltip-static';
                measureTooltip.setOffset([0, -7]);

                // unset sketch
                sketch = null;
                // unset tooltip so that a new one can be created
                measureTooltipElement = null;
                createMeasureTooltip();
                ol.Observable.unByKey(listener);
            }, this
        );
    };

    ////////////////////////////////////////////////////////////////////////////
    // Creates a new help tooltip
    function createHelpTooltip() {
        if (helpTooltipElement && helpTooltipElement.parentNode) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        helpTooltipElement = document.createElement('div');
        helpTooltipElement.className = 'tooltip hidden';
        helpTooltip = new ol.Overlay({
            element: helpTooltipElement,
            offset: [15, 0],
            positioning: 'center-left'
        });
        App4Sea.OpenLayers.Map.addOverlay(helpTooltip);
    };

    ////////////////////////////////////////////////////////////////////////////
    // Creates a new measure tooltip
    function createMeasureTooltip() {
        if (measureTooltipElement && measureTooltipElement.parentNode) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }
        measureTooltipElement = document.createElement('div');
        measureTooltipElement.className = 'tooltip tooltip-measure';
        measureTooltip = new ol.Overlay({
            element: measureTooltipElement,
            offset: [0, -30],
            positioning: 'bottom-center'
        });
        App4Sea.OpenLayers.Map.addOverlay(measureTooltip);
    };

    ////////////////////////////////////////////////////////////////////////////
    function removeAllMeasureToolTips (className) {
        let all = document.getElementsByClassName(className);
        if (all) {
            while (all.length) {
                if (all[0] && all[0].parentNode) {
                    all[0].parentNode.removeChild(all[0]);
                }
            };
        };
    }

    ////////////////////////////////////////////////////////////////////////////
    // DoLength Creates a new measure tooltip
    my.DoLength = function() {
        DeinitMeasure();
        InitMeasure('LineString');
        const btnArea = document.getElementById('btnArea');
        const btnLength = document.getElementById('btnLength');
        btnArea.style.borderStyle = 'none';
        btnLength.style.borderStyle = 'inset';
    };

    ////////////////////////////////////////////////////////////////////////////
    // DoArea Creates a new measure tooltip
    my.DoArea = function() {
        DeinitMeasure();
        InitMeasure('Polygon');
        const btnArea = document.getElementById('btnArea');
        const btnLength = document.getElementById('btnLength');
        btnArea.style.borderStyle = 'inset';
        btnLength.style.borderStyle = 'none';
    };

    ////////////////////////////////////////////////////////////////////////////
    // DoClearAll
    my.DoClearAll = function() {
        DeinitMeasure();

        if (helpTooltipElement && helpTooltipElement.parentNode) {
            helpTooltipElement.parentNode.removeChild(helpTooltipElement);
        }
        if (measureTooltipElement && measureTooltipElement.parentNode) {
            measureTooltipElement.parentNode.removeChild(measureTooltipElement);
        }

        tempLayers.forEach(element => {
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

    ////////////////////////////////////////////////////////////////////////////
    // DoAcceptDragAndDrop
    my.DoAcceptDragAndDrop = function() {
        dragAndDropInteraction = new ol.interaction.DragAndDrop({
            formatConstructors: [
                ol.format.GPX,
                ol.format.GeoJSON,
                ol.format.IGC,
                ol.format.KML,
                ol.format.TopoJSON
            ]
        });

        dragAndDropInteraction.on('addfeatures', function(event) {
            let vectorSource = new ol.source.Vector({
                features: event.features
            });

            let vect = new ol.layer.Vector({source: vectorSource});

            tempLayers.push(vect);
            App4Sea.OpenLayers.Map.addLayer(vect);

            App4Sea.Utils.LookAt(vectorSource);
        });        

        //let interaction = ol.interaction.defaults ().extend([dragAndDropInteraction])
        App4Sea.OpenLayers.Map.addInteraction(dragAndDropInteraction);
  
    };

    ////////////////////////////////////////////////////////////////////////////
    // DoSaveAll
    my.DoSaveAll = function() {
        if (!source)
            return;

        let features = source.getFeatures();

        let name = "App4Sea_" + Date.now().toString() + ".kml";

        let kmlText = App4Sea.Utils.GetKMLFromFeatures(features, name);

        App4Sea.Utils.DoSaveKML(kmlText, name);
    };

    ////////////////////////////////////////////////////////////////////////////
    // DoNothing Disables measurements and closes measurement toolbox
    my.DoNothing = function(id) {
        my.DoClearAll();

        App4Sea.Utils.w3_close(id);
    };

    ////////////////////////////////////////////////////////////////////////////
    let DeinitVector = function() {
        App4Sea.OpenLayers.Map.removeLayer(vector);
        vector = null;
        source = null;
    }
    
    ////////////////////////////////////////////////////////////////////////////
    let InitVector = function() {
        App4Sea.OpenLayers.Map.removeLayer(vector);

        source = new ol.source.Vector();
        vector = new ol.layer.Vector({
            source: source,
            style: new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 55, 55, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: '#ffcc33'
                    })
                })
            })
        });

        App4Sea.OpenLayers.Map.addLayer(vector);
    };

    ////////////////////////////////////////////////////////////////////////////
    // Creates a new measure tooltip
    let InitMeasure = function(typ) {
        if (!vector)
            InitVector();

        addInteraction(typ);

        App4Sea.OpenLayers.Map.on('pointermove', pointerMoveHandler);
    
        App4Sea.OpenLayers.Map.getViewport().addEventListener('mouseout', function() {
            helpTooltipElement.classList.add('hidden');
        }, false, {passive: true});
    };

    ////////////////////////////////////////////////////////////////////////////
    //
    let DeinitMeasure = function() {
        type = 'NotActive';
        App4Sea.OpenLayers.Map.removeInteraction(draw);
    };

    ////////////////////////////////////////////////////////////////////////////
    // GetType
    my.GetType = function () {
        return type;
    };

    ////////////////////////////////////////////////////////////////////////////
    my.DropMarker = function () {
        let marker = new ol.Feature({
            geometry: new ol.geom.Point(
                ol.proj.fromLonLat([0,50])
            ),
        });

        let vectorSource = new ol.source.Vector({
            features: [marker]
        });

        let markerVectorLayer = new ol.layer.Vector({
            source: vectorSource,
        });

        App4Sea.OpenLayers.Map.addLayer(markerVectorLayer);    
    }
    
    /****************************************************************************/
    
    return my;
    
}());
App4Sea.Measure = App4SeaMeasure;
