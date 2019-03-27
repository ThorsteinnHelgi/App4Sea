/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

ol = ol || {};
App4Sea = App4Sea || {};
App4Sea.Map = (App4Sea.Map) ? App4Sea.Map : {};
App4Sea.Map.OpenLayers = (App4Sea.Map.OpenLayers) ? App4Sea.Map.OpenLayers : {};

App4Sea.TreeMenu = (function () {
    "use strict";
    var my = {};
    const _play_ = '\u25b6';
    
    //////////////////////////////////////////////////////////////////////////
    // setUp menu tree
    // https://www.jstree.com
    // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
    // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
    my.setUp = function () {

        // First we load the tree based on a json file that we fetch using ajax (core)
        $('#TreeMenu').jstree({
            'checkbox': {
                'keep_selected_style': false
                ,'real_checkboxes': true
                //,'tie_selection' : false // for checking without selecting and selecting without checking}
             },
            'plugins' : ['dnd', 'checkbox', 'context'],
            'core': {
                'check_callback': function (operation, node, parent, position, more) {
//                    if(operation === "copy_node" || operation === "move_node") {
//                        if(parent.id === "#") {
//                            return false; // prevent moving a child above or below the root
//                        }
//                    };
                    
                    if (operation === 'create_node')
                        return true;
                    else
                        return true;
                },
                'themes': {
                    'dots': false,
                    'icons': false
                },
                'error': function (e) {
                    console.log('Error: ' + e.error);
                    console.log('Id: ' + e.id);
                    console.log('Plugin: ' + e.plugin);
                    console.log('Reason: ' + e.reason);
                    console.log('Data: ' + e.data);
                },
                'data': {
                    'dataType': 'json',
                    'contentType': 'application/json; charset=utf-8',
                    'cache':false,
                    url: function (node) {
                        var theUrl = node.id === '#' ?
                                'json/a4s.json' :
                                'json/' + node.id + '.json';
                        //console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    data: function (node) {
                        var nodeObj = {"id": node.id, "text": "", "path": "", "draggable": "", "ondragstart": "" };
                        if (node.id !== '#')
                        {
                            nodeObj.text = node.text;
                            nodeObj.path = node.a_attr.path;
                        }
                        
                        console.log("Node.id: " + node.id + ", text: " + nodeObj.text + ", path: " + nodeObj.path);
                        return nodeObj;
                    }
                }
            }
//            'types' : {
//                "#" : {
//                    "max_children" : 20,
//                    "max_depth" : 5,
//                    "val111id_children" : ["root"]
//                },
//                "root" : {
//                    "icon" : "/data/puffin.ico",
//                    "valid_children" : ["default"]
//                },
//                "default" : {
//                    "valid_children" : ["default","file"]
//                },
//                "file" : {
//                    "icon" : "glyphicon glyphicon-file",
//                    "valid_children" : []
//                }
//            },
        });

        // Catch event: changed
        $('#TreeMenu').on("changed.jstree", function (e, data) {

            //console.log("On Action: " + data.action + " on node " + data.node.id);

            if (typeof data.node === 'undefined')
                return;

            var node = $(this).jstree('get_node', data.node.id);

            // Remove overlay
            hideMetadata();

            // We add nodes based on the nodes selected, not the node(S) that come in data

            // Remove layer if not in the list of selected nodes
            for (var lind = 0; lind < App4Sea.Map.OpenLayers.layers.length; lind++)
            {
                // Check if layer is active
                var activeLayers = App4Sea.Map.OpenLayers.Map.getLayers();
                var ol_uid = App4Sea.Map.OpenLayers.layers[lind].vector.ol_uid;
                var activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);

                var isSel = false;
                for (var sind = 0; sind < data.selected.length; sind++) {
                    if (data.selected[sind] === App4Sea.Map.OpenLayers.layers[lind].id) {
                        isSel = true;
                        break;
                    }
                }
                if (!isSel && activeIndex !== -1) {
                    App4Sea.Map.OpenLayers.Map.removeLayer(App4Sea.Map.OpenLayers.layers[lind].vector);
                    //console.log("Layer removed: " + App4Sea.Map.OpenLayers.layers[lind].id);
                }
            }

            // Add overlay
            if (node.text === 'Description' || node.text === 'Author'){
                if (node.state.selected) {
                    showMetadata(node.text, node.id, node.data);
                }
            }

            // Add layer
            for (var ind = 0; ind < data.selected.length; ind++) {
                var nod = $(this).jstree('get_node', data.selected[ind]);
                
                //Check if layer exists in cache
                var index = App4Sea.Utils.alreadyLayer(nod.id, App4Sea.Map.OpenLayers.layers);

                if (index !== -1) {// Layer exists in cache
                    
                    // Check if layer is active
                    var activeLayers = App4Sea.Map.OpenLayers.Map.getLayers();
                    var ol_uid = App4Sea.Map.OpenLayers.layers[index].vector.ol_uid;
                    var activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);
                   
                    // Activate if not active
                    if (activeIndex === -1) {// Layer is not active
                        console.log("Layer being activated from cache: " + nod.id + ": " + nod.text);
                        App4Sea.Map.OpenLayers.Map.addLayer(App4Sea.Map.OpenLayers.layers[index].vector);
                    }
                    continue;
                }

                // Go for first addition
                var path = nod.a_attr.path;
                var heat = nod.a_attr.heat;
                
                if (!path || path === "") {
                    //console.log("Error: not path for " + nod.id + ": " + nod.text);
                    continue;
                }

                console.log("Layer being added: " + nod.id + ": " + nod.text);

                if (heat && heat === true) {
                    if (index === -1) {
                        var vect = App4Sea.Utils.heatMap(path, nod.id, nod.text);
                        App4Sea.Map.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
                        console.log("Cached layers now are " + App4Sea.Map.OpenLayers.layers.length);

                        App4Sea.Map.OpenLayers.Map.addLayer(vect);
                    }
                }
                else if (path.length > 3) {
                    var ext = path.substr(path.length - 3, 3);
                    if (ext === '1cd') { //6a3e86f0825c7e6e605105c24d5ec1cd
                        if (index === -1) {
                            var vect = App4Sea.Weather.loadWeather(path, nod.id);
                            App4Sea.Map.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
                            console.log("Cached layers now are " + App4Sea.Map.OpenLayers.layers.length);

                            App4Sea.Map.OpenLayers.Map.addLayer(vect);
                        }
                    }
                    else if (ext === '6e4') { //1326faa296b7e865683b67cdf8e5c6e4
                        if (index === -1) {
                            var vect = App4Sea.Weather.loadCityWeather(path, nod.id);
//                            App4Sea.Map.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
//                            console.log("Cached layers now are " + App4Sea.Map.OpenLayers.layers.length);

//                            App4Sea.Map.OpenLayers.Map.addLayer(vect);
                        }
                    }
                    else if (ext === "gif" || ext === "cgi" || ext === "wms" || ext === "png" || ext === "jpg") {
                        if (index === -1) {
                            var vect = App4Sea.Utils.loadImage(true, path, nod.id, nod.text, nod.a_attr.layers,
                                nod.a_attr.width, nod.a_attr.height, nod.a_attr.start);
                            App4Sea.Map.OpenLayers.layers.push({"id": nod.id, "vector" : vect});
                            console.log("Cached layers now are " + App4Sea.Map.OpenLayers.layers.length);

                            App4Sea.Map.OpenLayers.Map.addLayer(vect);
                        }
                    }
                    else {// Including kmz and kml
                        if (index === -1){
                            App4Sea.KML.loadKmlKmz(path, nod.id, nod.text);
                        }
                    }
                }
            }
        });
    };
    
    my.Checkbox = function(layerid, on) {
        if (on) {
            //$('#TreeMenu').jstree(true).check_node(id);
            $.jstree.reference('#TreeMenu').check_node(layerid);
/*
            var activeLayers = App4Sea.Map.OpenLayers.Map.getLayers();
            var ol_uid = App4Sea.Map.OpenLayers.layers[lind].vector.ol_uid;
            var activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);

            // Make active
            if (activeIndex === -1)
                App4Sea.Map.OpenLayers.Map.addLayer(App4Sea.Map.OpenLayers.layers[lind].vector);
  */      }
        else {
            $.jstree.reference('#TreeMenu').uncheck_node(layerid);
            
    //        App4Sea.Map.OpenLayers.Map.removeLayer(App4Sea.Map.OpenLayers.layers[lind].vector);
        }
    };

    ////////////////////////////////////////////////////////////////////////////
    // showMetadata
    function showMetadata(title, id, data) {

        var elem = App4Sea.Map.OpenLayers.descriptionContainer;
                //document.getElementById('legend');
        elem.innerHTML = data;
        
        var pos = ol.proj.fromLonLat([0, 55]);
        var overlay = new ol.Overlay({
          position: pos,
          positioning: 'center-center',
          element: elem,
          stopEvent: false
        });
        
        App4Sea.Map.OpenLayers.Map.addOverlay(overlay);
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // hideMetadata
    function hideMetadata() {
        var elem = App4Sea.Map.OpenLayers.descriptionContainer;
                //document.getElementById('legend');
        elem.innerHTML = "";
    }
        
    return my;
    
}(App4Sea.TreeMenu || {}));