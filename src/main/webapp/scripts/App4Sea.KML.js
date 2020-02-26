/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *
 * ========================================================================== */

import $ from 'jquery';
import qwest from 'qwest';
import * as olproj from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import Vector from 'ol/source/Vector';
import Image from 'ol/layer/Image';
import ImageStatic from 'ol/source/ImageStatic';
import KML from 'ol/format/KML';
import * as jsZip from '../static/js/zip';
import App4Sea from './App4Sea';

const App4SeaKML = (function () {
  const my = {};
  let title = '';

  // //////////////////////////////////////////////////////////////////////////
  // Declare worker scripts path for zip manipulation
  jsZip.zip.workerScriptsPath = 'static/js/';

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
  // Function to make ajax call and make a callback on success (both kml and kmz)
  // We are getting data from the internet
  function ajaxKMZ(url, id, callback, node) {
    if (App4Sea.logging) console.log(`ajaxKMZ: ${url}`);

    const onSuccess = function (_id, _callback, nod) {
      return function (xhr, response) {
        // Run when the request is successful
        // $("#DebugWindow").append("ajaxKMZ Response: " + response + "<br/>");
        if (App4Sea.logging) console.log(`ajaxKMZ OK: ${xhr.responseURL}`);

        const str = xhr.responseURL.toLowerCase();
        const rspTp = typeof (response);
        if (str.endsWith('kml') && (rspTp === 'object' || rspTp === 'string')) {
          const extendedCallback = function (str1, id1, callb, no) {
            return function (e) {
              if (App4Sea.logging) console.log(`Callback: ${id1}: ${str1}`);
              const text = e.srcElement.result;
              if (App4Sea.logging) console.log(text);
              callb(text, str1, id1, no);
            };
          };

          // if (App4Sea.logging) console.log(response);

          // This will fire after the blob has been read/loaded.
          const reader = new FileReader();
          reader.addEventListener('loadend', extendedCallback(str, _id, _callback, nod), false, { passive: true });

          if (rspTp === 'string') {
            _callback(response, str, _id, null, nod);
          } else {
            // Start reading the blob as text. readAsText
            reader.readAsBinaryString(response);
          }
        } else {
          if (App4Sea.logging) console.log(`Now handling ${str}`);

          _callback(response, str, id, nod);
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
      .then(onSuccess(id, callback, node))
      .catch((e, xhr) => {
        if (xhr) {
          if (App4Sea.logging) console.log(`ajaxKMZ Error: ${e}: Url: ${xhr.responseURL}, id: ${id}`);
        } else {
          if (App4Sea.logging) console.log(`ajaxKMZ Error: ${e}: id: ${id}`);
        }

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
  function unzipFromBlob(callback, id, node) {
    return function unzip(blob) {
      // console.log(blob);
      if (App4Sea.logging) console.log(`Unzip id ${id} with size ${blob.size} bytes`);
      // use a BlobReader to read the zip from a Blob object7
      jsZip.zip.createReader(
        new jsZip.zip.BlobReader(blob),
        (reader) => {
          // get all entries (array of objects) from the zip
          reader.getEntries((entries) => {
            if (App4Sea.logging) console.log(`Got entries: ${entries.length}`);
            for (let ind = 0; ind < entries.length; ind++) {
              const extendedCallback = function (str1, id1, callb, ntries, node1) {
                return function (text) {
                  // if (App4Sea.logging) console.log("extendedCallback for " + id1 + " at " + str1 + " next call " + callb);
                  // text contains the entry data as a String (even though it may be a blob)
                  if (App4Sea.logging) console.log(`About to call back for ${str1}`);
                  callb(text, str1, id1, ntries, node1);
                };
              };

              const str = entries[ind].filename.toLowerCase();

              if (str.endsWith('.kml')) {
                if (App4Sea.logging) console.log(`Entry ${ind}: ${str}`);
                // there is always only one KML in KMZ, namely the doc.kml (name can differ).
                // we get the kml content as text, but also any other content (as text)
                entries[ind].getData(/* writer, onend, onprogress, checkCrc32 */
                  new jsZip.zip.TextWriter(),
                  extendedCallback(str, id, callback, entries, node),
                  (current, total) => {
                    // onprogress callback
                    // if (App4Sea.logging) console.log(`TextWriter in unzipFromBlob ${str} Total: ${total.toString()}, Current: ${current}`);
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
  // Load kml content and return as Vector
  // See https://developers.google.com/kml/documentation/kmlreference
  function loadKmlText(text, id, path, node) {
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

    const vector = new VectorLayer({
      source: new Vector({
        crossOrigin: 'anonymous',
        format: formatter,
      }),
    });

    if (node && node.a_attr) {
      const { opacity } = node.a_attr;
      const op = parseInt(opacity, 10) / 100.0;
      if (op) vector.setOpacity(op);
    }

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

      // if (App4Sea.logging) console.log(`Extent: ${extent}, proj: ${prx}, ext: ${ext}`);
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
      default:
        if (App4Sea.logging) console.log(`addStyleMap for ${node.nodeName} is not defined`);
        break;
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
  // Function to ease KML feature reading
  function addKMLFeatures(text, path, id, node) {
    if (App4Sea.logging) console.log(`>>> addKMLFeatures: ${path}`);

    if (path.endsWith('kml')) {
      // if (App4Sea.logging) console.log(text); // log the whole kml file
      loadKmlText(text, id, path, node);

      if (App4Sea.logging) console.log(`addKMLFeatures: ${id} in file ${path} DONE`);
    }

    if (App4Sea.logging) console.log('<<< addKMLFeatures');
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
  function parseKmlText(path, text, id, entries, node) {
    if (App4Sea.logging) console.log(`parseKmlText: ${path}`);
    const oParser = new DOMParser();
    const oDOM = oParser.parseFromString(text, 'text/xml');
    const links = oDOM.querySelectorAll('NetworkLink > Link > href');
    const urls = oDOM.querySelectorAll('NetworkLink > Url > href');

    // Collect data for animation of GrounOverlay
    const [canAnimate, gol, goll] = App4Sea.Animation.aniDataForGroundOverlay(oDOM, path, id, title);
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

    function getContentType(filename) {
      const contentTypesByExtension = {
        css: 'text/css',
        js: 'application/javascript',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        html: 'text/html',
        htm: 'text/html',
      };

      const tokens = filename.split('.');
      const extension = tokens[tokens.length - 1];
      return contentTypesByExtension[extension] || 'text/plain';
    }

    // //////////////////////////////////////////////////////////////////////////
    function addOverlay(overlay, id0, mynode) {
      //----------------------------------------------------------------------
      function loadImageFromKmz(ent1, url1, ext1, prj1, nam1, id1, leg1, nod1) {
        const extendedCallback = function (ur, ex, pr, nm, en, id2, le) {
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
                if (nod1 && nod1.a_attr) {
                  const { opacity } = nod1.a_attr;
                  const op = parseInt(opacity, 10) / 100.0;
                  if (op) image.setOpacity(op);
                }

                // if (App4Sea.logging) console.log(`Pushing image to: ${ex}`);
                App4Sea.OpenLayers.layers.push({ id: id2, vector: image });
                if (App4Sea.logging) console.log(`Added image ${id2}=${nm} from kmz. Cached layers now are ${App4Sea.OpenLayers.layers.length}: ${ur}`);

                App4Sea.OpenLayers.Map.addLayer(image);

                App4Sea.Utils.LookAt(image);
              } else if (App4Sea.logging) console.log('No image created from kmz');
            }
          };
        };

        ent1.getData(
          new jsZip.zip.BlobWriter(getContentType(url1)),
          extendedCallback(url1, ext1, prj1, nam1, ent1, id1, leg1),
          (current, total) => {
            // onprogress callback
            // if (App4Sea.logging) console.log(`BlobWriter in loadImageFromKmz ${nam1} Total: ${total.toString()}, Current: ${current}`);
            // if (current === 524288) {
            //  const somethingiswrong = true;
            // }
          },
        );
      }

      //----------------------------------------------------------------------
      function findIn(filesInKmz, url_, ext, prj_, nam, ide, isLeg, nod) {
        let found = false;
        for (let ind = 0; ind < filesInKmz.length; ind++) {
          if (filesInKmz[ind].filename === url_) {
            loadImageFromKmz(filesInKmz[ind], url_, ext, prj_, nam, ide, isLeg, nod);
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
            findIn(entries, url, null, null, nameIs, id0, true, null);
          } else addLegend(title, url);
        }
      } else if (overlay.nodeName === 'PhotoOverlay') {
      //----------------------------------------------------------------------
        if (App4Sea.logging) console.log(`PhotoOverlay: ${url}`);
      } else { // GroundOverlay
      //----------------------------------------------------------------------
        if (App4Sea.logging) console.log(`GroundOverlay: ${url}`);

        url = url.replaceAll(/&amp;/, '&');

        const west = parseFloat(overlay.querySelector('west').innerHTML);
        const south = parseFloat(overlay.querySelector('south').innerHTML);
        const east = parseFloat(overlay.querySelector('east').innerHTML);
        const north = parseFloat(overlay.querySelector('north').innerHTML);

        const viewExtent = olproj.transformExtent([west, south, east, north], App4Sea.prefProj, App4Sea.prefViewProj);
        if (App4Sea.logging) console.log(`GroundOverlay: W:${west} S:${south} E:${east} N:${north} Pro:${App4Sea.prefProj} ViewProj:${App4Sea.prefViewProj}`);

        let image;
        if (!url.startsWith('http') && entries && entries.length > 1) {
          if (App4Sea.logging) console.log(`Getting image ${id0} from kmz: ${url}`);

          const { projection } = mynode.a_attr;

          if (projection === App4Sea.prefViewProj) {
            findIn(entries, url, viewExtent, App4Sea.prefViewProj, nameIs, id0, false, node);
          } else {
            findIn(entries, url, [west, south, east, north], App4Sea.prefProj, nameIs, id0, false, node);
          }
        } else {
          if (App4Sea.logging) console.log(`Getting image ${id0} from url: ${url}`);

          // ImageStatic does not support wrapX, so images will only be shown in the first revelation around
          // the origin (https://github.com/openlayers/openlayers/issues/7288).
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
            if (mynode && mynode.a_attr) {
              const { opacity } = mynode.a_attr;
              const op = parseInt(opacity, 10) / 100.0;
              if (op) image.setOpacity(op);
            }

            App4Sea.OpenLayers.layers.push({ id, vector: image });
            if (App4Sea.logging) console.log(`Added image from url. Cached layers now are ${App4Sea.OpenLayers.layers.length}: ${url}`);

            App4Sea.OpenLayers.Map.addLayer(image);
            App4Sea.Utils.LookAt(image);
          }
        }
      }
    }

    // //////////////////////////////////////////////////////////////////////////
    function listChildren(id3, children, nod) {
      for (let cind = 0; cind < children.length; cind++) {
        const child = children[cind];
        let newId;

        const timestamp = new Date().toLocaleString();
        // if (App4Sea.logging) console.log(`${timestamp} Item handled: ${child.nodeName}`);

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
            newId = addChild('Description', txt, $('#TreeMenu'), id3, false, 'icons/description.png');
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
          newId = addChild('Author', authText, $('#TreeMenu'), id3, false, 'icons/author.png');
        } else if (child.nodeName === 'Folder'
                        || child.nodeName === 'Document') {
          newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id3, true, 'icons/folder.png');
        } else if (child.nodeName === 'Camera') {
          let elems;

          elems = child.getElementsByTagName('longitude');
          const lon = parseFloat(elems[0].textContent);

          elems = child.getElementsByTagName('latitude');
          const lat = parseFloat(elems[0].textContent);

          elems = child.getElementsByTagName('altitude');
          const alt = parseFloat(elems[0].textContent);

          // let center = olproj.transform([lon, lat], App4Sea.prefProj, App4Sea.prefViewProj);//'EPSG:3857');
          const zoom = App4Sea.Utils.altitudeToZoom(alt);

          App4Sea.Utils.FlyTo([lon, lat], null);
          // let view = App4Sea.OpenLayers.Map.getView();
          // view.setCenter(center);
          // view.setZoom(zoom);

          if (App4Sea.logging) console.log(`Camera set to lon=${lon} lat=${lat} alt=${alt}m zoom=${zoom}`);
        } else if (child.nodeName === 'Placemark') { // Can move this later to a selectable section TBD
          newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id3, true, 'icons/placemark.png');
        } else if (child.nodeName === 'GroundOverlay'
                        || child.nodeName === 'PhotoOverlay'
                        || child.nodeName === 'ScreenOverlay') {
          newId = addChild(getName(child.children, child.nodeName), child.innerHTML, $('#TreeMenu'), id3, false, 'icons/overlay.png');
          addOverlay(child, newId, nod);

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
          // if (App4Sea.logging) console.log("Not handling Style attributes: " + child.nodeName + ": " + child.id3);
          //    function addStyleMap (parentId, node) {

          newId = addStyleMap(id3, child);
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

        if (newId && child.children && child.children.length > 0) {
          const predecessors = [];
          let par = child.parentNode;
          while (par) {
            predecessors.push(par);
            par = par.parentNode;
          }
          if (predecessors && predecessors.length < 4) {
            listChildren(newId, child.children, node);
          }
        }
      }

      // if (App4Sea.logging) console.log(`The children count is  ${children.length}`);
    }

    if (kml) {
      listChildren(id, kml.children, node);

      if (canAnimate) App4Sea.Animation.Animate(path, title, id);
    }

    let files = Array.prototype.slice.call(links).map((el) => el.textContent);

    if (links.length === 0 && urls.length !== 0) {
      files = Array.prototype.slice.call(urls).map((el) => el.textContent);
    }

    if (App4Sea.logging) console.log(`NetworkLink files: ${files.length}`);

    return files;// , canAnimate;//, gol, golw, golb, gole;
  }

  // //////////////////////////////////////////////////////////////////////////
  // Read a KML and add any features to the vector layer recursively
  // This call will either be called with a kml file or the individual entries (as text)
  // from the entries in the kmz file (of which the doc.kml file is one).
  const readAndAddFeatures = function (text, path, id, entries, no) {
    if (App4Sea.logging) console.log(`readAndAddFeatures >>>> ${path} from file ${id}`);

    const str = path.toLowerCase();

    if (str.endsWith('kml')) {
      addKMLFeatures(text, str, id, no); // TBD this is used for simple kml data (placemarks and vectors). Should do all locally

      const listFilesNested = parseKmlText(path, text, id, entries, no);
      if (App4Sea.logging) console.log(`listFilesNested are ${listFilesNested.length}`);

      listFilesNested.forEach((el) => {
        if (App4Sea.logging) console.log('readAndAddFeatures ----------');
        // Nested calls. Acceptable for a demo
        // but could be "promisified" instead
        // eslint-disable-next-line no-use-before-define
        repeat_kml_kmz_calls(el, id, no);
      });
    } else {
      // /addKMLFeatures(text, str, id, no);
    }
    if (App4Sea.logging) console.log('readAndAddFeatures <<<<');
  };

  // //////////////////////////////////////////////////////////////////////////
  // Recursion
  function repeat_kml_kmz_calls(url, id, node) {
    // make the ajax call to kmz that unzip and read the file
    // this file reference other KMZ so we call each of them
    // and add their content
    const str = url.toLowerCase();
    if (App4Sea.logging) console.log(str);
    if (str.endsWith('kmz')) {
      if (App4Sea.logging) console.log(`readAndAddFeatures kmz element: ${url}`);
      ajaxKMZ(url, id, unzipFromBlob(readAndAddFeatures, id, node), node);
    } else {
      if (App4Sea.logging) console.log(`readAndAddFeatures non-kmz element: ${url}`);
      ajaxKMZ(url, id, readAndAddFeatures, node);// kml
    }
  }

  // //////////////////////////////////////////////////////////////////////////
  // load kmz or kml and recurse through nested files
  // See https://developers.google.com/kml/documentation/kmzarchives
  my.loadKmlKmz = function (url, id, name, node) {
    if (App4Sea.logging) console.log(`loadKmz: ${id} from ${url}`);
    title = name;
    repeat_kml_kmz_calls(url, id, node);
  };

  return my;
}());
App4Sea.KML = App4SeaKML;
