/*
 * WoT GeoGuessr — scoring & distance helpers
 */
window.WG = window.WG || {};

WG.scoring = {
  /* Straight-line distance between two normalised points (0..1 on each axis). */
  distanceNorm: function (ax, ay, bx, by) {
    return Math.hypot(ax - bx, ay - by);
  },

  /* Translate a normalised distance into in-game metres for a given map size. */
  distanceMeters: function (distNorm, sizeMeters) {
    return distNorm * sizeMeters;
  },

  /*
   * Round score from a normalised distance.
   * Bullseye within `perfectRadius` => full marks, otherwise exponential decay.
   */
  score: function (distNorm) {
    var s = WG.config.score;
    if (distNorm <= s.perfectRadius) return s.max;
    var value = s.max * Math.exp(-distNorm / s.decay);
    return Math.max(0, Math.round(value));
  },

  /* A short qualitative label for a round score, purely for flavour. */
  rating: function (score) {
    var max = WG.config.score.max;
    var pct = score / max;
    if (pct >= 0.98) return 'BULLSEYE';
    if (pct >= 0.80) return 'Direct hit';
    if (pct >= 0.55) return 'On target';
    if (pct >= 0.30) return 'Nearby';
    if (pct > 0)     return 'Way off';
    return 'Missed';
  },
};
