/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * ========================================================================== */

import qwest from 'qwest';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import Image from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import KML from 'ol/format/KML';
import * as proj from 'ol/proj';
import App4Sea from './App4Sea';

const App4SeaKML = (function () {
  const my = {};
  let ynd = 0;
  let title = '';

  // //////////////////////////////////////////////////////////////////////////
  // Declare worker scripts path for zip manipulation
  zip.workerScriptsPath = 'static/js/';

  // //////////////////////////////////////////////////////////////////////////
  // load kml and return as Vector (This function only handle simple kml files)
  // See https://developers.google.com/kml/documentation/kmlreference
  my.loadKml = function (url) {
    // $("#DebugWindow").append("loadKml: " + url + "<br/>");
    if (App4Sea.logging) console.log(`loadKml: ${url}`);
    const vector = new VectorLayer({
      source: new Vector({
        url,
        crossOrigin: 'anonymous',
        // rendermode: 'image',
        format: new KML({
          extractStyles: true,
          extractAttributes: true,
          showPointNames: false,
        }),
      }),
    });

    return vector;
  };

  // //////////////////////////////////////////////////////////////////////////
  // load kmz or kml and recurse through nested files
  // See https://developers.google.com/kml/documentation/kmzarchives
  my.loadKmlKmz = function (url, id, name) {
    if (App4Sea.logging) console.log(`loadKmz: ${id} from ${url}`);
    title = name;
    repeat_kml_kmz_calls(url, id);
  };

  // //////////////////////////////////////////////////////////////////////////
  // Recursion
  function repeat_kml_kmz_calls(url, id) {
    // make the ajax call to kmz that unzip and read the file
    // this file reference other KMZ so we call each of them
    // and add their content
    const str = url.toLowerCase();
    if (App4Sea.logging) console.log(str);
    if (str.endsWith('kmz')) {
      if (App4Sea.logging) console.log(`readAndAddFeatures kmz element: ${url}`);
      ajaxKMZ(url, id, unzipFromBlob(readAndAddFeatures, id));
    } else {
      if (App4Sea.logging) console.log(`readAndAddFeatures non-kmz element: ${url}`);
      ajaxKMZ(url, id, readAndAddFeatures);// kml
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // Function to make ajax call and make a callback on success (both kml and kmz)
  // We are getting data from the internet
  function ajaxKMZ(url, id, callback) {
    if (App4Sea.logging) console.log(`ajaxKMZ: ${url}`);

    const onSuccess = function (_id, _callback) {
      return function (xhr, response) {
        // Run when the request is successful
        // $("#DebugWindow").append("ajaxKMZ Response: " + response + "<br/>");
        if (App4Sea.logging) console.log(`ajaxKMZ OK: ${xhr.responseURL}`);

        const str = xhr.responseURL.toLowerCase();
        const rspTp = typeof (response);
        if (str.endsWith('kml') && (rspTp === 'object' || rspTp === 'string')) {
          const extendedCallback = function (str1, id1, callb) {
            return function (e) {
              if (App4Sea.logging) console.log(`Callback: ${id1}: ${str1}`);
              const text = e.srcElement.result;
              if (App4Sea.logging) console.log(text);
              callb(text, str1, id1);
            };
          };

          // if (App4Sea.logging) console.log(response);

          // This will fire after the blob has been read/loaded.
          const reader = new FileReader();
          reader.addEventListener('loadend', extendedCallback(str, _id, _callback), false, { passive: true });

          if (rspTp === 'string') {
            _callback(response, str, _id);
          } else {
            // Start reading the blob as text. readAsText
            reader.readAsBinaryString(response);
          }
        } else {
          if (App4Sea.logging) console.log(`Now handling ${str}`);

          _callback(response, str, id);
        }
      };
    };

    // See: https://github.com/pyrsmk/qwest for get documentation
    // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS for Cors documentation
    // See: https://remysharp.com/2011/04/21/getting-cors-working
    let respType = 'multipart/form-data';
    if (url.toLowerCase().endsWith('kmz')) respType = 'blob';
    else if (url.toLowerCase().endsWith('kml')) respType = 'text';// https://xhr.spec.whatwg.org/#the-responsetype-attribute
    qwest.get(url, // Url
      null, // Data
      { // Options
        responseType: respType, // need blob for kmz files
        cache: true, // Cors Origin fix (not working!)
        headers: {
          //                    crossOrigin: 'anonymous'
        },
        // Before
      })
      .then(onSuccess(id, callback))
      .catch((e, xhr) => {
        if (App4Sea.logging) console.log(`ajaxKMZ Error: ${e}: Url: ${xhr.responseURL}, id: ${id}`);
        // if (App4Sea.logging) console.log(xhr);
        // Process the error
      })
      .complete(() => {
        // Always run
        // if (App4Sea.logging) console.log("ajaxKMZ DONE: " + url);
      });
  }

  // //////////////////////////////////////////////////////////////////////////
  // Function to unzip content from blob and execute callback
  // We are getting data from local file
  function unzipFromBlob(callback, id) {
    return function unzip(blob) {
      if (App4Sea.logging) console.log(`Unzip id ${id}`);
      // use a BlobReader to read the zip from a Blob object
      zip.createReader(
        new zip.BlobReader(blob),
        (reader) => {
          // get all entries (array of objects) from the zip
          reader.getEntries((entries) => {
            if (App4Sea.logging) console.log(`Got entries: ${entries.length}`);
            for (let ind = 0; ind < entries.length; ind++) {
              const extendedCallback = function (str1, id1, callb, ntries) {
                return function (text) {
                  // if (App4Sea.logging) console.log("extendedCallback for " + id1 + " at " + str1 + " next call " + callb);
                  // text contains the entry data as a String (even though it may be a blob)
                  // if (App4Sea.logging) console.log("About to call back for " + str1);
                  callb(text, str1, id1, ntries);
                };
              };

              const str = entries[ind].filename.toLowerCase();

              if (str.endsWith('.kml')) {
                if (App4Sea.logging) console.log(`Entry ${ind}: ${str}`);
                // there is always only one KML in KMZ, namely the doc.kml (name can differ).
                // we get the kml content as text, but also any other content (as text)
                entries[ind].getData(/* writer, onend, onprogress, checkCrc32 */
                  new zip.TextWriter(),
                  extendedCallback(str, id, callback, entries),
                  (current, total) => {
                    // onprogress callback
                    // if (App4Sea.logging) console.log("unzipFromBlob Total: " + total.toString() + ", Current: " + current.toString());
                  },
                );
              }
            }
          });
        },
        (error) => {
          // onerror callback (error is of type Event)
          // $("#DebugWindow").append("unzipFromBlob Error: " + error + "<br/>");
          if (App4Sea.logging) console.log(`unzipFromBlob Error: ${error}`);
        },
      );
    };
  }

  // //////////////////////////////////////////////////////////////////////////
  // Read a KML and add any features to the vector layer recursively
  // This call will either be called with a kml file or the individual entries (as text)
  // from the entries in the kmz file (of which the doc.kml file is one).
  let readAndAddFeatures = function (text, path, id, entries) {
    if (App4Sea.logging) console.log(`readAndAddFeatures >>>> ${path} from file ${id}`);

    const str = path.toLowerCase();

    if (str.endsWith('kml')) {
      addKMLFeatures(text, str, id); // TBD this is used for simple kml data (placemarks and vectors). Should do all locally

      const listFilesNested = parseKmlText(path, text, id, entries);
      if (App4Sea.logging) console.log(`listFilesNested are ${listFilesNested.length}`);

      listFilesNested.forEach((el) => {
        if (App4Sea.logging) console.log('readAndAddFeatures ----------');
        // Nested calls. Acceptable for a demo
        // but could be "promisified" instead
        repeat_kml_kmz_calls(el, id);
      });
    } else {
      // /addKMLFeatures(text, str, id);
    }
    if (App4Sea.logging) console.log('readAndAddFeatures <<<<');
  };

  // //////////////////////////////////////////////////////////////////////////
  // Function to ease KML feature reading
  function addKMLFeatures(text, path, id) {
    if (App4Sea.logging) console.log(`>>> addKMLFeatures: ${path}`);

    if (path.endsWith('kml')) {
      // if (App4Sea.logging) console.log(text); // log the whole kml file
      loadKmlText(text, id, path);

      if (App4Sea.logging) console.log(`addKMLFeatures: ${id} in file ${path} DONE`);
    }

    if (App4Sea.logging) console.log('<<< addKMLFeatures');
  }

  // //////////////////////////////////////////////////////////////////////////
  // Load kml content and return as Vector
  // See https://developers.google.com/kml/documentation/kmlreference
  function loadKmlText(text, id, path) {
    if (App4Sea.logging) console.log(`loadKmlText: ${path}`);

    const formatter = new KML({
      extractStyles: true,
      extractAttributes: true,
      showPointNames: false,
    });

    const proj = formatter.readProjection(text);
    if (proj !== null) if (App4Sea.logging) console.log(`Projection: ${proj.getCode()}`);

    const kml_features = formatter.readFeatures(text, {
      dataProjection: proj.getCode(), // Projection of the data we are reading.
      featureProjection: App4Sea.prefViewProj, // Projection of the feature geometries created by the format reader.
    });

    if (App4Sea.logging) console.log(`kml_features are: ${kml_features.length}`);

    if (kml_features.length > 0) {
      //            let description = kml_features[0].get('description');
      //
      //            if (description) {
      //                addChild('Description', description, $('#TreeMenu'), id, false);
      //            }
    }
    // else {
    //     let listFilesNested = parseKmlText(path, text, id, null);

    //     if (App4Sea.logging) console.log("listFilesNested are " + listFilesNested.length);

    //     listFilesNested.forEach(function (el) {
    //         if (App4Sea.logging) console.log("readAndAddFeatures ----------");
    //         // Nested calls. Acceptable for a demo
    //         // but could be "promisified" instead
    //         repeat_kml_kmz_calls(el, id);
    //     });
    //     return;
    // }

    const vector = new VectorLayer({
      source: new Vector({
        crossOrigin: 'anonymous',
        format: formatter,
      }),
    });
    const theSource = vector.getSource();
    theSource.addFeatures(kml_features);
    const extent = App4Sea.Utils.GetFeaturesExtent(kml_features);
    let location = null;
    if (extent !== undefined && extent !== null) {
      const prx = theSource.getProjection();
      const ext = App4Sea.Utils.TransformExtent(extent, App4Sea.prefViewProj, App4Sea.prefProj);
      const x = ext[0] + ext[2];
      const y = ext[1] + ext[3];
      location = [x / 2, y / 2];

      if (App4Sea.logging) console.log(`Extent: ${extent}, proj: ${prx}, ext: ${ext}`);
    }

    App4Sea.OpenLayers.layers.push({ id, vector });
    if (App4Sea.logging) console.log(`Cached layers now are ${App4Sea.OpenLayers.layers.length}`);

    App4Sea.OpenLayers.Map.addLayer(vector);
    // App4Sea.Utils.FlyTo(location, null);
    App4Sea.Utils.LookAt(location);
  }

  // //////////////////////////////////////////////////////////////////////////
  function getStyleEntry(newId, parentId, node) {
    return {
      type: node.nodeName, id: node.id, newId, parentId, node, value: node.innerHTML,
    };
  }

  // //////////////////////////////////////////////////////////////////////////
  function addStyleMap(parentId, node) {
    // TBD !!!!!
    let newID = `${parentId}-${node.id}`;
    let newStyleMap;

    switch (node.nodeName) {
      case 'StyleMap':
        newStyleMap = getStyleEntry(newID, parentId, node);
        App4Sea.OpenLayers.styleMaps.push(newStyleMap);
        break;

      case 'Style':
        newStyleMap = getStyleEntry(newID, parentId, node);
        App4Sea.OpenLayers.styleMaps.push(newStyleMap);
        newID = App4Sea.OpenLayers.styleMaps.length;
        break;
/*
            case 'Pair':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'BalloonStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'LabelStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'PolyStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'LineStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'ListStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'styleUrl':
                newStyleMap = getStyleEntry(name, id, parNode, text);
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'key':
                newStyleMap = getStyleEntry(name, id, parNode, text);
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'text':
                newStyleMap = getStyleEntry(name, id, parNode, text);
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'gx:IconStackStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;

            case 'IconStyle':
                newStyleMap = getStyleEntry(name, id, parNode, "");
                styleMaps.push(newStyleMap);
                newID = styleMaps.length;
                break;
*/
    }

    return newID;
    // let newStyleMap = { state: {"closed" : true, "checkbox_disabled" : false, "disabled" : false},
    //  icon: icon, text: text, data: data, selected: true, children : false };
    // let retVal = tree.jstree(true).create_node(parNode, newNode, 'last', false, false);
    // if (App4Sea.logging) console.log("Adding " + text + " to tree under " + parNode + " returned " + retVal);
    // return retVal;
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
  // Function to parse KML text to get link reference to list any other
  // nested files (kmz or kml)
  function parseKmlText(path, text, id, entries) {
    if (App4Sea.logging) console.log(`parseKmlText: ${path}`);
    const oParser = new DOMParser();
    const oDOM = oParser.parseFromString(text, 'text/xml');
    const links = oDOM.querySelectorAll('NetworkLink > Link > href');
    const urls = oDOM.querySelectorAll('NetworkLink > Url > href');

    // Collect data for animation of GrounOverlay
    const [canAnimate, gol, goll] = App4Sea.Animation.aniDataForGroundOverlay(oDOM);
    let count = 0;
    const kml = oDOM.querySelector('kml');

    // //////////////////////////////////////////////////////////////////////////
    function getName(children, defaultName) {
      for (let ind = 0; ind < children.length; ind++) {
        if (children[ind].nodeName === 'name' || children[ind].nodeName === 'atom:name') return children[ind].innerHTML;
      }
      return defaultName;
    }

    // //////////////////////////////////////////////////////////////////////////
    function addLegend(name, url) {
      const tr = document.createElement('tr');
      tr.style.backgroundColor = 'white';
      tr.style.position = 'absolute';
      App4Sea.Utils.dragElement(tr);

      tr.name = name;

      tr.innerHTML = `<td><p class="legendTitle">${name}</p><img class="imgLegend" src="${url}" alt="Legend"/></td>\
                <td><button class="btn-right" title="Close" onclick="$.App4Sea.KML.removeRow(this)"><i class="fa fa-close"></i></button></td>`;
      // <img class="imgLegend" src="url" alt="Legend"/>
      // <button class="btn-right" title="Close" onclick="$.App4Sea.Utils.w3_close('name')"><i class="fa fa-close"></i></button>
      // <input type="button" value="x" onclick="$.App4Sea.KML.removeRow(this)">

      const leg = document.getElementById('tableLegend');
      leg.appendChild(tr);
    }

    // //////////////////////////////////////////////////////////////////////////
    my.removeRow = function (input) {
      document.getElementById('tableLegend').removeChild(input.parentNode.parentNode);// tr.td.button
    };

    // //////////////////////////////////////////////////////////////////////////
    function addOverlay(overlay, id) {
      //----------------------------------------------------------------------
      function loadImageFromKmz(ent1, url1, ext1, prj1, nam1, id1, leg1) {
        const extendedCallback = function (ur, ex, pr, nm, en, id, le) {
          return function (data) {
            const kmzurl = URL.createObjectURL(data);

            if (le) {
              addLegend(title, kmzurl);
            } else {
              const source = new ImageStatic({
                url: kmzurl,
                imageExtent: ex,
                projection: pr,
              });
              const image = new Image({
                name: nm,
                source,
              });
              if (image) {
                if (App4Sea.logging) console.log(`Pushing image to: ${ex}`);
                App4Sea.OpenLayers.layers.push({ id, vector: image });
                // if (App4Sea.logging) console.log("Added image from kmz. Cached layers now are " + App4Sea.OpenLayers.layers.length + ": " + ur);

                App4Sea.OpenLayers.Map.addLayer(image);
                App4Sea.Utils.LookAt(image);
              } else if (App4Sea.logging) console.log('No image created from kmz');
            }
          };
        };

        ent1.getData(new zip.BlobWriter('text/plain'), extendedCallback(url1, ext1, prj1, nam1, ent1, id1, leg1));
      }

      //----------------------------------------------------------------------
      function findIn(filesInKmz, url_, ext, prj_, nam, ide, isLeg) {
        let found = false;
        for (let ind = 0; ind < filesInKmz.length; ind++) {
          if (filesInKmz[ind].filename === url_) {
            loadImageFromKmz(filesInKmz[ind], url_, ext, prj_, nam, ide, isLeg);
            found = true;
          }
        }

        if (!found) if (App4Sea.logging) console.log(`Didn't find file in kmz: ${url_}`);
      }

      //----------------------------------------------------------------------
      const href = overlay.querySelector('Icon href');
      let url;
      let nameIs = '';
      const name = overlay.querySelector('name');
      if (name) {
        nameIs = name.innerHTML;
      }

      if (href) url = href.innerHTML;

      //----------------------------------------------------------------------
      if (overlay.nodeName === 'ScreenOverlay') {
        if (App4Sea.logging) console.log(`ScreenOverlay: ${url}`);
        /*
                    <ScreenOverlay>
                        <name>colorbar</name>
                        <Icon>
                            <href>http://people.eng.unimelb.edu.au/mpeel/Koppen/World_Koppen_Map_Legend.png</href>
                        </Icon>
                        <overlayXY x="0.5" y="-1" xunits="fraction" yunits="fraction"/>
                        <screenXY x="0.5" y="0" xunits="fraction" yunits="fraction"/>
                        <rotationXY x="0.5" y="0.5" xunits="fraction" yunits="fraction"/>
                        <size x="-1" y="-1" xunits="pixels" yunits="pixels"/>
                    </ScreenOverlay>
                */
        if (url) {
          if (!url.startsWith('http') && entries && entries.length > 1) {
            if (App4Sea.logging) console.log(`Getting legend from kmz: ${url}`);
            findIn(entries, url, null, null, nameIs, id, true);
          } else addLegend(title, url);
        }
      }
      //----------------------------------------------------------------------
      else if (overlay.nodeName === 'PhotoOverlay') {
        if (App4Sea.logging) console.log(`PhotoOverlay: ${url}`);
      }
      //----------------------------------------------------------------------
      else { // GroundOverlay
        /*
                <GroundOverlay id="3">
                    <name>growth at1989-01-01T00:00:00</name>
                    <TimeStamp id="6">
                        <when>1989-01-01T00:00:00Z</when>
                    </TimeStamp>
                    <Icon id="4">
                        <href>http://opendap.deltares.nl/thredds/wms/opendap/imares/plaice_large_1989/plaice_large_1989_day_1.nc?VERSION=1.1.1&REQUEST=GetMap&bbox=-6.9166666666665,48.349629629499994,16.7500000000475,60.0622221915&SRS=EPSG%3A4326&WIDTH=512&HEIGHT=512&LAYERS=Band1&STYLES=boxfill/sst_36&TRANSPARENT=TRUE&FORMAT=image/gif&COLORSCALERANGE=-0.1,0.2</href>
                        <refreshMode>onStop</refreshMode>
                        <viewBoundScale>0.75</viewBoundScale>
                    </Icon>
                    <LatLonBox>
                        <north>60.0622221915</north>
                        <south>48.3496296295</south>
                        <east>16.75</east>
                        <west>-6.91666666667</west>
                    </LatLonBox>
                </GroundOverlay>
                */
        if (App4Sea.logging) console.log(`GroundOverlay: ${url}`);

        url = url.replaceAll(/&amp;/, '&');

        const west = parseFloat(overlay.querySelector('west').innerHTML);
        const south = parseFloat(overlay.querySelector('south').innerHTML);
        const east = parseFloat(overlay.querySelector('east').innerHTML);
        const north = parseFloat(overlay.querySelector('north').innerHTML);

        const viewExtent = proj.transformExtent([west, south, east, north], App4Sea.prefProj, App4Sea.prefViewProj);
        if (App4Sea.logging) console.log(`GroundOverlay: W:${west} S:${south} E:${east} N:${north} Pro:${App4Sea.prefProj} ViewProj:${App4Sea.prefViewProj}`);

        let image;
        ynd += 1;// && ynd % 2 === 1
        if (!url.startsWith('http') && entries && entries.length > 1) {
          if (App4Sea.logging) console.log(`Getting image from kmz: ${url}`);
          findIn(entries, url, viewExtent, App4Sea.prefViewProj, nameIs, id);
        } else {
          if (App4Sea.logging) console.log(`Getting image from url: ${url}`);
          const source = new ImageStatic({
            url,
            // crossOrigin: 'anonymous',
            imageExtent: viewExtent, // [west, south, east, north],
            projection: App4Sea.prefViewProj,
          });
          image = new Image({
            name: nameIs,
            source,
          });
          if (image) {
            App4Sea.OpenLayers.layers.push({ id, vector: image });
            if (App4Sea.logging) console.log(`Added image from url. Cached layers now are ${App4Sea.OpenLayers.layers.length}: ${url}`);

            App4Sea.OpenLayers.Map.addLayer(image);
            App4Sea.Utils.LookAt(image);
          }
        }
      }
    }

    // //////////////////////////////////////////////////////////////////////////
    function listChildren(id, children) {
      for (let cind = 0; cind < children.length; cind++) {
        const child = children[cind];
        let newId;

        const timestamp = new Date().toLocaleString();
        if (App4Sea.logging) console.log(`${timestamp} Ttem handled: ${child.nodeName}`);

        if (child.nodeName === 'name' || child.nodeName === 'atom:name') {
          if (App4Sea.logging) console.log(`Name item not handled: ${child.innerHTML}`);
          // TBD
          //                    let name = child;
          //                    if(name.innerHTML !== "") {
          //                        newId = addChild('Name', name.innerHTML, tree, id, true);
          //                    }
        } else if (child.nodeName === 'description') {
          const description = child;
          if (description.innerHTML !== '') {
            const txt = App4Sea.Utils.NoXML(description.innerHTML);
            newId = addChild('Description', txt, $('#TreeMenu'), id, false, 'icons/description.png');
          }
        } else if (child.nodeName === 'author' || child.nodeName === 'atom:author') {
          const author = child;

          let authText = '<p>';
          for (let aind = 0; aind < author.children.length; aind++) {
            if (aind !== 0) authText += '<br/>';
            const txt = App4Sea.Utils.NoXML(author.children[aind].innerHTML);
            authText += txt;
          }
          authText += '</p>';
          newId = addChild('Author', authText, $('#TreeMenu'), id, false, 'icons/author.png');
        } else if (child.nodeName === 'Folder'
                        || child.nodeName === 'Document') {
          newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id, true, 'icons/folder.png');
        } else if (child.nodeName === 'Camera') {
          let elems;

          elems = child.getElementsByTagName('longitude');
          const lon = parseFloat(elems[0].textContent);

          elems = child.getElementsByTagName('latitude');
          const lat = parseFloat(elems[0].textContent);

          elems = child.getElementsByTagName('altitude');
          const alt = parseFloat(elems[0].textContent);

          // let center = ol.proj.transform([lon, lat], App4Sea.prefProj, App4Sea.prefViewProj);//'EPSG:3857');
          const zoom = App4Sea.Utils.altitudeToZoom(alt);

          App4Sea.Utils.FlyTo([lon, lat], null);
          // let view = App4Sea.OpenLayers.Map.getView();
          // view.setCenter(center);
          // view.setZoom(zoom);

          if (App4Sea.logging) console.log(`Camera set to lon=${lon} lat=${lat} alt=${alt}m zoom=${zoom}`);
        } else if (child.nodeName === 'Placemark') { // Can move this later to a selectable section TBD
          newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id, true, 'icons/placemark.png');
        } else if (child.nodeName === 'GroundOverlay'
                        || child.nodeName === 'PhotoOverlay'
                        || child.nodeName === 'ScreenOverlay') {
          newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id, false, 'icons/overlay.png');
          addOverlay(child, newId);

          let href = '';
          for (let hind = 0; hind < child.children.length; hind++) {
            let str = child.children[hind].localName;
            str = str.substr(0, 4);
            if (str === 'Icon' && child.children[hind].children && child.children[hind].children.length > 0) {
              href = child.children[hind].children[0].innerHTML;
              break;
            }
          }
          if (child.nodeName === 'GroundOverlay' && href === gol[count].innerHTML) {
            goll[count] = newId;
            count += 1;
          }
        } else if (child.nodeName === 'StyleMap'
                        || child.nodeName === 'Style') { // Included in StyleMap
          // if (App4Sea.logging) console.log("Not handling Style attributes: " + child.nodeName + ": " + child.id);
          //    function addStyleMap (parentId, node) {

          newId = addStyleMap(id, child);
        } else if (child.nodeName === 'TimeSpan') {
          // if (App4Sea.logging) console.log(child.nodeName + " item not handled: " + child.innerHTML);
        } else if (child.nodeName === 'TimeStamp') {
          // if (App4Sea.logging) console.log(child.nodeName + " item not handled: " + child.innerHTML);
        } else if (child.nodeName === 'Link'
                        || child.nodeName === 'atom:link'
                        || child.nodeName === 'NetworkLink'
                        || child.nodeName === 'open'
                        || child.nodeName === 'href'
                        || child.nodeName === 'visibility'
                        || child.nodeName === 'refreshMode'
                        || child.nodeName === 'refreshInterval'
                        || child.nodeName === 'ExtendedData' // Included in feature
                        || child.nodeName === 'Icon'
                        || child.nodeName === 'LatLonBox'
                        || child.nodeName === 'MultiGeometry'
                        || child.nodeName === 'gx:Tour'
                        || child.nodeName === 'gx:Playlist'
                        || child.nodeName === 'Schema'
                        || child.nodeName === 'SimpleField' // Included in Schema
                        || child.nodeName === 'LineString'
                        || child.nodeName === 'Point'
                        || child.nodeName === 'Snippet'
                        || child.nodeName === 'Region'

                        // This is used in Camera
                        || child.nodeName === 'longitude'
                        || child.nodeName === 'latitude'
                        || child.nodeName === 'altitude'
                        || child.nodeName === 'tilt'
                        || child.nodeName === 'altitudeMode'
                        || child.nodeName === 'roll'

                        || child.nodeName === 'gx:altitudeMode'

                        //
                        || child.nodeName === 'key' // Included in Pair as in StyleMap
                        || child.nodeName === 'styleUrl' // Included in feature or Pair as in StyleMap
                        || child.nodeName === 'Pair' // Included in StyleMap
                        || child.nodeName === 'BalloonStyle' // Included in Style
                        || child.nodeName === 'text' // Included is BalloonStyle
                        || child.nodeName === 'LabelStyle' // Included in Style
                        || child.nodeName === 'PolyStyle' // Included in Style
                        || child.nodeName === 'LineStyle' // Included in Style
                        || child.nodeName === 'ListStyle' // Included in Style
                        || child.nodeName === 'gx:IconStackStyle' // Included in Style
                        || child.nodeName === 'IconStyle') { // Included in Style
          // Currently not handling this
          // if (App4Sea.logging) console.log(child.nodeName + " item not handled: " + child.innerHTML);
          // TBD

        } else if (child.innerHTML !== '') if (App4Sea.logging) console.log(`Not handling ${child.nodeName} with ${child.innerHTML}`);

        if (child.children && child.children.length > 0) {
          const predecessors = [];
          let par = child.parentNode;
          while (par) {
            predecessors.push(par);
            par = par.parentNode;
          }
          if (predecessors && predecessors.length < 4) listChildren(newId, child.children);
        }
      }

      if (App4Sea.logging) console.log(`The count is  ${children.length}`);
    }

    if (kml) {
      listChildren(id, kml.children);

      if (canAnimate) App4Sea.Animation.Animate(path, title);
    }

    let files = Array.prototype.slice.call(links).map((el) => el.textContent);

    if (links.length === 0 && urls.length !== 0) {
      files = Array.prototype.slice.call(urls).map((el) => el.textContent);
    }

    if (App4Sea.logging) console.log(`NetworkLink files: ${files.length}`);

    return files;// , canAnimate;//, gol, golw, golb, gole;
  }

  return my;
}());
App4Sea.KML = App4SeaKML;
