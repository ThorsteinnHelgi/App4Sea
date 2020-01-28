/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * ========================================================================== */

import $ from 'jquery';
import 'jstree/dist/themes/default/style.css';
import * as olproj from 'ol/proj';
import Overlay from 'ol/Overlay';
import App4Sea from './App4Sea';
import App4SeaUtils from './App4Sea.Utils';

const App4SeaTreeMenu = (function () {
  const my = {};
  let ajaxCount = 0;
  let ajaxCountSI = 0;
  let JSONdata = [];
  let JSONdataSourceInfo = [];
  let sourceInfo = [];

  // //////////////////////////////////////////////////////////////////////////
  // hideMetadata
  function hideMetadata() {
    const elem = App4Sea.OpenLayers.descriptionContainer;
    elem.innerHTML = '';
  }

  // //////////////////////////////////////////////////////////////////////////
  // showMetadata
  function showMetadata(title, id, data) {
    const elem = App4Sea.OpenLayers.descriptionContainer;

    const txt = App4Sea.Utils.NoXML(data);
    elem.innerHTML = txt;

    const pos = olproj.fromLonLat([0, 55]);// TBD
    const overlay = new Overlay({
      position: pos,
      positioning: 'center-center',
      element: elem,
      stopEvent: false,
    });

    App4Sea.OpenLayers.Map.addOverlay(overlay);
  }

  // //////////////////////////////////////////////////////////////////////////
  // addChild to the menu tree (jstree)
  // returns the new id for the node in the tree (format example: j1_4)
  function addChild(text, data, tree, parNode, disabled, icon) {
    let dis = disabled;
    if (!App4Sea.disableSubItems) dis = false;
    const newNode = {
      state: { closed: true, checkbox_disabled: false, disabled: dis },
      icon,
      text,
      data,
      selected: true,
      children: false,
    };
    const retVal = tree.jstree(true).create_node(parNode, newNode, 'last', false, false); // [par, node, pos, callback, is_loaded]
    // if (App4Sea.logging) console.log("Adding " + text + " to tree under " + parNode + " returned " + retVal);
    return retVal;
  }

  // //////////////////////////////////////////////////////////////////////////
  // setSourceInfo
  function setSourceInfo(data) {
    sourceInfo = data;
    console.log(data);
  }

  // //////////////////////////////////////////////////////////////////////////
  // Init all menu items
  function getSourceInfo() {
    function onSuccess(ourFilename, ourJSONdata) {
      return function (data, status, jqXHR) {
        for (let i_success = 0; i_success < data.list.length; i_success++) {
          const thisNode = data.list[i_success];

          ourJSONdata.push(thisNode);

          // if (App4Sea.logging) console.log(parent_node.id + ': ' + thisNode.id + ", text: " + thisNode.text + ", path: " + thisNode.a_attr.path);
        }-

        ajaxCountSI--;
        if (ajaxCountSI === 0) {
          if (App4Sea.logging) console.log("WE ARE DONE GETTING SOURCEINFO!");

          setSourceInfo(ourJSONdata);
        }
      };
    }

    function onError(ourFilename) {
      return function (jqXHR, status, errorThrown) {
        if (App4Sea.logging) console.log(jqXHR);
        if (App4Sea.logging) console.log(status);
        if (App4Sea.logging) console.log(errorThrown);

        ajaxCountSI--;
        if (ajaxCountSI === 0) {
          if (App4Sea.logging) console.log(`WE ARE DONE WITH ERROR WHEN GETTING SOURCEINFO! ${ourFilename}`);
        }
      };
    }

    const filename = 'json/sources.json';
    ajaxCountSI++;
    $.ajax({
      url: filename,
      contentType: 'application/json; charset=utf-8',
      type: 'GET',
      dataType: 'JSON',
      cache: false,
      async: true,
      success: onSuccess(filename, JSONdataSourceInfo),
      error: onError(filename),
    });
  }

  // ////////////////////////////////////////////////////////////////////////
  my.si_close = function (id) {
    const container = document.getElementById('SourceInfoContainer');
    const handle = document.getElementById('siDragHandle');
    
    container.style.visibility = 'hidden';
    handle.style.visibility = 'hidden';
  }

  // ////////////////////////////////////////////////////////////////////////
  function showSourceInfo(title, si) {
    const head = document.getElementById('siHeader');
    const par = document.getElementById('SourceInfo');
    par.innerHTML = '';

    const el = document.createElement('div');

    if (title && title !== '') head.innerHTML = `${title}`;
    else head.innerHTML = `About this data`;

    if (si.title && si.title !== '') {
      const title2 = document.createElement('div');
      title2.classList.add('title');
      title2.innerHTML = `<b>General title: ${si.title}</b>`;
      el.appendChild(title2);
    }

    if (si.subtitle && si.subtitle !== '') {
      const subtitle = document.createElement('div');
      subtitle.classList.add('subtitle');
      subtitle.innerHTML = `<b>Subtitle: </b>${si.subtitle}`;
      el.appendChild(subtitle);
    }

    if (si.authors && si.authors !== '') {
      const authors = document.createElement('div');
      authors.classList.add('authors');
      authors.innerHTML = `<b>Author(s): </b>${si.authors}`;
      el.appendChild(authors);
    }

    if (si.source && si.source !== '') {
      const datasource = document.createElement('div');
      datasource.classList.add('datasource');
      datasource.innerHTML = `<b>Data source: </b>${si.source}`;
      el.appendChild(datasource);
    }

    if (si.about && si.about !== '') {
      const about = document.createElement('div');
      about.classList.add('about');
      about.innerHTML = `<b>About: </b>${si.about}`;
      el.appendChild(about);
    }

    if (si.link && si.link !== '') {
      const link = document.createElement('div');
      link.classList.add('link');
      link.innerHTML = `<b>Link: </b>${si.link}\n`;
      el.appendChild(link);
    }

    if (si.usage && si.usage !== '') {
      const usage = document.createElement('div');
      usage.classList.add('usage');
      usage.innerHTML = `<b>Usage: </b>${si.usage}`;
      el.appendChild(usage);
    }

    if (si.legend && si.legend !== '') {
      const legend = document.createElement('div');
      legend.classList.add('legend');
      legend.innerHTML = `<div><b>Legend: </b>${si.legend}</div>`;
      el.appendChild(legend);
    }

    if (si.image && si.image !== '') {
      const image = document.createElement('div');
      image.classList.add('image');
      image.innerHTML = `<div><img src='${si.image}' alt='Image'>`;
      el.appendChild(image);
    }

    if (si.license && si.license !== '') {
      const license = document.createElement('div');
      license.classList.add('license');
      license.innerHTML = `<div><b>License: </b>${si.license}</div>`;
      el.appendChild(license);
    }

    el.classList.add('sourceinfo');
    par.appendChild(el);
  
    const container = document.getElementById('SourceInfoContainer');
    const handle = document.getElementById('siDragHandle');

    container.style.visibility = 'visible';
    handle.style.visibility = 'visible';
  }

  // ////////////////////////////////////////////////////////////////////////
  // SetUp menu tree
  // https://www.jstree.com
  // http://odonata.tacc.utexas.edu/views/jsTree/reference/_documentation/4_data.html
  // https://stackoverflow.com/questions/26643418/jstree-not-rendering-using-ajax
  my.SetUp = function () {
    function getFileName(node, file) {
      let jsonURL;

      if (node.id === '#') {
        jsonURL = `json/${file}`;
      } else {
        jsonURL = `json/${node.id}.json`;
      }

      return jsonURL;
    }

    function setTree(treeData) {
      $('#TreeMenu').jstree({
        checkbox: {
          keep_selected_style: true,
          real_checkboxes: true,
        },
        plugins: ['checkbox', 'context'],
        core: {
          check_callback(operation, node, parent, position, more) {
            if (operation === 'create_node') return true;
            return false; // Do not allow drag and drop
          },
          themes: {
            dots: false,
            icons: App4Sea.useIconsInMenu,
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
      });
    }

    function getData(node, filename) {    
      function onSuccess(parent_node, fnSetTree, ourFilename, ourJSONdata) {
        return function (data, status, jqXHR) {
          for (let i_success = 0; i_success < data.length; i_success++) {
            const thisNode = data[i_success];
            const { children } = thisNode;
            thisNode.children = false;// Must be set to false as we are loading acync (sic!)

            if (thisNode.a_attr.tool && thisNode.a_attr.tool === 'animation') {
              thisNode.icon = 'icons/animation_16.png';
            }

            ourJSONdata.push(thisNode);

            if (children) getData(thisNode, ourFilename); // Do this recursively

            // if (App4Sea.logging) console.log(parent_node.id + ': ' + thisNode.id + ", text: " + thisNode.text + ", path: " + thisNode.a_attr.path);
          }-

          ajaxCount--;
          if (ajaxCount === 0) {
            // if (App4Sea.logging) console.log("WE ARE DONE! ");

            fnSetTree(ourJSONdata);
          }
        };
      }

      function onError(parent_node, ourFilename) {
        return function (jqXHR, status, errorThrown) {
          if (App4Sea.logging) console.log(jqXHR);
          if (App4Sea.logging) console.log(status);
          if (App4Sea.logging) console.log(errorThrown);
          if (App4Sea.logging) console.log(parent_node);

          ajaxCount--;
          if (ajaxCount === 0) {
            if (App4Sea.logging) console.log(`WE ARE DONE WITH ERROR! ${ourFilename}`);
          }
        };
      }

      const jsonURL = getFileName(node, filename);

      ajaxCount++;
      $.ajax({
        url: jsonURL,
        contentType: 'application/json; charset=utf-8',
        type: 'GET',
        dataType: 'JSON',
        cache: false,
        async: true,
        success: onSuccess(node, setTree, filename, JSONdata),
        error: onError(node, filename),
      });
    }

    function setSourceInfoButton(child) {
      const node = $(TreeMenu).jstree(true).get_node(child.id);
      if (node && node.a_attr) {
        const { source } = node.a_attr;
        if (source) {
          const el = document.createElement('button');
          el.id = 'sib_' + child.id;
          el.addEventListener(
            'click',
            () => {
              showSourceInfo(child.outerText, sourceInfo[source]);
            },
            false,
            { passive: true }
          );
          // el.addEventListener(
          //   'mouseenter',
          //   () => {
          //     showSourceInfo(child.outerText, sourceInfo[source]);
          //   },
          //   false,
          //   { passive: true }
          // );
          // el.addEventListener(
          //   'mouseleave',
          //   () => {
          //     App4Sea.TreeMenu.si_close('siContainer')
          //   },
          //   false,
          //   { passive: true }
          // );
          el.classList.add('sourceinfobutton');
          child.appendChild(el);
        }
      }
    }
    
    function addSouceInfo(elem) {
      function recurseSourceInfo(par) {
        for (let ind = 0; ind < par.children.length; ind++) {
          const child = par.children[ind];
          
          recurseSourceInfo(child);

          if (child.localName === 'li') {
            setSourceInfoButton(child);
          }
        }
      }

      recurseSourceInfo(elem);
    }

    // // Catch event: check_node
    // $('#TreeMenu').on('check_node.jstree', function (e, data) {
    //   const elem = document.getElementById(data.node.id);
    //   addSouceInfo(elem);
    // });

    // // Catch event: load_node
    // $('#TreeMenu').on('load_node.jstree', function (e, data) {
    //   const elem = document.getElementById(data.node.id);
    //   addSouceInfo(elem);
    // });

    // // Catch event: activate_node
    // $('#TreeMenu').on('activate_node.jstree', function (e, data) {
    //   const elem = document.getElementById(data.node.id);
    //   addSouceInfo(elem);
    // });
    // // Catch event: select_node
    // $('#TreeMenu').on('select_node.jstree', function (e, data) {
    //   const elem = document.getElementById(data.node.id);
    //   addSouceInfo(elem);
    // });
    // // Catch event: set_id
    // $('#TreeMenu').on('set_id.jstree', function (e, data) {
    //   const elem = document.getElementById(data.node.id);
    //   addSouceInfo(elem);
    // });
    // // Catch event: refresh
    // $('#TreeMenu').on('refresh.jstree', function (e, data) {
    //   const elem = document.getElementById(data.node.id);
    //   addSouceInfo(elem);
    // });
    // Catch event: create_node. 
    // Need this to add button again as the li node is replaced the first time node is selected
    $('#TreeMenu').on('create_node.jstree', function (e, data) {
      const elem = document.getElementById(data.node.parent);
      if (elem) {
        setSourceInfoButton(elem);
      }
    });


    // Catch event: open_node
    $('#TreeMenu').on('open_node.jstree', function (e, data) {
      const elem = document.getElementById(data.node.id);
      addSouceInfo(elem);
    });

    // Catch event: loaded
    $('#TreeMenu').on('loaded.jstree', function (e, data) {
      const root = $('#TreeMenu')[0];
      addSouceInfo(root);
    });

    // Catch event: changed
    $('#TreeMenu').on('changed.jstree', function (e, data) {
      // if (App4Sea.logging) console.log(`On Action: ${data.action} on node ${data.node.id}`);

      if (typeof data.node === 'undefined') return;

      const node = data.node; 

      // Remove overlay
      hideMetadata();

      // We add nodes based on the nodes selected, not the node(S) that come in data

      // Remove layer if not in the list of selected nodes
      for (let lind = 0; lind < App4Sea.OpenLayers.layers.length; lind++) {
        // Check if layer is active
        const activeLayers = App4Sea.OpenLayers.Map.getLayers();
        const { ol_uid } = App4Sea.OpenLayers.layers[lind].vector;
        const activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);

        let isSel = false;
        for (let sind = 0; sind < data.selected.length; sind++) {
          if (data.selected[sind] === App4Sea.OpenLayers.layers[lind].id) {
            isSel = true;
            break;
          }
        }
        if (!isSel && activeIndex !== -1) {
          App4Sea.OpenLayers.Map.removeLayer(App4Sea.OpenLayers.layers[lind].vector);
          // if (App4Sea.logging) console.log("Layer removed: " + App4Sea.OpenLayers.layers[lind].id);
        }
      }

      // Add InfoPopUp
      if (node.text === 'Description' || node.text === 'Author') {
        if (node.state.selected) {
          showMetadata(node.text, node.id, node.data);
        }
      } else if (node.text === 'Legend') {
        if (node.state.selected) {
          showMetadata(node.text, node.id, node.data);
        }
      }

      // Add layer
      for (let ind = 0; ind < data.selected.length; ind++) {
        const nod = $('#TreeMenu').jstree(true).get_node(data.selected[ind]);

        // Check if layer exists in cache
        const index = App4Sea.Utils.alreadyLayer(nod.id, App4Sea.OpenLayers.layers);

        if (index !== -1) { // Layer exists in cache
          // Check if layer is active
          const activeLayers = App4Sea.OpenLayers.Map.getLayers();
          const { ol_uid } = App4Sea.OpenLayers.layers[index].vector;
          const activeIndex = App4Sea.Utils.alreadyActive(ol_uid, activeLayers);

          // Activate if not active
          if (activeIndex === -1) { // Layer is not active
            if (App4Sea.logging) console.log(`Layer being activated from cache: ${nod.id}: ${nod.text}`);
            App4Sea.OpenLayers.Map.addLayer(App4Sea.OpenLayers.layers[index].vector);
            App4Sea.Utils.LookAt(App4Sea.OpenLayers.layers[index].vector);
          }
          continue;
        }

        // Go for first addition
        const { path } = nod.a_attr;
        const { tool } = nod.a_attr;
        let proje = nod.a_attr.projection;

        if (tool === 'animation') {
          App4Sea.Utils.w3_open('AnimationContainer');
        } else if (tool === 'heat') {
          App4Sea.Utils.w3_open('HeatContainer');
        }

        if (!path || path === '') {
          // if (App4Sea.logging) console.log(`Error: not path for: ${nod.id}: ${nod.text}`);
          continue;
        }

        if (App4Sea.logging) console.log(`Layer being added: ${nod.id}: ${nod.text}`);

        if (tool === 'heat') {
          if (index === -1) {
            const vect = App4Sea.Utils.heatMap(path, nod.id, nod.text);
            App4Sea.OpenLayers.layers.push({ id: nod.id, vector: vect });
            if (App4Sea.logging) console.log(`Cached layers now are ${App4Sea.OpenLayers.layers.length}`);

            App4Sea.OpenLayers.Map.addLayer(vect);
            App4Sea.Utils.LookAt(vect);
          }
        } else if (path.length > 3) {
          const ext = path.toLowerCase().substr(path.length - 3, 3);
          if (ext === '1cd') { // 6a3e86f0825c7e6e605105c24d5ec1cd
            if (index === -1) {
              const vect = App4Sea.Weather.loadWeather(path, nod.id);
              App4Sea.OpenLayers.layers.push({ id: nod.id, vector: vect });
              if (App4Sea.logging) console.log(`Cached layers now are ${App4Sea.OpenLayers.layers.length}`);

              App4Sea.OpenLayers.Map.addLayer(vect);
              App4Sea.Utils.LookAt(vect);
            }
          } else if (ext === 'wms' || ext === 'gif' || ext === 'cgi' || ext === 'png' || ext === 'jpg' || ext === 'peg') {
            if (index === -1) {
              const parts = App4Sea.Utils.parseURL(path.toLowerCase());
              const { bbox } = parts.searchObject;
              const wms = parts.searchObject.service;

              let imageExtent = [-10, 50, 10, 70]; // WSEN Defaut location for images that do not tell about themselves. SRS
              let center = [0, 0];

              proje = App4Sea.prefProj;// Default projection (in map coorinates, not view)
              let isSRS = true;
              if (parts.searchObject.crs !== undefined) {
                proje = parts.searchObject.crs;
                isSRS = false;
                // CRS: S W N E
                imageExtent = [50, -10, 70, 10]; // SWNE Defaut location for immages that do not tell about themselves.
                if (App4Sea.logging) console.log('This is using CRS');
              } else if (parts.searchObject.srs !== undefined) {
                proje = parts.searchObject.srs;
                // SRS: W S E N
              }
              if (App4Sea.logging) console.log(`Now handling a ${ext} file with projection:  ${proje}`);
              if (wms) {
                if (App4Sea.logging) console.log('This is a WMS file');
              }

              const ourProj = App4Sea.prefProj;

              if (nod.a_attr.center) {
                center = App4Sea.Utils.TransformLocation(nod.a_attr.center, proje.toUpperCase(), ourProj);
              }

              if (bbox !== undefined) {
                const InvertBbox = nod.a_attr.invertbbox;
                try {
                  const ex = bbox.split(',');
                  let extent;
                  if (isSRS || InvertBbox) {
                    extent = [parseFloat(ex[0]), parseFloat(ex[1]), parseFloat(ex[2]), parseFloat(ex[3])];
                  } else {
                    extent = [parseFloat(ex[1]), parseFloat(ex[0]), parseFloat(ex[3]), parseFloat(ex[2])];
                  }
                  imageExtent = App4Sea.Utils.TransformExtent(extent, proje.toUpperCase(), ourProj);
                  if (App4Sea.logging) console.log(`Native extent ${ex}`);
                  if (App4Sea.logging) console.log(`Normalized extent ${imageExtent}`);
                } catch (err) {
                  if (App4Sea.logging) console.log(`Could not find extent for image at ${path}`);
                }
              }

              let hei = parseFloat(parts.searchObject.height);
              let wid = parseFloat(parts.searchObject.width);
              if (hei === null || App4SeaUtils.isNaN(hei)) hei = parseFloat(nod.a_attr.height);
              if (wid === null || App4SeaUtils.isNaN(wid)) wid = parseFloat(nod.a_attr.width);
              if (hei === null || App4SeaUtils.isNaN(hei)) hei = 512; // Default value for images that do not tell about themselves or have attributes in json
              if (wid === null || App4SeaUtils.isNaN(wid)) wid = 512; // Default value for images that do not tell about themselves or have attributes in json
              if (App4Sea.logging) console.log(`Height and width are ${[hei, wid]}`);

              if (tool === 'animation') {
                let count = 12;
                if (nod.a_attr.count) count = parseFloat(nod.a_attr.count);
                if (count === null || App4SeaUtils.isNaN(count)) count = 12;

                let step = 1;
                if (nod.a_attr.step) step = parseFloat(nod.a_attr.step);
                if (step === null || App4SeaUtils.isNaN(step)) step = 1;

                const [canAnimate, gol, golb, goll] = App4Sea.Animation.aniDataForWMS(path, step, count, node.id, node.text);

                for (let aind = 0; aind < gol.length; aind++) {
                  const vect = App4Sea.Utils.loadImage(nod, ourProj, imageExtent, true, gol[aind],
                    nod.id, nod.text, nod.text, isSRS,
                    wid, hei, nod.a_attr.start, wms, center);

                  const newId = addChild(golb[aind], gol[aind], $('#TreeMenu'), nod.id, false, 'icons/overlay.png');
                  goll[aind] = newId;

                  if (aind === 0) { // Must perserve original root id for layer
                    App4Sea.OpenLayers.layers.push({ id: nod.id, vector: vect });
                  } else {
                    App4Sea.OpenLayers.layers.push({ id: newId, vector: vect });
                  }

                  if (App4Sea.logging) console.log(`Cached layers now are ${App4Sea.OpenLayers.layers.length}`);

                  App4Sea.OpenLayers.Map.addLayer(vect);
                  if (aind === 0) {
                    App4Sea.Utils.LookAt(vect);
                  }
                }

                if (canAnimate) App4Sea.Animation.Animate(path, nod.text, nod.id);
              } else {
                const vect = App4Sea.Utils.loadImage(nod, ourProj, imageExtent, true, path,
                  nod.id, nod.text, nod.text, isSRS,
                  wid, hei, nod.a_attr.start, wms, center);

                App4Sea.OpenLayers.layers.push({ id: nod.id, vector: vect });

                if (App4Sea.logging) console.log(`Cached layers now are ${App4Sea.OpenLayers.layers.length}`);

                App4Sea.OpenLayers.Map.addLayer(vect);
                App4Sea.Utils.LookAt(vect);
              }
            }
          } else if (index === -1) {
            // Including kmz and kml
            App4Sea.KML.loadKmlKmz(path, nod.id, nod.text, nod);
          } else {
            if (App4Sea.logging) console.log(`Not handling extension type ${ext}`);
          }
        }
      }
    });

    JSONdataSourceInfo = [];
    getSourceInfo();
    JSONdata = [];
    getData({ id: '#' }, 'a4s.json', JSONdata);
  };

  // ////////////////////////////////////////////////////////////////////////
  // Checkbox to check or uncheck item in tree
  my.Checkbox = function (layerid, on) {
    if (on) {
      $.jstree.reference('#TreeMenu').check_node(layerid);
    } else {
      $.jstree.reference('#TreeMenu').uncheck_node(layerid);
    }
  };

  return my;
}());
App4Sea.TreeMenu = App4SeaTreeMenu;
