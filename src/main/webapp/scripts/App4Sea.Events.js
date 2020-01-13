/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 * Global event handlers
 * ========================================================================== */

import App4Sea from './App4Sea';


$(document).ready(() => {
  if (App4Sea.logging) console.log('Document ready');

  if (App4Sea.logging) console.log(App4Sea.OpenLayers);
  // Init Map.OpenLayers
  App4Sea.OpenLayers.Init();

  // Hook click event to MenuItem
  $('.MenuItem').click(function () {
    if (App4Sea.logging) console.log('MenuItem click');

    const url = $(this).attr('data-url');
    const target = $(this).attr('data-target');
    window.open(url, target);
  });
});

$(window).on('load', () => {
  if (App4Sea.logging) console.log('Window load');

  setTimeout(function () {
    if (App4Sea.logging) console.log("setTimeout");

    $("#splash-overlay").fadeOut();
  }, 2000);

  const info = $('#ToolTipInfo');

  info.tooltip('hide');
  info.tooltip({
    animation: false,
    trigger: 'manual',
  });
});

$(window).on('resize', () => {
  // if (App4Sea.logging) console.log( "Window resize" );

  const place = document.getElementById('ControlPlaceInMap');

  if (window.innerWidth < 500) {
    place.style.left = 0;
    place.transform = null;
  } else {
    place.style.left = null;
    place.transform = 'translate(-50%, 0%)';
  }

  const trans = (place.clientWidth / 2 + 0.5);
  if (place.offsetLeft - trans > window.innerWidth - 40) {
    place.style.left = `${window.innerWidth - 40 + trans}px`;
  }
});

// //////////////////////////////////////////////////////////////////////////
// Overwrite console.log (for use while debugging on mobile)
// (function () {
//    "use strict";
//     let old = console.log;
//     const logger = document.getElementById('Log');
//     console.log = function (message) {
//         if (typeof message == 'object') {
//             logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + '<br />';
//         } else {
//             logger.innerHTML += message + '<br />';
//         }
//     }
// })();
