// App: state, controls, colouring, legend, grid aggregation, timeline.
(function () {
  const YEARS = [1960, 1965, 1970, 1975, 1980, 1985, 1990, 1995, 2000, 2005, 2010, 2015];
  const FUNCS = ["res_sf", "res_mf", "commercial", "industrial", "institutional", "auxiliary"];
  const TYPOS = ["CMF", "MMF", "WBMF", "WMF", "WSF"];
  const COHORTS = ["pre1900", "1900_1929", "1930_1958", "unknown"];
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const hex = (h) => { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const SL = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => css("--s" + i));
  const GREY = "#b8b6ae", PERSIST = "#cfcdc5";
  const FUNC_COL = [null, ...SL.slice(0, 6)];                         // index = function code
  const TYPO_COL = [GREY, ...SL.slice(0, 5)];                         // 0 = n/a
  const NEW_COL = SL[0], DEMO_COL = SL[1];
  // construction period (ordinal): oldest dark -> newest light, one blue ramp
  // 7 groups: <1900, 1900-29, 1930-58, 1960-75, 1975-90, 1990-2005, 2005-15 (class codes from the tiles)
  const AGE_GROUPS = [[21], [22], [23], [1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11]];
  const AGE_GROUP_COL = ["#0d366b", "#184f95", "#256abf", "#2a78d6", "#5598e7", "#6da7ec", "#86b6ef"];
  const AGE_PRE_COL = { 21: "#0d366b", 22: "#2a78d6", 23: "#86b6ef", 24: GREY };   // spread for the <1960 view
  const AGE_COL = { 24: GREY };
  AGE_GROUPS.forEach((g, i) => g.forEach((c) => (AGE_COL[c] = AGE_GROUP_COL[i])));
  const ageCol = (c) => (S.step === 0 ? AGE_PRE_COL[c] : AGE_COL[c]);
  const GRID_RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"];

  const S = {
    lang: "en", step: 12, view: "stock", layer: "buildings", colorBy: "function",
    funcs: new Set([1, 2, 3, 4, 5, 6]), typos: new Set([0, 1, 2, 3, 4, 5]),
    mat: false, material: "mt", gsize: 250, gmetric: "gfa", gdir: 1, playing: null
  };
  let T, FL, TM;
  const stockCache = {}, flowCache = {};
  const year = () => YEARS[Math.max(0, S.step - 1)];
  const before = () => S.step === 0;
  const pidx = () => (S.step >= 2 ? S.step - 2 : -1);           // period index ending at year()
  const canCompare = () => S.step >= 2;
  const effView = () => (canCompare() ? S.view : "stock");
  const effColor = () => (before() ? "age" : S.colorBy);
  const fmtN = (v) => d3.format(",")(Math.round(v)).replace(/,/g, S.lang === "sv" ? " " : ",");
  const fmtD = (v, d = 2) => { const s = v.toFixed(d); return S.lang === "sv" ? s.replace(".", ",") : s; };
  const t = (k, o = {}) => (T[k] || k).replace(/\{(\w+)\}/g, (_, x) => (x in o ? o[x] : ""));
  const plab = (p) => p.replace("-", "–");
  const ageLabel = (c) => (c >= 21 ? T["co_" + COHORTS[c - 21]] : plab(FL.labels.periods[c - 1]));

  // ---------- pixel filters / colour lookup ----------
  function passes(f, ty) {
    if (!S.funcs.has(f)) return false;
    if (S.mat) { if (f > 2) return false; if (!S.typos.has(ty)) return false; }
    return true;
  }
  function makeLut(mode) {           // mode: "stock" | "persist" | "change"
    const memo = new Map(), cb = effColor(), bf = before();
    return (r, g, b) => {
      const k = (r << 16) | (g << 8) | b;
      if (memo.has(k)) return memo.get(k);
      let out = null;
      if (passes(r, g) && !(bf && b < 21)) {
        let c;
        if (mode === "change") c = b === 1 ? NEW_COL : DEMO_COL;
        else if (mode === "persist") c = PERSIST;
        else if (cb === "function") c = FUNC_COL[r];
        else if (cb === "typology") c = r <= 2 ? TYPO_COL[g] : "#e1e0d9";
        else c = ageCol(b) || GREY;
        out = c ? [...hex(c), 255] : null;
      }
      memo.set(k, out); return out;
    };
  }

  // ---------- data ----------
  const getJSON = (u) => fetch(u).then((r) => r.json());
  function stockData(size, y) {
    const k = size + ":" + y;
    return stockCache[k] || (stockCache[k] = getJSON(`data/grid/g${size}_stock_${y}.json`));
  }
  function flowData(size) { return flowCache[size] || (flowCache[size] = getJSON(`data/grid/g${size}_flows.json`)); }
  const colIdx = (d) => Object.fromEntries(d.cols.map((c, i) => [c, i]));

  // ---------- map rendering ----------
  function renderMap() {
    const A = GMap.layerA(), B = GMap.layerB(), v = effView(), y = year();
    GMap.setSwipe(v === "swipe" && S.layer === "buildings");
    if (S.layer === "grid") { A.setSource(null, null); B.setSource(null, null); GMap.showGrid(true); renderGrid(); }
    else {
      GMap.showGrid(false);
      if (v === "stock") { A.setSource("s" + y, makeLut("stock")); B.setSource(null, null); }
      else if (v === "change") { A.setSource("s" + y, makeLut("persist")); B.setSource("c" + y, makeLut("change")); }
      else {
        A.setSource("s" + (y - 5), makeLut("stock")); B.setSource("s" + y, makeLut("stock"));
        document.getElementById("sw-left").textContent = y - 5; document.getElementById("sw-right").textContent = y;
      }
    }
    renderLegend(); renderSummary(); writeParams();
  }

  // ---------- shareable state in the URL ----------
  function writeParams() {
    const q = new URLSearchParams();
    q.set("y", before() ? "pre" : year()); q.set("view", S.view); q.set("layer", S.layer); q.set("color", S.colorBy);
    if (S.layer === "grid") { q.set("cell", S.gsize); q.set("metric", S.gmetric); q.set("dir", S.gdir); }
    if (S.mat) { q.set("mat", S.material); q.set("typos", [...S.typos].join("")); }
    if (S.funcs.size < 6) q.set("types", [...S.funcs].join(""));
    q.set("lang", S.lang);
    history.replaceState(null, "", "?" + q.toString() + location.hash);
  }
  function readParams() {
    const q = new URLSearchParams(location.search);
    const y = q.get("y"); if (y === "pre") S.step = 0; else if (YEARS.includes(+y)) S.step = YEARS.indexOf(+y) + 1;
    if (["stock", "change", "swipe"].includes(q.get("view"))) S.view = q.get("view");
    if (["buildings", "grid"].includes(q.get("layer"))) S.layer = q.get("layer");
    if (["function", "typology", "age"].includes(q.get("color"))) S.colorBy = q.get("color");
    if ([100, 250, 500].includes(+q.get("cell"))) S.gsize = +q.get("cell");
    if (["n", "fp", "gfa"].includes(q.get("metric"))) S.gmetric = q.get("metric");
    if (["1", "2"].includes(q.get("dir"))) S.gdir = +q.get("dir");
    if (q.get("mat")) { S.mat = true; S.material = /^m(t|\d{1,2})$/.test(q.get("mat")) ? q.get("mat") : "mt"; }
    if (q.get("typos") !== null) S.typos = new Set([...q.get("typos")].map(Number).filter((x) => x >= 0 && x <= 5));
    if (q.get("types")) S.funcs = new Set([...q.get("types")].map(Number).filter((x) => x >= 1 && x <= 6));
    return ["en", "sv"].includes(q.get("lang")) ? q.get("lang") : null;
  }

  let gridLegend = null;
  async function renderGrid() {
    const v = effView(), size = S.gsize, values = new Map();
    let meta;
    const mcol = S.mat ? S.material : S.gmetric;
    if (!S.mat && v !== "change") {                         // stock sums
      const d = await stockData(size, year()); meta = d; const c = colIdx(d);
      for (const r of d.rows) {
        if (!passes(r[c.f], 0) || (before() && r[c.c] < 21)) continue;
        const k = r[c.ix] * 100000 + r[c.iy]; values.set(k, (values.get(k) || 0) + r[c[mcol]]);
      }
      gridLegend = { title: T.lg_grid_stock + ` (${year()})`, unit: S.gmetric };
    } else {
      const d = await flowData(size); meta = d; const c = colIdx(d);
      const cum = v !== "change", pi = pidx(), dir = cum ? 1 : S.gdir;
      for (const r of d.rows) {
        if (r[c.d] !== dir) continue;
        if (cum ? r[c.pi] > pi : r[c.pi] !== pi) continue;
        if (!passes(r[c.f], r[c.t])) continue;
        const val = S.mat ? r[c[mcol]] : r[c[mcol]];
        if (!val) continue;
        const k = r[c.ix] * 100000 + r[c.iy]; values.set(k, (values.get(k) || 0) + val);
      }
      gridLegend = { title: cum ? T.lg_grid_cum + ` (≤ ${year()})` : T.lg_grid_flow + ` ${plab(FL.labels.periods[pi])}`, unit: S.mat ? "t" : S.gmetric };
    }
    const vals = [...values.values()].filter((x) => x > 0).sort(d3.ascending);
    const br = vals.length ? [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((q) => d3.quantileSorted(vals, q)) : [];
    const sc = d3.scaleThreshold(br, GRID_RAMP);
    gridLegend.breaks = br; gridLegend.max = vals.length ? vals[vals.length - 1] : 0;
    GMap.grid().setData({ meta, values, color: sc });
    renderLegend();
  }

  // ---------- legend ----------
  function renderLegend() {
    const el = document.getElementById("legend"), v = effView();
    const item = (c, l) => `<div class="it"><span class="sw" style="background:${c}"></span>${l}</div>`;
    let h = "";
    if (S.layer === "grid" && gridLegend) {
      const unit = { n: "", fp: " m²", gfa: " m²", t: " t" }[gridLegend.unit] || "";
      const ticks = gridLegend.breaks.length ? [gridLegend.breaks[0], gridLegend.breaks[2], gridLegend.breaks[5]].map((x) => fmtN(x)) : [];
      h = `<div class="t">${gridLegend.title}</div><div>${S.mat ? (S.material === "mt" ? T.m_total : T.mat[FL.labels.materials[+S.material.slice(1) - 1]]) : T["metric_" + gridLegend.unit]}</div>
        <div class="ramp">${GRID_RAMP.map((c) => `<i style="background:${c}"></i>`).join("")}</div>
        <div class="ticks">${ticks.map((x) => `<span>${x}</span>`).join("")}<span>${fmtN(gridLegend.max)}${unit}</span></div>`;
    } else if (v === "change") {
      h = `<div class="t">${T.lg_change} ${plab(FL.labels.periods[pidx()])}</div>` + item(NEW_COL, T.new) + item(DEMO_COL, T.demolished) + item(PERSIST, T.persisting);
    } else {
      const cb = effColor();
      if (cb === "function") h = `<div class="t">${T.lg_function}</div>` + FUNCS.map((f, i) => (S.funcs.has(i + 1) ? item(FUNC_COL[i + 1], T["f_" + f]) : "")).join("");
      else if (cb === "typology") h = `<div class="t">${T.lg_typology}</div>` + TYPOS.map((x, i) => item(TYPO_COL[i + 1], x)).join("") + item(GREY, T.t_na);
      else {
        if (before()) h = `<div class="t">${T.lg_age}</div>` + [21, 22, 23, 24].map((c) => item(AGE_PRE_COL[c], ageLabel(c))).join("");
        else {
          const P = FL.labels.periods, last = S.step - 1;            // newest class present in this layer
          const rows = AGE_GROUPS.map((g, i) => {
            const cs = g.filter((c) => c >= 21 || c <= last); if (!cs.length) return "";
            const lab = cs[0] >= 21 ? ageLabel(cs[0]) : `${P[cs[0] - 1].slice(0, 4)}–${P[cs[cs.length - 1] - 1].slice(5)}`;
            return item(AGE_GROUP_COL[i], lab);
          });
          h = `<div class="t">${T.lg_age}</div>` + rows.join("") + item(GREY, T.co_unknown);
        }
      }
    }
    el.innerHTML = h;
  }

  // ---------- summary line ----------
  async function renderSummary() {
    const el = document.getElementById("summary"), v = effView();
    const d = await stockData(500, year()), c = colIdx(d);
    if (before()) {
      const n = [0, 0, 0, 0];
      d.rows.forEach((r) => { if (r[c.c] >= 21 && passes(r[c.f], 0)) n[r[c.c] - 21] += r[c.n]; });
      el.innerHTML = t("sum_before", { parts: COHORTS.map((k, i) => `${T["co_" + k]} <b>${fmtN(n[i])}</b>`).join(" · ") });
      return;
    }
    if (v === "stock" || v === "swipe") {
      let n = 0, fp = 0, gfa = 0;
      d.rows.forEach((r) => { if (passes(r[c.f], 0)) { n += r[c.n]; fp += r[c.fp]; gfa += r[c.gfa]; } });
      el.innerHTML = `<b>${year()}</b> · ` + t("sum_stock", { n: `<b>${fmtN(n)}</b>`, fp: fmtD(fp / 1e6), gfa: fmtD(gfa / 1e6) });
      return;
    }
    const f = await flowData(500), k = colIdx(f), pi = pidx();
    const s = { n1: 0, g1: 0, n2: 0, g2: 0, t1: 0, t2: 0 };
    f.rows.forEach((r) => {
      if (r[k.pi] !== pi || !passes(r[k.f], r[k.t])) return;
      const dd = r[k.d]; s["n" + dd] += r[k.n]; s["g" + dd] += r[k.gfa]; s["t" + dd] += r[k[S.material]] || 0;
    });
    let h = t("sum_change", { p: `<b>${plab(FL.labels.periods[pi])}</b>`, nn: fmtN(s.n1), ng: fmtD(s.g1 / 1e6), nd: fmtN(s.n2), dg: fmtD(s.g2 / 1e6) });
    if (S.mat) h += t("sum_mat", { ti: fmtD(s.t1 / 1e6, 3), to: fmtD(s.t2 / 1e6, 3) });
    el.innerHTML = h;
  }

  // ---------- hover tooltip ----------
  function initHover() {
    const map = GMap.map, tip = document.getElementById("tip");
    map.on("mousemove", (e) => {
      let html = null;
      if (S.layer === "grid") {
        const cell = GMap.grid().cellAt(e.latlng);
        if (cell && cell.v) {
          const u = S.mat ? "t" : S.gmetric;
          html = `<b>${t("cell", { s: S.gsize })}</b><br>${fmtN(cell.v)} ${u === "n" ? "" : u === "t" ? T.tonnes : "m²"}`;
        }
      } else {
        const v = effView();
        const right = v === "swipe" && e.containerPoint.x > map.getSize().x * 0.5;   // approx; divider label shows sides
        const lay = v === "change" ? GMap.layerB() : v === "swipe" && !right ? GMap.layerA() : (v === "swipe" ? GMap.layerB() : GMap.layerA());
        let code = lay.codeAt(e.latlng), status = "";
        if (v === "change") {
          if (code && passes(code[0], code[1])) status = code[2] === 1 ? T.new : T.demolished;
          else { code = GMap.layerA().codeAt(e.latlng); status = T.persisting; }
        }
        if (code && passes(code[0], code[1]) && !(before() && code[2] < 21)) {
          const [f, ty, b] = code;
          const parts = [T["f_" + FUNCS[f - 1]]];
          if (f <= 2) parts.push(ty ? TYPOS[ty - 1] : "typology n/a");
          if (v === "change" && status !== T.persisting) parts.push(`<b>${status}</b> ${plab(FL.labels.periods[pidx()])}`);
          else parts.push(`${T.built}: ${ageLabel(b)}`);
          html = parts.join("<br>");
        }
      }
      if (!html) { tip.hidden = true; return; }
      tip.innerHTML = html; tip.hidden = false;
      const p = e.containerPoint, w = tip.offsetWidth;
      tip.style.left = (p.x + 14 + w > map.getSize().x ? p.x - w - 14 : p.x + 14) + "px"; tip.style.top = (p.y + 14) + "px";
    });
    map.on("mouseout", () => (tip.hidden = true));
  }

  // ---------- controls ----------
  function seg(id, attr, key, after) {
    document.querySelectorAll(`#${id} button`).forEach((b) => b.addEventListener("click", () => {
      if (b.disabled) return;
      S[key] = b.dataset[attr]; syncControls(); after && after();
    }));
  }
  function buildChecks() {
    const fe = document.getElementById("funcs");
    fe.innerHTML = FUNCS.map((f, i) => `<label data-f="${i + 1}"><input type="checkbox" ${S.funcs.has(i + 1) ? "checked" : ""}>
      <span class="sw" style="background:${FUNC_COL[i + 1]}"></span><span>${T["f_" + f]}</span></label>`).join("");
    fe.querySelectorAll("label").forEach((l) => l.querySelector("input").addEventListener("change", (e) => {
      const f = +l.dataset.f; e.target.checked ? S.funcs.add(f) : S.funcs.delete(f); renderMap();
    }));
    const te = document.getElementById("typos");
    const ty = [...TYPOS.map((x, i) => [i + 1, x]), [0, "n/a"]];
    te.innerHTML = ty.map(([c, x]) => `<label data-t="${c}"><input type="checkbox" ${S.typos.has(c) ? "checked" : ""}>
      <span class="sw" style="background:${TYPO_COL[c]}"></span><span>${x}</span></label>`).join("");
    te.querySelectorAll("label").forEach((l) => l.querySelector("input").addEventListener("change", (e) => {
      const c = +l.dataset.t; e.target.checked ? S.typos.add(c) : S.typos.delete(c); renderMap();
    }));
    const ms = document.getElementById("material");
    ms.innerHTML = `<option value="mt">${T.m_total}</option>` + FL.labels.materials.map((m, i) => `<option value="m${i + 1}">${T.mat[m]}</option>`).join("");
    ms.value = S.material;
    const gm = document.getElementById("gmetric");
    gm.innerHTML = ["n", "fp", "gfa"].map((k) => `<option value="${k}">${T["metric_" + k]}</option>`).join("");
    gm.value = S.gmetric;
  }
  function syncControls() {
    const cmp = canCompare();
    document.querySelectorAll("#view button").forEach((b) => {
      b.disabled = b.dataset.v !== "stock" && (!cmp || (b.dataset.v === "swipe" && S.layer === "grid"));
      b.classList.toggle("on", b.dataset.v === effView());
    });
    document.querySelectorAll("#layer button").forEach((b) => b.classList.toggle("on", b.dataset.l === S.layer));
    document.querySelectorAll("#colorby button").forEach((b) => { b.disabled = before(); b.classList.toggle("on", b.dataset.c === effColor()); });
    const v = effView();
    document.getElementById("view-hint").textContent = before() ? T.hint_before : !cmp && S.view !== "stock" ? T.hint_needs_prev : T["hint_" + v];
    document.getElementById("colorby-box").hidden = v === "change" || S.layer === "grid";
    document.getElementById("grid-opts").hidden = S.layer !== "grid";
    document.getElementById("gdir-row").hidden = !(S.layer === "grid" && v === "change");
    document.getElementById("gmetric").closest(".row").hidden = S.mat;
    document.getElementById("mat-opts").hidden = !S.mat;
    document.querySelectorAll("#funcs label").forEach((l) => {
      const off = S.mat && +l.dataset.f > 2; l.classList.toggle("off", off); l.querySelector("input").disabled = off;
    });
    document.querySelectorAll("#steps button").forEach((b, i) => {
      b.classList.toggle("on", i === S.step);
      b.classList.toggle("span", v !== "stock" && i === S.step - 1);
    });
  }
  function setStep(i) {
    S.step = Math.max(0, Math.min(12, i)); syncControls(); renderMap(); Charts.setPeriod(pidx());
  }
  function buildTimeline() {
    const el = document.getElementById("steps");
    el.innerHTML = [T.before, ...YEARS].map((y, i) => `<button data-i="${i}" aria-label="${y}">${y}</button>`).join("");
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => { stopPlay(); setStep(+b.dataset.i); }));
    syncControls();
  }
  function stopPlay() { if (S.playing) { clearInterval(S.playing); S.playing = null; document.getElementById("play").textContent = "▶"; } }
  function initPlay() {
    document.getElementById("play").addEventListener("click", () => {
      if (S.playing) return stopPlay();
      if (S.step >= 12) setStep(effView() === "stock" ? 0 : 2);
      document.getElementById("play").textContent = "❚❚";
      S.playing = setInterval(() => { if (S.step >= 12) stopPlay(); else setStep(S.step + 1); }, 1500);
    });
  }

  // ---------- KPIs, report, language ----------
  function renderKpis() {
    const h = FL.paper.headline;
    const k = (l, v, d) => `<div class="kpi"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`;
    document.getElementById("kpis").innerHTML = [
      k(T.kpi_stock60, fmtD(h.stock1960_Mt) + " Mt", ""),
      k(T.kpi_stock15, fmtD(h.stock2015_Mt) + " Mt", `+${h.stock_change_pct} %`),
      k(T.kpi_in, fmtD(h.inflow_Mt) + " Mt", `${fmtN(h.new_buildings)} ${T.new.toLowerCase()} (${T.other === "Other" ? "all types" : "alla typer"})`),
      k(T.kpi_out, fmtD(h.outflow_Mt) + " Mt", `${fmtN(h.demolished_buildings)} ${T.demolished.toLowerCase()}`),
      k(T.kpi_pop, `+${h.pop_change_pct} %`, `${fmtN(h.pop1960)} → ${fmtN(h.pop2015)}`),
      k(T.kpi_gfa, `+${h.res_gfa_change_pct} %`, `${fmtD(h.res_gfa1960_km2, 1)} → ${fmtD(h.res_gfa2015_km2, 1)} km²`),
      k(T.kpi_pc, `${fmtD(h.stock_pc2015_t, 1)} t`, `${fmtD(h.stock_pc1960_t, 1)} t (1960)`)
    ].join("");
  }
  function table1() {
    const t1 = FL.paper.table1, P = t1.periods, tt = t1.totals, sv = S.lang === "sv";
    const L = sv ? { out: "UTFLÖDE – RIVNING", in: "INFLÖDE – NYBYGGNAD", net: "NETTOFÖRÄNDRING", count: "Antal", fp: "Byggnadsarea (km²)", gfa: "BTA (km²)", mass: "Massa (Mt)", tot: "Totalt" }
                 : { out: "OUTFLOW – DEMOLITIONS", in: "INFLOW – NEW CONSTRUCTIONS", net: "NET CHANGE", count: "Count", fp: "Footprint (km²)", gfa: "GFA (km²)", mass: "Mass (Mt)", tot: "Total" };
    const f2 = (v) => fmtD(v, 2), row = (l, arr, tot, f) => `<tr><td>${l}</td>${arr.map((v) => `<td>${f(v)}</td>`).join("")}<td><b>${f(tot)}</b></td></tr>`;
    const net = (a, b) => a.map((v, i) => v - b[i]);
    return `<div class="tbl"><table><thead><tr><th></th>${P.map((p) => `<th>${plab(p)}</th>`).join("")}<th>${L.tot}</th></tr></thead><tbody>
      <tr class="grp"><td colspan="13">${L.out}</td></tr>
      ${row(L.count, t1.out_count, tt.out_count, fmtN)}${row(L.fp, t1.out_fp, tt.out_fp, f2)}${row(L.gfa, t1.out_gfa, tt.out_gfa, f2)}${row(L.mass, t1.out_Mt, tt.out_Mt, f2)}
      <tr class="grp"><td colspan="13">${L.in}</td></tr>
      ${row(L.count, t1.in_count, tt.in_count, fmtN)}${row(L.fp, t1.in_fp, tt.in_fp, f2)}${row(L.gfa, t1.in_gfa, tt.in_gfa, f2)}${row(L.mass, t1.in_Mt, tt.in_Mt, f2)}
      <tr class="grp"><td colspan="13">${L.net}</td></tr>
      ${row(L.count, net(t1.in_count, t1.out_count), tt.net_count, fmtN)}${row(L.gfa, net(t1.in_gfa, t1.out_gfa), tt.net_gfa, f2)}${row(L.mass, net(t1.in_Mt, t1.out_Mt), tt.net_Mt, f2)}
      </tbody></table></div>`;
  }
  function setLang(l) {
    S.lang = l; T = I18N[l]; document.documentElement.lang = l;
    document.querySelectorAll("[data-i18n]").forEach((e) => { const k = e.dataset.i18n; if (T[k]) e.innerHTML = T[k]; });
    document.querySelectorAll(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.lang === l));
    document.getElementById("report-body").innerHTML = CONTENT[l].report();
    document.getElementById("about-body").innerHTML = CONTENT[l].about();
    document.getElementById("table1").innerHTML = table1();
    buildChecks(); buildTimeline(); renderKpis(); renderMap(); Charts.update(T, pidx());
    try { localStorage.setItem("gbs-lang", l); } catch (e) {}
  }
  function initTabs() {
    const go = (id) => {
      document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === id));
      document.querySelectorAll(".tab").forEach((m) => m.classList.toggle("on", m.id === id));
      if (id === "explore") setTimeout(() => GMap.map.invalidateSize());
      if (location.hash !== "#" + id) history.replaceState(null, "", "#" + id);
    };
    document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => go(b.dataset.tab)));
    const h = location.hash.slice(1); if (["explore", "report", "about"].includes(h)) go(h);
  }

  // ---------- boot ----------
  Promise.all([getJSON("data/flows.json"), getJSON("data/tiles.json")]).then(([flows, tiles]) => {
    FL = flows; TM = tiles; T = I18N.en;
    GMap.init(TM);
    Charts.init(FL, (pi) => { stopPlay(); if (S.view === "stock") S.view = "change"; setStep(pi + 2); });
    seg("view", "v", "view", renderMap);
    seg("layer", "l", "layer", renderMap);
    seg("colorby", "c", "colorBy", renderMap);
    document.getElementById("mat").addEventListener("change", (e) => {
      S.mat = e.target.checked; if (S.mat) { S.layer = "grid"; } syncControls(); renderMap();
    });
    document.getElementById("material").addEventListener("change", (e) => { S.material = e.target.value; renderMap(); });
    document.getElementById("gsize").addEventListener("change", (e) => { S.gsize = +e.target.value; renderMap(); });
    document.getElementById("gmetric").addEventListener("change", (e) => { S.gmetric = e.target.value; renderMap(); });
    document.getElementById("gdir").addEventListener("change", (e) => { S.gdir = +e.target.value; renderMap(); });
    document.querySelectorAll(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));
    initHover(); initPlay(); initTabs();
    const ql = readParams();
    document.getElementById("mat").checked = S.mat;
    document.getElementById("gsize").value = S.gsize; document.getElementById("gdir").value = S.gdir;
    let l = ql || "en"; if (!ql) try { l = localStorage.getItem("gbs-lang") || ((navigator.language || "").startsWith("sv") ? "sv" : "en"); } catch (e) {}
    setLang(l);
  });
})();
