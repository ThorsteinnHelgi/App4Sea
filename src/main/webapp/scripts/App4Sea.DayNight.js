/* ==========================================================================
 * (c) 2020 Gaute Hope  gauteh@met.no
 *
 * ========================================================================== */

import DayNight from 'ol-ext/source/DayNight';
import VectorLayer from 'ol/layer/Vector';
import { Style, Fill } from 'ol/style';

import App4Sea from './App4Sea';

const App4SeaDN = (function () {
  const dn = new DayNight({});
  const vl = new VectorLayer({
    source: dn,
    opacity: 0.5,
    style: new Style({
      fill: new Fill({
        color: [0, 0, 0],
      }),
    }),
  });

  const my = { loaded: false, enabled: false, layer: vl };

  my.enable = function () {
    if (!my.loaded) {
      App4Sea.OpenLayers.Map.addLayer(vl);
      my.loaded = true;
    }

    my.layer.setVisible(true);
    my.enabled = true;
  };

  my.disable = function () {
    my.layer.setVisible(false);
    my.enabled = false;
  };

  my.toggle = function () {
    if (my.enabled) {
      my.disable();
    } else {
      my.enable();
    }
  };

  return my;
}());

App4Sea.DayNight = App4SeaDN;
