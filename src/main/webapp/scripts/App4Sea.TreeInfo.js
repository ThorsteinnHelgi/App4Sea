/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ========================================================================== */

import App4Sea from './App4Sea';


const App4SeaTreeInfo = (function a() {
  const my = {};
  let ajaxCount = 0;
  const JSONdata = [];

  // //////////////////////////////////////////////////////////////////////////
  // SetUp info tree
  // https://www.jstree.com
  // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
  // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
  my.SetUp = function () {
    function getFileName(node) {
      let jsonURL;

      if (node.id === '#') {
        jsonURL = 'json/info.json';
      } else {
        jsonURL = `json/${node.id}.json`;
      }

      return jsonURL;
    }

    function setTree(treeData) {
      $('#TreeInfo').jstree({
        core: {
          check_callback: false,
          themes: {
            dots: false,
            icons: false,
          },
          error(e) {
            if (App4Sea.logging) console.log(`Error: ${e.error}`);
            if (App4Sea.logging) console.log(`Id: ${e.id}`);
            if (App4Sea.logging) console.log(`Plugin: ${e.plugin}`);
            if (App4Sea.logging) console.log(`Reason: ${e.reason}`);
            if (App4Sea.logging) console.log(`Data: ${e.data}`);
          },
          data: treeData,
        },
        plugins: [],
      });
    }

    function getData(node, setTree, getFileName, JSONdata) {
      function onSuccess(parent_node, fnSetTree, fnGetFileName, ourJSONdata) {
        // @ts-ignore
        // @ts-ignore
        return function (data, status, jqXHR) {
          for (let i_success = 0; i_success < data.length; i_success++) {
            const thisNode = data[i_success];
            const { children } = thisNode;
            thisNode.children = false;// Must be set to false as wwe are loading acync (sic!)
            ourJSONdata.push(thisNode);

            if (children) getData(thisNode, fnSetTree, fnGetFileName, ourJSONdata); // Do this recursively

            // if (App4Sea.logging) console.log(parent_node.id + ': ' + thisNode.id + ", text: " + thisNode.text + ", path: " + thisNode.a_attr.path);
          }

          ajaxCount--;
          if (ajaxCount === 0) {
            // if (App4Sea.logging) console.log("WE ARE DONE! ");

            fnSetTree(ourJSONdata);
          }
        };
      }

      function onError(parent_node, fnSetTree, ourJSONdata) {
        return function (jqXHR, status, errorThrown) {
          if (App4Sea.logging) console.log(jqXHR);
          if (App4Sea.logging) console.log(status);
          if (App4Sea.logging) console.log(errorThrown);
          if (App4Sea.logging) console.log(parent_node);

          ajaxCount--;
          if (ajaxCount === 0) {
            if (App4Sea.logging) console.log(`WE ARE DONE WITH ERROR! ${fnSetTree}`);

            fnSetTree(ourJSONdata);
          }
        };
      }

      const jsonURL = getFileName(node);

      ajaxCount++;
      jQuery.ajax({
        url: jsonURL,
        contentType: 'application/json; charset=utf-8',
        type: 'GET',
        dataType: 'JSON',
        cache: false,
        async: true,
        success: onSuccess(node, setTree, getFileName, JSONdata),
        error: onError(node, setTree, JSONdata),
      });
    }

    getData({ id: '#' }, setTree, getFileName, JSONdata);

    // @ts-ignore
    $('#TreeInfo').on('changed.jstree', (e, data) => {
      if (App4Sea.logging) console.log(`On: ${data.selected}`);

      if (typeof data.node !== 'undefined') if (data.node.a_attr.path !== '') window.open(data.node.a_attr.path);
    });
  };

  return my;
}());
App4Sea.TreeInfo = App4SeaTreeInfo;
