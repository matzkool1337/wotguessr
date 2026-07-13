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

## Run it locally

Just open `index.html` in a browser (double-click works — it uses relative paths
and classic scripts, so no server is required).

If you prefer a local server, any static server works, e.g. from this folder:

```powershell
# Windows PowerShell one-off server used during development lives in the
# scratchpad, but anything works, e.g. with Node installed:
npx serve .
```

## Deploy to GitHub Pages

1. Create a repo and push this folder's contents to it.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   pick your branch and `/ (root)`.
3. Your game will be live at `https://<user>.github.io/<repo>/`.

`.nojekyll` is included so GitHub serves every file untouched.

## Project layout

```
index.html          markup for all 5 screens (landing/guess/pinpoint/result/gameover)
css/styles.css      dark "field manual / brass" theme + layout
js/config.js        maps, scenery data, and all tunable knobs   <-- edit this
js/scoring.js       distance + score math
js/game.js          the state machine that drives the screens
assets/maps/*.png   the 6 map covers (clean copies of your originals)
```

## Adding real scenery photos (the main next step)

Right now scenery is **placeholder** — each "photo" is just a zoomed crop of the
map cover around the hidden answer, so the whole flow is playable today. To use
real screenshots, edit **`js/config.js`**:

1. Drop your photo somewhere in the repo, e.g. `assets/scenery/cliff-hill-01.jpg`.
2. Add an entry to the `scenery` array:

```js
{
  id: 'cliff-hill-01',
  mapId: 'cliff',                         // which map it's from (the answer)
  x: 0.62, y: 0.48,                       // answer location on that map, see below
  image: 'assets/scenery/cliff-hill-01.jpg'
}
```

When `image` is set, that photo is shown instead of the placeholder crop.
`x` and `y` stay as the correct answer. You can add as many entries per map as you
like — each game randomly picks 5 (preferring a different map each round).

### The (x, y) coordinate system

`x` and `y` are **fractions from 0 to 1, measured from the top-left corner** of the
map cover image:

- `x = 0` left edge → `x = 1` right edge
- `y = 0` top edge → `y = 1` bottom edge
- so map centre is `x: 0.5, y: 0.5`

(If you'd like, I can add a small **"answer authoring" page** where you click a map
and it prints the exact `x, y` and a ready-to-paste config entry — just ask.)

## Things you may want to adjust (all in `js/config.js`)

- **`rounds`** — rounds per game (currently 5).
- **`score.max / decay / perfectRadius`** — how punishing distance is.
- **`dummyZoom`** — zoom level of the placeholder crops (irrelevant once real photos are in).
- **`maps[].sizeMeters`** — ⚠️ **please verify these.** They're best-guess in-game
  map edge lengths (mostly 1000 m, Oyster Bay 1400 m) and only affect the
  distance-in-metres readout.

## Notes

- The `map-*_grid.jpg` in-game minimap (with the A–K / 1–0 grid) is left unused for now,
  as requested. It could later replace the stylised covers for the pinpoint step if you
  want a more "authentic" feel.
- Your original `WoT_Minimap_*_cover.png` files remain in the repo root; the game uses
  the clean copies under `assets/maps/`. The originals can be deleted if you like.
