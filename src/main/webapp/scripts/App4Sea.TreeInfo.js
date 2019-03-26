/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ==========================================================================*/

App4Sea = App4Sea || {};

App4Sea.TreeInfo = (function () {
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
                    console.log('Error: ' + e.error);
                    console.log('Id: ' + e.id);
                    console.log('Plugin: ' + e.plugin);
                    console.log('Reason: ' + e.reason);
                    console.log('Data: ' + e.data);
                },
                'data': {
                    url: function (node) {
                        var theUrl = node.id === '#' ?
                                'json/info.json' :
                                'json/' + node.id + '.json';
                        console.log("theUrl: " + theUrl);
                        return theUrl;
                    },
                    //'type': 'GET',
                    'dataType': 'json',
                    'contentType': 'application/json; charset=utf-8',
                    'cache':false,
                    data: function (node) {
                        console.log("Node.id: " + node.id);
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
            console.log("On: " + data.selected);

            if (typeof data.node !== 'undefined')
                if (data.node.a_attr.path !== '')
                    window.open(data.node.a_attr.path);
        });

    };

    return my;
    
}(App4Sea.TreeInfo || {}));
