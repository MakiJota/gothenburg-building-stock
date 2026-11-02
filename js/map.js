// Map engine: class-encoded building tiles (recoloured in the browser), grid cells, swipe.
// Tile pixels: R = function, G = typology, B = class (see dashboard/scripts/02_tiles.R).
window.GMap = (function () {
  const ZMAX = 15, ZMIN = 10;
  proj4.defs("EPSG:3006", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
  const toLL = proj4("EPSG:3006", "EPSG:4326");

  let map, bounds, layerA, layerB, gridLayer, paneA, paneB, swipeOn = false, swipeX = 0.5;

  // ---------- raw tile cache (decoded pixel codes) ----------
  const cache = new Map();
  function loadRaw(url) {
    if (cache.has(url)) return cache.get(url);
    const p = new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas"); c.width = c.height = 256;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        res(ctx.getImageData(0, 0, 256, 256));
      };
      img.onerror = () => res(null);
      img.src = url;
    });
    cache.set(url, p);
    if (cache.size > 600) cache.delete(cache.keys().next().value);
    return p;
  }

  const off = document.createElement("canvas"); off.width = off.height = 256;
  const offCtx = off.getContext("2d");
  function paint(c, lut) {
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 256, 256);
    if (!c._raw || !lut) return;
    const s = c._raw.data, out = new ImageData(256, 256), o = out.data;
    for (let i = 0; i < s.length; i += 4) {
      if (s[i + 3] < 128) continue;
      const col = lut(s[i], s[i + 1], s[i + 2]);
      if (!col) continue;
      o[i] = col[0]; o[i + 1] = col[1]; o[i + 2] = col[2]; o[i + 3] = col[3];
    }
    const { ox, oy, sub } = c._src;
    if (sub === 256) ctx.putImageData(out, 0, 0);
    else {
      offCtx.putImageData(out, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, ox, oy, sub, sub, 0, 0, 256, 256);
    }
  }

  const CodeLayer = L.GridLayer.extend({
    initialize(opts) { L.setOptions(this, opts); this._name = null; this._lut = null; },
    setSource(name, lut) {
      const changed = name !== this._name;
      this._name = name; this._lut = lut;
      if (changed) this.redraw(); else this.recolor();
    },
    recolor() { for (const k in this._tiles) paint(this._tiles[k].el, this._lut); },
    createTile(coords, done) {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      if (!this._name) { setTimeout(() => done(null, c)); return c; }
      const d = Math.max(0, coords.z - ZMAX), sub = 256 >> d;
      const px = coords.x >> d, py = coords.y >> d;
      c._src = { ox: (coords.x - (px << d)) * sub, oy: (coords.y - (py << d)) * sub, sub };
      const name = this._name;
      loadRaw(`tiles/${name}/${coords.z - d}/${px}/${py}.png`).then((raw) => {
        if (name !== this._name) return done(null, c);
        c._raw = raw; paint(c, this._lut); done(null, c);
      });
      return c;
    },
    // pixel code under a lat/lng, or null
    codeAt(latlng) {
      if (!this._map || !this._name) return null;
      const z = this._map.getZoom(), p = this._map.project(latlng, z);
      const tx = Math.floor(p.x / 256), ty = Math.floor(p.y / 256);
      const t = this._tiles[`${tx}:${ty}:${z}`];
      if (!t || !t.el._raw) return null;
      const c = t.el, f = c._src.sub / 256;
      const sx = Math.floor(c._src.ox + (p.x - tx * 256) * f), sy = Math.floor(c._src.oy + (p.y - ty * 256) * f);
      const i = (sy * 256 + sx) * 4, s = c._raw.data;
      return s[i + 3] < 128 ? null : [s[i], s[i + 1], s[i + 2]];
    }
  });

  // ---------- grid cells ----------
  const cornerCache = new Map();
  function corners(meta, ix, iy) {
    const k = meta.size + ":" + ix + ":" + iy;
    let c = cornerCache.get(k);
    if (!c) {
      const x = meta.x0 + ix * meta.size, y = meta.y0 + iy * meta.size, s = meta.size;
      c = [[x, y], [x + s, y], [x + s, y + s], [x, y + s]].map((q) => { const ll = toLL.forward(q); return L.latLng(ll[1], ll[0]); });
      cornerCache.set(k, c);
    }
    return c;
  }
  const toSW = proj4("EPSG:4326", "EPSG:3006");
  const GridCells = L.GridLayer.extend({
    initialize(opts) { L.setOptions(this, opts); this._data = null; },
    setData(d) { this._data = d; this.redraw(); },   // d = {meta, values: Map(key->v), color: v->css}
    createTile(coords) {
      const c = document.createElement("canvas"); c.width = c.height = 256;
      const d = this._data; if (!d) return c;
      const ctx = c.getContext("2d"), m = d.meta, z = coords.z, o = L.point(coords.x * 256, coords.y * 256);
      const nw = this._map.unproject(o, z), se = this._map.unproject(o.add([256, 256]), z);
      const a = toSW.forward([nw.lng, nw.lat]), b = toSW.forward([se.lng, se.lat]);
      const pad = 1;
      const ix0 = Math.floor((Math.min(a[0], b[0]) - m.x0) / m.size) - pad, ix1 = Math.floor((Math.max(a[0], b[0]) - m.x0) / m.size) + pad;
      const iy0 = Math.floor((Math.min(a[1], b[1]) - m.y0) / m.size) - pad, iy1 = Math.floor((Math.max(a[1], b[1]) - m.y0) / m.size) + pad;
      const edge = z >= 14 && m.size >= 100 ? 1 : 0;
      for (let ix = ix0; ix <= ix1; ix++) for (let iy = iy0; iy <= iy1; iy++) {
        const v = d.values.get(ix * 100000 + iy);
        if (!v) continue;
        const pts = corners(m, ix, iy).map((ll) => this._map.project(ll, z).subtract(o));
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
        for (let k = 1; k < 4; k++) ctx.lineTo(pts[k].x, pts[k].y);
        ctx.closePath(); ctx.fillStyle = d.color(v); ctx.fill();
        if (edge) { ctx.strokeStyle = "rgba(252,252,251,.9)"; ctx.lineWidth = 1; ctx.stroke(); }
      }
      return c;
    },
    cellAt(latlng) {
      const d = this._data; if (!d) return null;
      const q = toSW.forward([latlng.lng, latlng.lat]), m = d.meta;
      const ix = Math.floor((q[0] - m.x0) / m.size), iy = Math.floor((q[1] - m.y0) / m.size);
      return { ix, iy, v: d.values.get(ix * 100000 + iy) || 0 };
    }
  });

  // ---------- swipe ----------
  function clip() {
    if (!map) return;
    const nw = map.containerPointToLayerPoint([0, 0]), se = map.containerPointToLayerPoint(map.getSize());
    const x = map.containerPointToLayerPoint([map.getSize().x * swipeX, 0]).x;
    if (swipeOn) {
      paneA.style.clip = `rect(${nw.y}px, ${x}px, ${se.y}px, ${nw.x}px)`;
      paneB.style.clip = `rect(${nw.y}px, ${se.x}px, ${se.y}px, ${x}px)`;
    } else { paneA.style.clip = ""; paneB.style.clip = ""; }
    const el = document.getElementById("swipe");
    el.style.left = (map.getSize().x * swipeX) + "px";
  }
  function initSwipe() {
    const knob = document.querySelector("#swipe .knob");
    let drag = false;
    const move = (e) => {
      if (!drag) return;
      const r = map.getContainer().getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      swipeX = Math.min(0.98, Math.max(0.02, x / r.width)); clip();
    };
    knob.addEventListener("pointerdown", (e) => { drag = true; map.dragging.disable(); knob.setPointerCapture(e.pointerId); });
    knob.addEventListener("pointermove", move);
    knob.addEventListener("pointerup", () => { drag = false; map.dragging.enable(); });
  }

  function init(tilesMeta) {
    const b = tilesMeta.bounds; // [s, w, n, e]
    bounds = L.latLngBounds([b[0], b[1]], [b[2], b[3]]);
    map = L.map("map", { minZoom: ZMIN, maxZoom: 18, zoomSnap: 1, maxBounds: bounds.pad(0.3), preferCanvas: true });
    map.fitBounds(bounds.pad(-0.12));
    const esri = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/";
    L.tileLayer(esri + "World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, maxNativeZoom: 16,
      attribution: 'Basemap © Esri, HERE, Garmin, © OpenStreetMap contributors · Buildings: Time Model © Chalmers'
    }).addTo(map);
    paneA = map.createPane("bA"); paneA.style.zIndex = 410;
    paneB = map.createPane("bB"); paneB.style.zIndex = 420;
    map.createPane("labels").style.zIndex = 450;
    map.getPane("labels").style.pointerEvents = "none";
    L.tileLayer(esri + "World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, maxNativeZoom: 16, pane: "labels", opacity: 0.8
    }).addTo(map);
    const opt = { bounds, minZoom: ZMIN, maxZoom: 18, keepBuffer: 2, updateWhenZooming: false };
    layerA = new CodeLayer({ ...opt, pane: "bA" }).addTo(map);
    layerB = new CodeLayer({ ...opt, pane: "bB" }).addTo(map);
    gridLayer = new GridCells({ ...opt, pane: "bA", opacity: 0.9 });
    map.on("move zoom resize", clip);
    initSwipe();
    return map;
  }

  return {
    init,
    get map() { return map; },
    layerA: () => layerA, layerB: () => layerB, grid: () => gridLayer,
    setSwipe(on) { swipeOn = on; document.getElementById("swipe").hidden = !on; document.getElementById("swipe-labels").hidden = !on; clip(); },
    showGrid(on) {
      if (on && !map.hasLayer(gridLayer)) gridLayer.addTo(map);
      if (!on && map.hasLayer(gridLayer)) map.removeLayer(gridLayer);
      [layerA, layerB].forEach((l) => l.setOpacity(on ? 0 : 1));
    }
  };
})();
