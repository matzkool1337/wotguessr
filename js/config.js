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
   *   image  — real scenery photo URL. When null, a placeholder is generated
   *            by zooming into the map cover at (x, y). Swap in a real photo
   *            later and keep x/y as the answer.
   *
   * These are DUMMY placeholders so the whole flow is playable today.
   */
  scenery: [
    { id: 'cliff-1',       mapId: 'cliff',       x: 0.30, y: 0.55, image: null },
    { id: 'cliff-2',       mapId: 'cliff',       x: 0.62, y: 0.48, image: null },
    { id: 'karelia-1',     mapId: 'karelia',     x: 0.35, y: 0.30, image: null },
    { id: 'karelia-2',     mapId: 'karelia',     x: 0.60, y: 0.68, image: null },
    { id: 'outpost-1',     mapId: 'outpost',     x: 0.45, y: 0.40, image: null },
    { id: 'outpost-2',     mapId: 'outpost',     x: 0.70, y: 0.62, image: null },
    { id: 'oyster_bay-1',  mapId: 'oyster_bay',  x: 0.40, y: 0.55, image: null },
    { id: 'oyster_bay-2',  mapId: 'oyster_bay',  x: 0.66, y: 0.34, image: null },
    { id: 'prokhorovka-1', mapId: 'prokhorovka', x: 0.50, y: 0.35, image: null },
    { id: 'prokhorovka-2', mapId: 'prokhorovka', x: 0.55, y: 0.66, image: null },
    { id: 'redshire-1',    mapId: 'redshire',    x: 0.40, y: 0.45, image: null },
    { id: 'redshire-2',    mapId: 'redshire',    x: 0.60, y: 0.55, image: null },
  ],
};

/* Convenience lookup: mapId -> map object */
WG.mapById = WG.config.maps.reduce(function (acc, m) { acc[m.id] = m; return acc; }, {});
