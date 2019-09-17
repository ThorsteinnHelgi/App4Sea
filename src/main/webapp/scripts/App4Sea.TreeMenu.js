/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

var App4Sea = App4Sea || {};
var App4SeaTreeMenu = (function () {
    "use strict";

    let my = {};
    let ajaxCount = 0;
    let JSONdata = [];
    
    //////////////////////////////////////////////////////////////////////////
    // SetUp menu tree
    // https://www.jstree.com
    // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
    // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
    my.SetUp = function () {
        
        function getFileName(node, file) {
            let jsonURL;

            if (node.id === '#') {
                jsonURL = 'json/' + file;
            }
            else {
                jsonURL = 'json/' + node.id + '.json';
            }

            return jsonURL;  
        };

        function setTree(treeData) {
            $('#TreeMenu').jstree({
                'checkbox': {
                    'keep_selected_style': false
                    ,'real_checkboxes': true
                 },
                'plugins' : ['checkbox', 'context'],
                'core': {
                    'check_callback': function (operation, node, parent, position, more) {
                        if (operation === 'create_node')
                            return true;
                        else
                            return false; // Do not allow drag and drop
                    },
                    'themes': {
                        'dots': false,
                        'icons': App4Sea.useIconsInMenu
                    },
                    'error': function (e) {
                        if (App4Sea.logging) console.log('Error: ' + e.error);
                        if (App4Sea.logging) console.log('Id: ' + e.id);
                        if (App4Sea.logging) console.log('Plugin: ' + e.plugin);
                        if (App4Sea.logging) console.log('Reason: ' + e.reason);
                        if (App4Sea.logging) console.log('Data: ' + e.data);
                    },
                    'data': treeData
                }
            });
        };        
        
        function getData(node, setTree, getFileName, filename, JSONdata) {
                
            function onSuccess(parent_node, fnSetTree, fnGetFileName, ourFilename, ourJSONdata) {
                return function (data, status, jqXHR) {
                    for (var i_success = 0; i_success < data.length; i_success++){
                        let thisNode = data[i_success]; 
                        let children = thisNode.children;
                        thisNode.children = false;// Must be set to false as wwe are loading acync (sic!)
                        ourJSONdata.push(thisNode);

                        if (children)
                            getData(thisNode, fnSetTree, fnGetFileName, ourFilename, ourJSONdata); // Do this recursively

                            //if (App4Sea.logging) console.log(parent_node.id + ': ' + thisNode.id + ", text: " + thisNode.text + ", path: " + thisNode.a_attr.path);
                    }

                    ajaxCount--;
                    if (ajaxCount === 0) {
                        //if (App4Sea.logging) console.log("WE ARE DONE! ");
                        
                        fnSetTree(ourJSONdata);
                    }
                }
            };
            
            function onError (parent_node, fnSetTree, ourJSONdata) {
                return function (jqXHR, status, errorThrown) {
                    if (App4Sea.logging) console.log(jqXHR);
                    if (App4Sea.logging) console.log(status);
                    if (App4Sea.logging) console.log(errorThrown);
                    if (App4Sea.logging) console.log(parent_node);

                    ajaxCount--;
                    if (ajaxCount === 0) {
                        if (App4Sea.logging) console.log("WE ARE DONE WITH ERROR! " + fnSetTree);
                        
                        fnSetTree(ourJSONdata);
                    }
                }
            };

            let jsonURL = getFileName(node, filename);
            
            ajaxCount++;
            jQuery.ajax({
                'url': jsonURL,
                'contentType': 'application/json; charset=utf-8',
                'type': 'GET',
                'dataType': 'JSON',
                'cache':false,
                'async': true,
                success: onSuccess(node, setTree, getFileName, filename, JSONdata),
                error: onError(node, setTree, JSONdata)
            });
        };

        getData({id : "#"}, setTree, getFileName, 'a4s.json', JSONdata);

        // Catch event: changed
        $('#TreeMenu').on("changed.jstree", function (e, data) {

            //if (App4Sea.logging) console.log("On Action: " + data.action + " on node " + data.node.id);

            if (typeof data.node === 'undefined')
                return;

            var node = $(this).jstree('get_node', data.node.id);

            // Remove overlay
            hideMetadata();

            // We add nodes based on the nodes selected, not the node(S) that come in data

            // Remove layer if not in the list of selected nodes
            for (var lind = 0; lind < App4Sea.OpenLayers.layers.length; lind++)
            {
                // Check if layer is active
                var activeLayers = App4Sea.OpenLayers.Map.getLayers();
                var ol_uid = App4Sea.OpenLayers.layers[lind].vector.ol_uid;
                var activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);

                var isSel = false;
                for (var sind = 0; sind < data.selected.length; sind++) {
                    if (data.selected[sind] === App4Sea.OpenLayers.layers[lind].id) {
                        isSel = true;
                        break;
                    }
                }
                if (!isSel && activeIndex !== -1) {
                    App4Sea.OpenLayers.Map.removeLayer(App4Sea.OpenLayers.layers[lind].vector);
                    //if (App4Sea.logging) console.log("Layer removed: " + App4Sea.OpenLayers.layers[lind].id);
                }
            }

            // Add InfoPopUp
            if (node.text === 'Description' || node.text === 'Author'){
                if (node.state.selected) {
                    showMetadata(node.text, node.id, node.data);
                }
            }
            else if (node.text === 'Legend'){
                // if (node.state.selected) {
                //     showMetadata(node.text, node.id, node.data);
                // }
            }

            // Add layer
            for (var ind = 0; ind < data.selected.length; ind++) {
                var nod = $(this).jstree('get_node', data.selected[ind]);
                
                //Check if layer exists in cache
                var index = App4Sea.Utils.alreadyLayer(nod.id, App4Sea.OpenLayers.layers);

                if (index !== -1) {// Layer exists in cache
                    
                    // Check if layer is active
                    var activeLayers = App4Sea.OpenLayers.Map.getLayers();
                    var ol_uid = App4Sea.OpenLayers.layers[index].vector.ol_uid;
                    var activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);
                   
                    // Activate if not active
                    if (activeIndex === -1) {// Layer is not active
                        //if (App4Sea.logging) console.log("Layer being activated from cache: " + nod.id + ": " + nod.text);
                        App4Sea.OpenLayers.Map.addLayer(App4Sea.OpenLayers.layers[index].vector);
                        App4Sea.Utils.LookAt(App4Sea.OpenLayers.layers[index].vector);
                    }
                    continue;
                }

                // Go for first addition
                let path = nod.a_attr.path;
                let tool = nod.a_attr.tool;
                let proj = nod.a_attr.projection;

                if (tool === "animation") {
                    App4Sea.Utils.w3_open('AnimationContainer');
                } else if (tool === "heat") {
                    App4Sea.Utils.w3_open('HeatContainer');
                }
                
                if (!path || path === "") {
                    //if (App4Sea.logging) console.log("Error: not path for " + nod.id + ": " + nod.text);
                    continue;
                }

                //if (App4Sea.logging) console.log("Layer being added: " + nod.id + ": " + nod.text);

                if (tool === "heat") {
                    if (index === -1) {
                        var vect = App4Sea.Utils.heatMap(path, nod.id, nod.text);
                        App4Sea.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
                        if (App4Sea.logging) console.log("Cached layers now are " + App4Sea.OpenLayers.layers.length);

                        App4Sea.OpenLayers.Map.addLayer(vect);
                        App4Sea.Utils.LookAt(vect);
                    }
                }
                else if (path.length > 3) {
                    var ext = path.substr(path.length - 3, 3);
                    if (ext === '1cd') { //6a3e86f0825c7e6e605105c24d5ec1cd
                        if (index === -1) {
                            var vect = App4Sea.Weather.loadWeather(path, nod.id);
                            App4Sea.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
                            if (App4Sea.logging) console.log("Cached layers now are " + App4Sea.OpenLayers.layers.length);

                            App4Sea.OpenLayers.Map.addLayer(vect);
                            App4Sea.Utils.LookAt(vect);
                        }
                    }
                    else if (ext === '6e4') { //1326faa296b7e865683b67cdf8e5c6e4
                        if (index === -1) {
                            var vect = App4Sea.Weather.loadCityWeather(path, nod.id);
//                            App4Sea.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
//                            if (App4Sea.logging) console.log("Cached layers now are " + App4Sea.OpenLayers.layers.length);

//                            App4Sea.OpenLayers.Map.addLayer(vect);
                        }
                    }
                    else if (ext === "wms") {
                        if (index === -1) {
                            let parts = App4Sea.Utils.parseURL(path);
                            let ex = parts.searchObject.bbox.split(',');
                            let extent = [parseFloat(ex[0]), parseFloat(ex[1]), parseFloat(ex[2]), parseFloat(ex[3])];//[-145.15104058007,21.731919794922,-57.154894212888,58.961058642578];
                            let hei = parseFloat(parts.searchObject.height);
                            let wid = parseFloat(parts.searchObject.width);
                            let imageExtent = ol.proj.transformExtent(extent, App4Sea.prefProj, App4Sea.prefViewProj);
                           
                            let vect = App4Sea.Utils.loadImage(nod, imageExtent, true, path, nod.id, nod.text, "",
                                wid, hei, nod.a_attr.start);

                            App4Sea.OpenLayers.layers.push({"id": nod.id, "vector" : vect});

                            if (App4Sea.logging) console.log("Cached layers now are " + App4Sea.OpenLayers.layers.length);

                            App4Sea.OpenLayers.Map.addLayer(vect);
                            App4Sea.Utils.LookAt(vect);
                        }
                    }
                    else if (ext === "gif" || ext === "cgi" || ext === "png" || ext === "jpg") {
                        if (index === -1) {
                            let extent = [-145.15104058007,21.731919794922,-57.154894212888,58.961058642578];//TBD
                            let imageExtent = ol.proj.transformExtent(extent, App4Sea.prefProj, App4Sea.prefViewProj);
                           
                            let vect = App4Sea.Utils.loadImage(nod, imageExtent, true, path, nod.id, nod.text, "",
                            nod.a_attr.width, nod.a_attr.height, nod.a_attr.start);

                            App4Sea.OpenLayers.layers.push({"id": nod.id, "vector" : vect});

                            if (App4Sea.logging) console.log("Cached layers now are " + App4Sea.OpenLayers.layers.length);

                            App4Sea.OpenLayers.Map.addLayer(vect);
                            App4Sea.Utils.LookAt(vect);
                        }
                    }
                    else {// Including kmz and kml
                        if (index === -1){
                            //if (App4Sea.KML.loadKmlKmz === 'undefined')
                                App4Sea.KML = App4SeaKML;
                            App4Sea.KML.loadKmlKmz(path, nod.id, nod.text);
                        }
                    }
                }
            }
        });
    };
   
    //////////////////////////////////////////////////////////////////////////
    // Checkbox to check or uncheck item in tree
    my.Checkbox = function(layerid, on) {
        if (on) {
            $.jstree.reference('#TreeMenu').check_node(layerid);
        }
        else {
            $.jstree.reference('#TreeMenu').uncheck_node(layerid);
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // showMetadata
    function showMetadata(title, id, data) {

        let elem = App4Sea.OpenLayers.descriptionContainer;

        let txt = App4Sea.Utils.NoXML(data);
        elem.innerHTML = txt;
        
        let pos = ol.proj.fromLonLat([0, 55]);//TBD
        let overlay = new ol.Overlay({
          position: pos,
          positioning: 'center-center',
          element: elem,
          stopEvent: false
        });
        
        App4Sea.OpenLayers.Map.addOverlay(overlay);
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // hideMetadata
    function hideMetadata() {
        var elem = App4Sea.OpenLayers.descriptionContainer;
        elem.innerHTML = "";
    }
    
    return my;
    
}(App4SeaTreeMenu || {}));