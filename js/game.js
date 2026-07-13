/*
 * WoT GeoGuessr — game controller / state machine
 * -----------------------------------------------
 * Screens: landing -> guess -> (pinpoint) -> result -> ... -> gameover
 *   guess    : scenery photo + pick one of 6 maps
 *   pinpoint : ONLY when the map guess is correct; drop a marker on the map
 *   result   : reveal actual location, distance & round score
 *   gameover : total score + per-round breakdown
 */
(function () {
  'use strict';

  var cfg = WG.config;
  var scoring = WG.scoring;

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  var state = {
    rounds: [],        // [{ scenery, map }]
    roundIndex: 0,
    results: [],       // finished round results
    // per-round working data:
    selectedMapId: null,
    guess: null,       // { x, y } normalised, or null
  };

  var el = {}; // cached DOM references

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function showScreen(name) {
    document.body.setAttribute('data-screen', name);
    window.scrollTo(0, 0);
  }

  /* Background-position (%) that centres image fraction `f` at zoom `scale`. */
  function bgPos(f, scale) {
    return clamp((0.5 - f * scale) / (1 - scale), 0, 1) * 100;
  }

  /* ------------------------------------------------------------------ *
   * Round setup
   * ------------------------------------------------------------------ */
  function buildRounds() {
    // Group the available scenery by map (maps without photos are simply absent).
    var byMap = {};
    cfg.scenery.forEach(function (s) { (byMap[s.mapId] || (byMap[s.mapId] = [])).push(s); });

    var chosen = [];
    var used = {};

    // Pass 1 — one distinct map per round for variety (random scene from each).
    shuffle(Object.keys(byMap)).forEach(function (mapId) {
      if (chosen.length >= cfg.rounds) return;
      var pick = shuffle(byMap[mapId])[0];
      used[pick.id] = true;
      chosen.push({ scenery: pick, map: WG.mapById[mapId] });
    });

    // Pass 2 — fill remaining rounds with other unused scenes (no repeats yet).
    shuffle(cfg.scenery).forEach(function (s) {
      if (chosen.length >= cfg.rounds || used[s.id]) return;
      used[s.id] = true;
      chosen.push({ scenery: s, map: WG.mapById[s.mapId] });
    });

    // Pass 3 — only if there are fewer total scenes than rounds, allow repeats.
    while (chosen.length < cfg.rounds && cfg.scenery.length) {
      var s2 = cfg.scenery[Math.floor(Math.random() * cfg.scenery.length)];
      chosen.push({ scenery: s2, map: WG.mapById[s2.mapId] });
    }

    return shuffle(chosen).slice(0, cfg.rounds);
  }

  function startGame() {
    state.rounds = buildRounds();
    state.roundIndex = 0;
    state.results = [];
    loadRound();
  }

  function currentRound() { return state.rounds[state.roundIndex]; }

  function loadRound() {
    state.selectedMapId = null;
    state.guess = null;

    var round = currentRound();
    renderScenery(round.scenery);
    renderMapPicker();
    updateHud();
    showScreen('guess');
  }

  /* ------------------------------------------------------------------ *
   * Screen: guess (scenery + map picker)
   * ------------------------------------------------------------------ */
  function renderScenery(scenery) {
    var map = WG.mapById[scenery.mapId];
    var box = el.sceneryImage;

    if (scenery.image) {
      // Real photo, shown at its native tone (no brightening/saturation).
      box.style.backgroundImage = 'url("' + scenery.image + '")';
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
      box.style.filter = '';
      box.dataset.src = scenery.image;
      el.sceneryDummyTag.hidden = true;
      verifyImage(scenery.image);
    } else {
      // Dummy: zoom into the map cover around the hidden answer point.
      var z = cfg.dummyZoom;
      box.style.backgroundImage = 'url("' + map.image + '")';
      box.style.backgroundSize = (z * 100) + '%';
      box.style.backgroundPosition = bgPos(scenery.x, z) + '% ' + bgPos(scenery.y, z) + '%';
      box.style.filter = '';
      box.dataset.src = '';
      el.sceneryDummyTag.hidden = false;
      hideSceneryError();
    }
  }

  function hideSceneryError() { if (el.sceneryError) el.sceneryError.hidden = true; }

  /* Load the photo once just to flag a missing/broken path. */
  function verifyImage(src) {
    hideSceneryError();
    var probe = new Image();
    probe.onerror = function () {
      if (!el.sceneryError || el.sceneryImage.dataset.src !== src) return;
      el.sceneryError.textContent = '⚠ Image not found — check the path in config.js:\n' + src;
      el.sceneryError.hidden = false;
    };
    probe.src = src;
  }

  function renderMapPicker() {
    el.mapGrid.innerHTML = '';
    cfg.maps.forEach(function (map) {
      var btn = document.createElement('button');
      btn.className = 'map-card';
      btn.type = 'button';
      btn.setAttribute('data-map', map.id);
      btn.innerHTML =
        '<span class="map-card__thumb" style="background-image:url(&quot;' + map.image + '&quot;)"></span>' +
        '<span class="map-card__name">' + map.name + '</span>';
      btn.addEventListener('click', function () { onMapPicked(map.id); });
      el.mapGrid.appendChild(btn);
    });
  }

  function onMapPicked(mapId) {
    state.selectedMapId = mapId;
    var round = currentRound();
    if (mapId === round.scenery.mapId) {
      enterPinpoint(); // correct map -> pinpoint step
    } else {
      finishRound(null); // wrong map -> 0 points, straight to reveal
    }
  }

  /* ------------------------------------------------------------------ *
   * Screen: pinpoint (drop marker on the correct map)
   * ------------------------------------------------------------------ */
  function enterPinpoint() {
    var map = currentRound().map;
    el.pinpointTitle.textContent = 'Where on ' + map.name + '?';
    el.pinpointMap.style.backgroundImage = 'url("' + map.image + '")';

    // reset marker
    state.guess = null;
    el.pinpointMarker.hidden = true;
    el.submitGuess.disabled = true;

    showScreen('pinpoint');
  }

  function onStageClick(ev) {
    var rect = el.pinpointStage.getBoundingClientRect();
    var x = clamp((ev.clientX - rect.left) / rect.width, 0, 1);
    var y = clamp((ev.clientY - rect.top) / rect.height, 0, 1);
    state.guess = { x: x, y: y };

    el.pinpointMarker.style.left = (x * 100) + '%';
    el.pinpointMarker.style.top = (y * 100) + '%';
    el.pinpointMarker.hidden = false;
    el.submitGuess.disabled = false;
  }

  function onSubmitGuess() {
    if (!state.guess) return;
    finishRound(state.guess);
  }

  /* ------------------------------------------------------------------ *
   * Finish a round & compute score
   * ------------------------------------------------------------------ */
  function finishRound(guess) {
    var round = currentRound();
    var scenery = round.scenery;
    var correctMap = WG.mapById[scenery.mapId];
    var mapCorrect = state.selectedMapId === scenery.mapId;

    var result = {
      scenery: scenery,
      correctMap: correctMap,
      pickedMap: WG.mapById[state.selectedMapId],
      mapCorrect: mapCorrect,
      guess: guess,
      distNorm: null,
      distMeters: null,
      score: 0,
    };

    if (mapCorrect && guess) {
      result.distNorm = scoring.distanceNorm(guess.x, guess.y, scenery.x, scenery.y);
      result.distMeters = scoring.distanceMeters(result.distNorm, correctMap.sizeMeters);
      result.score = scoring.score(result.distNorm);
    }

    state.results.push(result);
    renderResult(result);
    updateHud(); // reflect the new running total immediately
    showScreen('result');
  }

  /* ------------------------------------------------------------------ *
   * Screen: result (reveal)
   * ------------------------------------------------------------------ */
  function renderResult(r) {
    el.resultMap.style.backgroundImage = 'url("' + r.correctMap.image + '")';

    // Actual location marker (always shown).
    el.actualMarker.style.left = (r.scenery.x * 100) + '%';
    el.actualMarker.style.top = (r.scenery.y * 100) + '%';

    // Guess marker + connecting line (only when the player pinpointed).
    if (r.guess) {
      el.guessMarker.hidden = false;
      el.guessMarker.style.left = (r.guess.x * 100) + '%';
      el.guessMarker.style.top = (r.guess.y * 100) + '%';

      el.resultLine.hidden = false;
      var line = el.resultLine.querySelector('line');
      line.setAttribute('x1', r.guess.x * 100);
      line.setAttribute('y1', r.guess.y * 100);
      line.setAttribute('x2', r.scenery.x * 100);
      line.setAttribute('y2', r.scenery.y * 100);
    } else {
      el.guessMarker.hidden = true;
      el.resultLine.hidden = true;
    }

    // Headline + details
    if (!r.mapCorrect) {
      el.resultHeadline.textContent = 'Wrong map!';
      el.resultHeadline.className = 'result__headline result__headline--bad';
      el.resultDetail.innerHTML =
        'You picked <strong>' + (r.pickedMap ? r.pickedMap.name : '—') + '</strong>. ' +
        'It was <strong>' + r.correctMap.name + '</strong>.';
    } else {
      el.resultHeadline.textContent = scoring.rating(r.score);
      el.resultHeadline.className = 'result__headline result__headline--good';
      el.resultDetail.innerHTML =
        'Correct map: <strong>' + r.correctMap.name + '</strong> · ' +
        'You were <strong>' + Math.round(r.distMeters) + ' m</strong> away.';
    }

    el.resultScore.textContent = '+' + r.score;
    el.resultScoreMax.textContent = '/ ' + cfg.score.max;

    var last = state.roundIndex === cfg.rounds - 1;
    el.nextRound.textContent = last ? 'See results' : 'Next round';
  }

  function onNextRound() {
    if (state.roundIndex >= cfg.rounds - 1) {
      showGameOver();
    } else {
      state.roundIndex++;
      loadRound();
    }
  }

  /* ------------------------------------------------------------------ *
   * Screen: game over
   * ------------------------------------------------------------------ */
  function totalScore() {
    return state.results.reduce(function (sum, r) { return sum + r.score; }, 0);
  }

  function showGameOver() {
    var total = totalScore();
    var max = cfg.rounds * cfg.score.max;
    el.finalScore.textContent = total;
    el.finalScoreMax.textContent = '/ ' + max;

    el.breakdown.innerHTML = '';
    state.results.forEach(function (r, i) {
      el.breakdown.appendChild(buildSummaryRow(r, i));
    });

    updateHud();
    showScreen('gameover');
  }

  /* Crop rectangle (normalised) that frames the round's guess + actual points. */
  function cropView(r) {
    var pts = [{ x: r.scenery.x, y: r.scenery.y }];
    if (r.guess) pts.push({ x: r.guess.x, y: r.guess.y });
    var xs = pts.map(function (p) { return p.x; });
    var ys = pts.map(function (p) { return p.y; });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var span = Math.max(maxX - minX, maxY - minY);
    var S = clamp(span * 2.4 + 0.06, 0.16, 1);        // crop side: padding + a minimum zoom
    var cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    return { S: S, x0: clamp(cx - S / 2, 0, 1 - S), y0: clamp(cy - S / 2, 0, 1 - S) };
  }

  /* A small cropped map with the round's guess + actual markers (+ a connector). */
  function buildSummaryThumb(r) {
    var v = cropView(r);
    var thumb = document.createElement('div');
    thumb.className = 'sumrow__thumb';
    thumb.style.backgroundImage = 'url("' + r.correctMap.image + '")';
    thumb.style.backgroundSize = (100 / v.S) + '% ' + (100 / v.S) + '%';
    thumb.style.backgroundPosition = (v.S >= 1) ? '0% 0%'
      : (v.x0 / (1 - v.S) * 100) + '% ' + (v.y0 / (1 - v.S) * 100) + '%';

    function toPct(p) { return { x: (p.x - v.x0) / v.S * 100, y: (p.y - v.y0) / v.S * 100 }; }
    function addMarker(cls, p) {
      var pc = toPct(p);
      var m = document.createElement('div');
      m.className = 'tmarker ' + cls;
      m.style.left = pc.x + '%';
      m.style.top = pc.y + '%';
      thumb.appendChild(m);
    }

    var actual = { x: r.scenery.x, y: r.scenery.y };
    if (r.guess) {
      var g = toPct(r.guess), a = toPct(actual), NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'tline');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      var ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', g.x); ln.setAttribute('y1', g.y);
      ln.setAttribute('x2', a.x); ln.setAttribute('y2', a.y);
      svg.appendChild(ln);
      thumb.appendChild(svg);
      addMarker('tmarker--guess', r.guess);
    }
    addMarker('tmarker--actual', actual);
    return thumb;
  }

  function buildSummaryRow(r, i) {
    var row = document.createElement('div');
    row.className = 'sumrow';

    var thumb = buildSummaryThumb(r);
    var num = document.createElement('span');
    num.className = 'sumrow__num';
    num.textContent = i + 1;
    thumb.appendChild(num);

    var info = document.createElement('div');
    info.className = 'sumrow__info';
    var name = document.createElement('div');
    name.className = 'sumrow__map';
    name.textContent = r.correctMap.name;
    var detail = document.createElement('div');
    detail.className = 'sumrow__detail' + (r.mapCorrect ? '' : ' sumrow__detail--bad');
    detail.textContent = r.mapCorrect
      ? (Math.round(r.distMeters) + ' m away')
      : ('Wrong map — picked ' + (r.pickedMap ? r.pickedMap.name : '—'));
    info.appendChild(name);
    info.appendChild(detail);

    var score = document.createElement('div');
    score.className = 'sumrow__score';
    score.textContent = r.score;

    row.appendChild(thumb);
    row.appendChild(info);
    row.appendChild(score);
    return row;
  }

  /* ------------------------------------------------------------------ *
   * HUD
   * ------------------------------------------------------------------ */
  function updateHud() {
    el.hudRound.textContent = Math.min(state.roundIndex + 1, cfg.rounds) + ' / ' + cfg.rounds;
    el.hudScore.textContent = totalScore();
  }

  /* ------------------------------------------------------------------ *
   * Wiring
   * ------------------------------------------------------------------ */
  function cacheDom() {
    el.sceneryImage = $('scenery-image');
    el.sceneryDummyTag = $('scenery-dummy-tag');
    el.sceneryError = $('scenery-error');
    el.mapGrid = $('map-grid');

    el.pinpointTitle = $('pinpoint-title');
    el.pinpointStage = $('pinpoint-stage');
    el.pinpointMap = $('pinpoint-map');
    el.pinpointMarker = $('pinpoint-marker');
    el.submitGuess = $('submit-guess');

    el.resultMap = $('result-map');
    el.actualMarker = $('actual-marker');
    el.guessMarker = $('guess-marker');
    el.resultLine = $('result-line');
    el.resultHeadline = $('result-headline');
    el.resultDetail = $('result-detail');
    el.resultScore = $('result-score');
    el.resultScoreMax = $('result-score-max');
    el.nextRound = $('next-round');

    el.finalScore = $('final-score');
    el.finalScoreMax = $('final-score-max');
    el.breakdown = $('breakdown');

    el.hudRound = $('hud-round');
    el.hudScore = $('hud-score');
  }

  function bindEvents() {
    $('start-game').addEventListener('click', startGame);
    $('play-again').addEventListener('click', startGame);
    $('new-game').addEventListener('click', function () { showScreen('landing'); });
    el.pinpointStage.addEventListener('click', onStageClick);
    el.submitGuess.addEventListener('click', onSubmitGuess);
    el.nextRound.addEventListener('click', onNextRound);
  }

  function init() {
    cacheDom();
    bindEvents();
    updateHud();
    showScreen('landing');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
