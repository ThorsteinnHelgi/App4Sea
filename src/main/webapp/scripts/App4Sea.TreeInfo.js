/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

var App4Sea = App4Sea || {};
var App4SeaTreeInfo = (function () {
    "use strict";
    
    var my = {};

    ////////////////////////////////////////////////////////////////////////////
    // Set up setUp
    // https://www.jstree.com
    // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
    // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
    my.setUp = function () {

        // First we load the tree based on a json file that we fetch using ajax (core)
        $('#TreeInfo').jstree({
            'core': {
                'check_callback': false,
                //'themes' : { 'stripes' : false },
                'themes': {
                    'dots': false,
                    'icons': false
                },
                'error': function (e) {
                    if (App4Sea.logging) console.log('Error: ' + e.error);
                    if (App4Sea.logging) console.log('Id: ' + e.id);
                    if (App4Sea.logging) console.log('Plugin: ' + e.plugin);
                    if (App4Sea.logging) console.log('Reason: ' + e.reason);
                    if (App4Sea.logging) console.log('Data: ' + e.data);
                },
                'data': {
                    url: function (node) {
                        var theUrl = node.id === '#' ?
                                'json/info.json' :
                                'json/' + node.id + '.json';
                                if (App4Sea.logging) console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    //'type': 'GET',
                    'dataType': 'json',
                    'contentType': 'application/json; charset=utf-8',
                    'cache':false,
                    data: function (node) {
                        if (App4Sea.logging) console.log("Node.id: " + node.id);
                        return {'id': node.id}; //, 'parent' : node.parent };//, 'text' : node.text, 'a_attr.path' : node.a_attr.path }; 
                    }
                }
            },
//            'types' : {
//                "#" : {
//                    "max_children" : 20,
//                    "max_depth" : 20,
//                    "valid_children" : ["root"]
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
            'plugins': []
        }
        );

        // 
        $('#TreeInfo').on("changed.jstree", function (e, data) {
            if (App4Sea.logging) console.log("On: " + data.selected);

            if (typeof data.node !== 'undefined')
                if (data.node.a_attr.path !== '')
                    window.open(data.node.a_attr.path);
        });

    };

    return my;
    
}(App4SeaTreeInfo || {}));
