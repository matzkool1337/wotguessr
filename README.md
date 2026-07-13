# WoTGuessr — a GeoGuessr for World of Tanks

Look at a scene, guess which of the 6 maps it's from, then pin the exact spot.
Score is based on how close your pin is to the real location.

Pure static site — **HTML + CSS + vanilla JS, no build step, no dependencies.**
It runs straight from disk and hosts on GitHub Pages as-is.

## How the round works

1. **Scene** — a photo from somewhere on one of the maps is shown.
2. **Pick the map** — choose one of the 6 map cards.
   - **Wrong map → 0 points** for the round, the correct map + spot are revealed, and the round ends.
   - **Right map → pinpoint step.**
3. **Pinpoint** — click the enlarged map to drop your marker, then submit.
4. **Result** — your pin, the real spot, the distance in metres, and your round score.
5. After **5 rounds**, a summary screen shows your total and a per-round breakdown.

Scoring is GeoGuessr-style: a bullseye is **5000** points, decaying exponentially
with distance. Max game score = 5 × 5000 = **25000**.

