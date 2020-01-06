/* ==========================================================================
 * (c) 2018 Þorsteinn Helgi Steinarsson     thorsteinn(at)asverk.is
 *          Gaute Hope                      gaute.hope(at)met.no
 *
 * ========================================================================== */

import App4Sea from './App4Sea';

const App4SeaAnimation = (function () {
  const my = {};

  // //////////////////////////////////////////////////////////////////////////
  // Animate
  my.Animate = function (url, name) {
    if (state !== 'Stopped') TryStop();
    state = 'Stopped';

    if (App4Sea.logging) console.log(`Now animating ${url}`);
    if (App4Sea.logging) console.log(`   with title ${name}`);

    const ext = url.substr(url.length - 3, 3).toLowerCase();
    if (ext !== 'kml' && ext !== 'kmz' && ext !== 'wms') {
      return;
    }

    count = my.AniData[golLink].length;

    if (count < 2) {
      return;
    }

    const selector = document.getElementById('AniDataSelect');

    for (let i = 0; i < selector.length; i++) {
      if (selector.options[i].text == 'No data available') selector.remove(i);
    }

    const opt = document.createElement('option');
    opt.innerHTML = name;
    selector.appendChild(opt);
    selector.value = name;
  };

  // //////////////////////////////////////////////////////////////////////////
  // aniDataForGroundOverlay
  my.aniDataForGroundOverlay = function (oDOM) {
    // Collect data for animation of GrounOverlay
    let canAnimate = false;
    const gol = oDOM.querySelectorAll('GroundOverlay > Icon > href');
    let golw = []; // when
    let golb = []; // begin
    let gole = []; // end
    const goll = []; // layerID
    let golw_ = []; // when NodeListOf<Element>
    let golb_ = []; // begin NodeListOf<Element>
    let gole_ = []; // end NodeListOf<Element>
    if (gol.length > 1) {
      canAnimate = true;
      golw = oDOM.querySelectorAll('GroundOverlay > TimeStamp > when');
      if (golw.length === 0) {
        golb_ = oDOM.querySelectorAll('GroundOverlay > TimeSpan > begin');
        gole_ = oDOM.querySelectorAll('GroundOverlay > TimeSpan > end');
        for (let ind = 0; ind < golb_.length; ind++) {
          golb.push(golb_[ind].innerHTML);
          gole.push(gole_[ind].innerHTML);
        }
        golw_ = [];
      } else {
        for (let ind = 0; ind < golw_.length; ind++) {
          golw.push(golw_[ind].innerHTML);
        }
        golb = [];
        gole = [];
      }

      my.AniData = [gol, golw, golb, gole, goll];
    } else my.AniData = [null, null, null, null, null];

    return [canAnimate, gol, goll];
  };

  // //////////////////////////////////////////////////////////////////////////
  // aniDataForWMS
  my.aniDataForWMS = function (url, stepHours, count) {
    // Collect data for animation of WMS
    let canAnimate = false;
    const [gol, golw, golb, gole, goll] = getWMSlist(url, stepHours, count);
    if (gol.length > 1) {
      canAnimate = true;
      my.AniData = [gol, golw, golb, gole, goll];
    } else my.AniData = [null, null, null, null, null];

    return [canAnimate, gol, golb, goll];
  };

  // //////////////////////////////////////////////////////////////////////////
  // http://halo-wms.met.no/halo/default.map?service=WMS&version=1.3.0&REQUEST=GetMap&LAYERS=sea_significant_wave_height&FORMAT=image%2Fpng
  // &STYLES=&CRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=512&HEIGHT=512&TIME=2019-12-05T07:00Z
  // getWMSlist
  function getWMSlist(url, stepHours, count) {
    const gol = [];
    const golw = []; // when NodeListOf<Element>
    const golb = []; // begin
    const gole = []; // end
    const goll = []; // layerID

    const date = new Date();
    let hours = date.getHours();
    hours -= (hours % stepHours);
    date.setMinutes(0);
    date.setSeconds(0);
    // date.setMilliseconds(0);
    for (let ind = 0; ind < count; ind++) {
      const dateB = new Date(date.toString());
      dateB.setHours(hours);
      let dateStringB = dateB.toISOString();
      dateStringB = dateStringB.substring(0, dateStringB.length - 5);
      golb.push(dateStringB);

      golw.push(dateStringB);
      const newUrl = `${url}&TIME=${dateStringB.substring(0, dateStringB.length - 3)}Z`;
      gol.push(newUrl);
      goll.push(ind.toString()); // temporary index
      hours += stepHours;

      const dateE = new Date(date.toString());
      dateE.setHours(hours);
      let dateStringE = dateE.toISOString();
      dateStringE = dateStringE.substring(0, dateStringE.length - 5);
      gole.push(dateStringE);
    }

    return [gol, golw, golb, gole, goll];
  }

  // //////////////////////////////////////////////////////////////////////////
  // getAnimationState
  my.getAnimationState = function () {
    return state;
  };

  // //////////////////////////////////////////////////////////////////////////
  // initInfo
  function initInfo() {
    const cut = 8;

    let el = document.getElementById('start');
    el.innerHTML = startDate.substr(startDate.length - cut, cut);
    el = document.getElementById('current');
    el.innerHTML = currentDate.substr(currentDate.length - cut, cut);
    el = document.getElementById('end');
    el.innerHTML = endDate.substr(endDate.length - cut, cut);

    el = document.getElementById('startDate');
    el.innerHTML = startDate.substr(0, cut + 2);
    el = document.getElementById('currentDate');
    el.innerHTML = currentDate.substr(0, cut + 2);
    el = document.getElementById('endDate');
    el.innerHTML = endDate.substr(0, cut + 2);
  }

  // //////////////////////////////////////////////////////////////////////////
  // updateInfo
  function updateInfo() {
    // Updage time stamps
    let el = document.getElementById('current');
    if (el === 'undefined') return;

    el.innerHTML = currentDate.substr(currentDate.length - 8, 8);

    el = document.getElementById('currentDate');
    el.innerHTML = currentDate.substr(0, 10);
    let layerid = my.AniData[golLayerID][anindex];
    //        let lind = findLayerIndex(layerid);
    const remember = 1;

    // if (App4Sea.logging) console.log(my.AniData[golLink][anindex]);
    // if (App4Sea.logging) console.log(layerid);

    // Check if layer is active (layer is assumed to exist)
    App4Sea.TreeMenu.Checkbox(layerid, true);

    // Find last index that should be active
    let lastanindex = anindex - remember;
    while (lastanindex < 0) lastanindex += count;

    // Make last inactive
    layerid = my.AniData[golLayerID][lastanindex];
    App4Sea.TreeMenu.Checkbox(layerid, false);

    // Update progress
    progress.value = anindex * 100 / (count - 1);

    // Next id
    anindex += 1;
    if (anindex === count) anindex = 0;
  }

  // //////////////////////////////////////////////////////////////////////////
  // findLayerIndex
  function findLayerIndex(lind) {
    for (let ynd = 0; ynd < App4Sea.OpenLayers.layers.length; ynd++) {
      const item = App4Sea.OpenLayers.layers[ynd];
      if (item.id === lind) {
        return ynd;
      }
    }

    return -1;
  }

  // //////////////////////////////////////////////////////////////////////////
  // timeElapsed
  function timeElapsed() {
    if (state !== 'Playing') {
      TryStop();
      state = 'Stopped';
      return;
    }

    if (timerId === null || my.AniData[golLink] === null) {
      TryStop();
      state = 'Stopped';
      return;
    }

    if (my.AniData[golWhen].length !== 0) {
      currentDate = my.AniData[golWhen][anindex];
    } else {
      currentDate = my.AniData[golBegin][anindex];
    }

    updateInfo();
  }

  // //////////////////////////////////////////////////////////////////////////
  // MoreSpeed
  my.MoreSpeed = function () {
    if (frameRate < 30.01) {
      frameRate += 1;

      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = window.setInterval(timeElapsed, 1000 / frameRate);
      }
    }
  };

  // //////////////////////////////////////////////////////////////////////////
  // LessSpeed
  my.LessSpeed = function () {
    if (frameRate > 1.99) {
      frameRate -= 1;

      if (timerId !== null) {
        window.clearInterval(timerId);
        timerId = window.setInterval(timeElapsed, 1000 / frameRate);
      }
    }
  };

  // //////////////////////////////////////////////////////////////////////////
  // PlayStop
  // Statuses Events++
  // ------------------------------------------------------------
  // Stopped  Play, New Data, Error, Refresh, +++ (Possibly Play)
  // Playing  Stop, New Data, Error, Refresh, +++ (Possibly Stop)
  my.PlayStop = function () {
    // We ignore this event if status in not either Playing or Stopped
    if (state !== 'Stopped' && state !== 'Playing') return;

    state = 'Transition';
    // Establish formal status (as indicated by icon in use)
    const isStopped = playstop.classList.contains('fa-play');

    if (isStopped) { // Are stopped shall play
      // Make sure all is stopped before we begin
      TryStop();
      // Do not set state to Stopped. We are in stopping state:
      // Now timer is stopping and icon is ready to play. timerId is null.

      // Prepare data while we are in a safe state
      Prepare();

      playstop.classList.remove('fa-play');
      playstop.classList.add('fa-stop');

      // StartTimer
      timerId = window.setInterval(timeElapsed, 1000 / frameRate);
      state = 'Playing';
    } else { // Are playing, shall stop
      TryStop();
      state = 'Stopped';
    }
  };

  // //////////////////////////////////////////////////////////////////////////
  // Prepare
  let Prepare = function () {
    if (count !== 0) {
      // Turn off all the layer images
      for (let aind = 0; aind < count; aind++) {
        App4Sea.TreeMenu.Checkbox(my.AniData[golLayerID][aind], false);
      }

      if (my.AniData[golWhen].length !== 0) {
        startDate = my.AniData[golWhen][0];
        endDate = my.AniData[golWhen][my.AniData[1].length - 1];
      } else {
        startDate = my.AniData[golBegin][0];
        endDate = my.AniData[golEnd][my.AniData[golEnd].length - 1];
      }
      currentDate = startDate;

      initInfo();
    }
  };

  // //////////////////////////////////////////////////////////////////////////
  // TryStop
  let TryStop = function () {
    state = 'Stopping';

    // StopTimer
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }

    playstop.classList.remove('fa-stop');
    playstop.classList.add('fa-play');
  };

  // //////////////////////////////////////////////////////////////////////////
  // Progress
  my.Progress = function () {
    if (count === undefined) return;
    anindex = parseInt(0.5 + progress.value * count / 100);
    TryStop();
    state = 'Stopped';
    Prepare();
    updateInfo();
  };

  // ////////////////////////////////////////////////////////////////////////
  // Members
  my.AniData = [[], [], [], [], []];// [gol, golw, golb, gole, goll]

  const golLink = 0;// Ground Overlay Link (index into AniData)
  const golWhen = 1;// when
  const golBegin = 2;// begin
  const golEnd = 3;// end
  const golLayerID = 4;// LayerID

  let state = 'Stopped';
  let count;
  let endDate;
  let startDate;
  let currentDate;
  let frameRate = 1; // frames per second
  let timerId = null;
  let anindex = 0;

  const playstop = document.getElementById('playstop');
  const progress = document.getElementById('progress');
  progress.addEventListener('input', my.Progress, false, { passive: true });
  progress.addEventListener('touch', my.Progress, false, { passive: true });

  return my;
}());
App4Sea.Animation = App4SeaAnimation;
