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
	{ id: 'outpost-01', mapId: 'outpost', x: 0.149, y: 0.74, image: 'assets/scenery/outpost/shot_016.jpg' },
	{ id: 'outpost-02', mapId: 'outpost', x: 0.102, y: 0.56, image: 'assets/scenery/outpost/shot_019.jpg' },
	{ id: 'outpost-03', mapId: 'outpost', x: 0.161, y: 0.256, image: 'assets/scenery/outpost/shot_020.jpg' },
	{ id: 'outpost-04', mapId: 'outpost', x: 0.435, y: 0.069, image: 'assets/scenery/outpost/shot_021.jpg' },
	{ id: 'outpost-05', mapId: 'outpost', x: 0.719, y: 0.43, image: 'assets/scenery/outpost/shot_022.jpg' },
	{ id: 'outpost-06', mapId: 'outpost', x: 0.554, y: 0.725, image: 'assets/scenery/outpost/shot_023.jpg' },
	{ id: 'outpost-07', mapId: 'outpost', x: 0.417, y: 0.604, image: 'assets/scenery/outpost/shot_024.jpg' },
	{ id: 'outpost-08', mapId: 'outpost', x: 0.481, y: 0.356, image: 'assets/scenery/outpost/shot_025.jpg' },
	{ id: 'outpost-09', mapId: 'outpost', x: 0.166, y: 0.411, image: 'assets/scenery/outpost/shot_026.jpg' },
	{ id: 'oysterbay-01', mapId: 'oyster_bay', x: 0.224, y: 0.912, image: 'assets/scenery/oysterbay/shot_027.jpg' },
	{ id: 'oysterbay-02', mapId: 'oyster_bay', x: 0.058, y: 0.831, image: 'assets/scenery/oysterbay/shot_028.jpg' },
	{ id: 'oysterbay-03', mapId: 'oyster_bay', x: 0.091, y: 0.662, image: 'assets/scenery/oysterbay/shot_029.jpg' },
	{ id: 'oysterbay-04', mapId: 'oyster_bay', x: 0.164, y: 0.335, image: 'assets/scenery/oysterbay/shot_030.jpg' },
	{ id: 'oysterbay-05', mapId: 'oyster_bay', x: 0.375, y: 0.257, image: 'assets/scenery/oysterbay/shot_031.jpg' },
	{ id: 'oysterbay-06', mapId: 'oyster_bay', x: 0.606, y: 0.093, image: 'assets/scenery/oysterbay/shot_032.jpg' },
	{ id: 'oysterbay-07', mapId: 'oyster_bay', x: 0.886, y: 0.05, image: 'assets/scenery/oysterbay/shot_033.jpg' },
	{ id: 'oysterbay-08', mapId: 'oyster_bay', x: 0.895, y: 0.235, image: 'assets/scenery/oysterbay/shot_034.jpg' },
	{ id: 'oysterbay-09', mapId: 'oyster_bay', x: 0.887, y: 0.533, image: 'assets/scenery/oysterbay/shot_035.jpg' },
	{ id: 'oysterbay-10', mapId: 'oyster_bay', x: 0.667, y: 0.843, image: 'assets/scenery/oysterbay/shot_036.jpg' },
	{ id: 'oysterbay-11', mapId: 'oyster_bay', x: 0.565, y: 0.531, image: 'assets/scenery/oysterbay/shot_037.jpg' },
	{ id: 'prokhorovka-1', mapId: 'prokhorovka', x: 0.676, y: 0.522, image: 'assets/scenery/prokhorovka/shot_038.jpg' },
	{ id: 'prokhorovka-2', mapId: 'prokhorovka', x: 0.985, y: 0.01, image: 'assets/scenery/prokhorovka/shot_039.jpg' },
	{ id: 'prokhorovka-3', mapId: 'prokhorovka', x: 0.993, y: 0.658, image: 'assets/scenery/prokhorovka/shot_040.jpg' },
	{ id: 'prokhorovka-4', mapId: 'prokhorovka', x: 0.192, y: 0.278, image: 'assets/scenery/prokhorovka/shot_041.jpg' },
	{ id: 'prokhorovka-5', mapId: 'prokhorovka', x: 0.146, y: 0.076, image: 'assets/scenery/prokhorovka/shot_042.jpg' },
	{ id: 'prokhorovka-6', mapId: 'prokhorovka', x: 0.253, y: 0.067, image: 'assets/scenery/prokhorovka/shot_043.jpg' },
	{ id: 'redshire-1', mapId: 'redshire', x: 0.083, y: 0.864, image: 'assets/scenery/redshire/shot_045.jpg' },
	{ id: 'redshire-2', mapId: 'redshire', x: 0.017, y: 0.463, image: 'assets/scenery/redshire/shot_046.jpg' },
	{ id: 'redshire-3', mapId: 'redshire', x: 0.196, y: 0.26, image: 'assets/scenery/redshire/shot_047.jpg' },
	{ id: 'redshire-4', mapId: 'redshire', x: 0.726, y: 0.053, image: 'assets/scenery/redshire/shot_048.jpg' },
	{ id: 'redshire-5', mapId: 'redshire', x: 0.985, y: 0.163, image: 'assets/scenery/redshire/shot_049.jpg' },
	{ id: 'redshire-6', mapId: 'redshire', x: 0.504, y: 0.469, image: 'assets/scenery/redshire/shot_050.jpg' },
	{ id: 'redshire-7', mapId: 'redshire', x: 0.849, y: 0.715, image: 'assets/scenery/redshire/shot_051.jpg' },
	{ id: 'redshire-8', mapId: 'redshire', x: 0.896, y: 0.982, image: 'assets/scenery/redshire/shot_052.jpg' },
	{ id: 'redshire-9', mapId: 'redshire', x: 0.26, y: 0.486, image: 'assets/scenery/redshire/shot_053.jpg' },
  ],
};

/* Convenience lookup: mapId -> map object */
WG.mapById = WG.config.maps.reduce(function (acc, m) { acc[m.id] = m; return acc; }, {});
