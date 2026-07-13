/*
 * WoT GeoGuessr — game configuration & data
 * ------------------------------------------
 * Plain classic script (no ES modules) so the page also works when opened
 * directly from disk (file://) and needs zero build tooling on GitHub Pages.
 * Everything hangs off a single global namespace: window.WG
 */
window.WG = window.WG || {};

WG.config = {
  /* How many rounds make up one game. */
  rounds: 5,

  /* Scoring model (GeoGuessr-style exponential decay). All tunable. */
  score: {
    max: 5000,            // points for a perfect pinpoint
    decay: 0.15,          // smaller = steeper punishment for distance
    perfectRadius: 0.02,  // within 2% of the map size counts as a bullseye
  },

  /* Zoom factor used when a scenery entry has no real photo yet and we fake
   * one by cropping into the map cover around the answer location. */
  dummyZoom: 3.4,

  /* Auto-brightness for scenery photos. Dark in-game screenshots get lifted
   * toward `targetLuminance` (0–255); already-bright shots are left alone.
   * `fallbackBoost` is a flat lift used when pixels can't be measured
   * (e.g. opening index.html via file:// taints the canvas). All tunable. */
  sceneryTone: { targetLuminance: 125, maxBoost: 2.2, contrast: 1.06, saturate: 1.05, fallbackBoost: 1.25 },

  /*
   * The 6 maps. `sizeMeters` is the real in-game map edge length and is only
   * used to translate a guess distance into metres for display.
   * NOTE: these are best-guess defaults — please verify/adjust per map.
   */
  maps: [
    { id: 'cliff',       name: 'Cliff',       image: 'assets/maps/cliff.png',       sizeMeters: 1000 },
    { id: 'karelia',     name: 'Karelia',     image: 'assets/maps/karelia.png',     sizeMeters: 1000 },
    { id: 'outpost',     name: 'Outpost',     image: 'assets/maps/outpost.png',     sizeMeters: 1000 },
    { id: 'oyster_bay',  name: 'Oyster Bay',  image: 'assets/maps/oyster_bay.png',  sizeMeters: 1400 },
    { id: 'prokhorovka', name: 'Prokhorovka', image: 'assets/maps/prokhorovka.png', sizeMeters: 1000 },
    { id: 'redshire',    name: 'Redshire',    image: 'assets/maps/redshire.png',    sizeMeters: 1000 },
  ],

  /*
   * Scenery pool. Each entry is one possible round.
   *   mapId  — which map the photo was taken on (the correct answer)
   *   x, y   — normalised answer location on that map, 0..1, origin top-left
   *   image  — real scenery photo URL, or null to auto-generate a placeholder
   *            crop from the map cover at (x, y).
   *
   * IMPORTANT: image paths are web URLs — always use FORWARD slashes ("/"),
   * never Windows backslashes (in JS strings "\s" etc. silently corrupt the path).
   *
   * Cliff & Karelia have real photos. Add Outpost/Oyster Bay/Prokhorovka/Redshire
   * the same way (author.html makes this easy — see README).
   */
  scenery: [
    { id: 'cliff-01', mapId: 'cliff', x: 0.461, y: 0.017, image: 'assets/scenery/cliff/shot_009.jpg' },
    { id: 'cliff-02', mapId: 'cliff', x: 0.615, y: 0.208, image: 'assets/scenery/cliff/shot_010.jpg' },
    { id: 'cliff-03', mapId: 'cliff', x: 0.697, y: 0.531, image: 'assets/scenery/cliff/shot_011.jpg' },
    { id: 'cliff-04', mapId: 'cliff', x: 0.672, y: 0.699, image: 'assets/scenery/cliff/shot_012.jpg' },
    { id: 'cliff-05', mapId: 'cliff', x: 0.336, y: 0.427, image: 'assets/scenery/cliff/shot_013.jpg' },
    { id: 'cliff-06', mapId: 'cliff', x: 0.167, y: 0.579, image: 'assets/scenery/cliff/shot_014.jpg' },
    { id: 'cliff-07', mapId: 'cliff', x: 0.397, y: 0.975, image: 'assets/scenery/cliff/shot_015.jpg' },
    { id: 'cliff-08', mapId: 'cliff', x: 0.039, y: 0.819, image: 'assets/scenery/cliff/shot_017.jpg' },
    { id: 'cliff-09', mapId: 'cliff', x: 0.12,  y: 0.278, image: 'assets/scenery/cliff/shot_018.jpg' },
    { id: 'karelia-01', mapId: 'karelia', x: 0.158, y: 0.569, image: 'assets/scenery/karelia/shot_001.jpg' },
    { id: 'karelia-02', mapId: 'karelia', x: 0.36,  y: 0.192, image: 'assets/scenery/karelia/shot_002.jpg' },
    { id: 'karelia-03', mapId: 'karelia', x: 0.361, y: 0.004, image: 'assets/scenery/karelia/shot_004.jpg' },
    { id: 'karelia-04', mapId: 'karelia', x: 0.557, y: 0.143, image: 'assets/scenery/karelia/shot_005.jpg' },
    { id: 'karelia-05', mapId: 'karelia', x: 0.6,   y: 0.474, image: 'assets/scenery/karelia/shot_006.jpg' },
    { id: 'karelia-06', mapId: 'karelia', x: 0.68,  y: 0.719, image: 'assets/scenery/karelia/shot_007.jpg' },
    { id: 'karelia-07', mapId: 'karelia', x: 0.987, y: 0.3,   image: 'assets/scenery/karelia/shot_008.jpg' },
  ],
};

/* Convenience lookup: mapId -> map object */
WG.mapById = WG.config.maps.reduce(function (acc, m) { acc[m.id] = m; return acc; }, {});
