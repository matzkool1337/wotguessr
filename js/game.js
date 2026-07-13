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
    // Prefer a distinct map per round for variety; fall back to repeats if the
    // scenery pool is small. One random scenery is chosen per selected map.
    var maps = shuffle(cfg.maps);
    var chosen = [];
    var count = Math.min(cfg.rounds, maps.length);

    for (var i = 0; i < count; i++) {
      var map = maps[i];
      var pool = cfg.scenery.filter(function (s) { return s.mapId === map.id; });
      if (!pool.length) continue;
      chosen.push({ scenery: pool[Math.floor(Math.random() * pool.length)], map: map });
    }

    // If we still need more rounds than distinct maps, top up from the full pool.
    while (chosen.length < cfg.rounds) {
      var s = cfg.scenery[Math.floor(Math.random() * cfg.scenery.length)];
      chosen.push({ scenery: s, map: WG.mapById[s.mapId] });
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
      // Real photo supplied.
      box.style.backgroundImage = 'url("' + scenery.image + '")';
      box.style.backgroundSize = 'cover';
      box.style.backgroundPosition = 'center';
      el.sceneryDummyTag.hidden = true;
    } else {
      // Dummy: zoom into the map cover around the hidden answer point.
      var z = cfg.dummyZoom;
      box.style.backgroundImage = 'url("' + map.image + '")';
      box.style.backgroundSize = (z * 100) + '%';
      box.style.backgroundPosition = bgPos(scenery.x, z) + '% ' + bgPos(scenery.y, z) + '%';
      el.sceneryDummyTag.hidden = false;
    }
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
      var row = document.createElement('div');
      row.className = 'breakdown__row';

      var detail;
      if (!r.mapCorrect) {
        detail = 'Wrong map (picked ' + (r.pickedMap ? r.pickedMap.name : '—') + ')';
      } else {
        detail = Math.round(r.distMeters) + ' m away';
      }

      row.innerHTML =
        '<span class="breakdown__idx">' + (i + 1) + '</span>' +
        '<span class="breakdown__map">' + r.correctMap.name + '</span>' +
        '<span class="breakdown__detail">' + detail + '</span>' +
        '<span class="breakdown__score">' + r.score + '</span>';
      el.breakdown.appendChild(row);
    });

    updateHud();
    showScreen('gameover');
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
