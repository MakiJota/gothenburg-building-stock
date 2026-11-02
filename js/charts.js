// Charts (D3): diverging in/out bars per period, stock-balance Sankey, cumulative flows.
window.Charts = (function () {
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const S = () => [1, 2, 3, 4, 5, 6, 7, 8].map((i) => css("--s" + i));
  const GREY = "#b8b6ae";
  let F, T, onPeriod, st = { stackBy: "material", period: -1 };
  let tip;

  function showTip(e, html) {
    tip.innerHTML = html; tip.hidden = false;
    const w = tip.offsetWidth, x = e.clientX + 14 + w > innerWidth ? e.clientX - w - 14 : e.clientX + 14;
    tip.style.left = x + "px"; tip.style.top = (e.clientY + 14) + "px";
  }
  const hideTip = () => { tip.hidden = true; };
  const fmt = (v) => (v >= 0.1 ? d3.format(".2f")(v) : d3.format(".3f")(v));
  const plab = (p) => p.replace("-", "–");

  // ---------- 1. diverging bars ----------
  const MAT_GROUPS = ["Concrete", "Sand and Aggregates", "Steel and cast iron", "Insulation (all types)", "Wood"];
  function seriesDef() {
    if (st.stackBy === "material") {
      const keys = [...MAT_GROUPS, "other"], col = S();
      return { keys, color: (k, i) => (k === "other" ? GREY : col[i]),
               label: (k) => (k === "other" ? T.other : T.mat[k]),
               key: (r) => (MAT_GROUPS.includes(r.material) ? r.material : "other"), rows: F.computed.material };
    }
    const keys = ["CMF", "MMF", "WBMF", "WMF", "WSF", "na"], col = S();
    return { keys, color: (k, i) => (k === "na" ? GREY : col[i]), label: (k) => (k === "na" ? "n/a" : k),
             key: (r) => r.typo || "na", rows: F.computed.typology };
  }
  function drawFlows() {
    const el = document.getElementById("ch-flows"); el.innerHTML = "";
    const P = F.labels.periods, def = seriesDef();
    const agg = (dir) => P.map((p) => {
      const o = { period: p }; def.keys.forEach((k) => (o[k] = 0));
      def.rows.forEach((r) => { if (r.dir === dir && r.period === p) o[def.key(r)] += r.Mt; });
      return o;
    });
    const inn = agg("in"), out = agg("out");
    const W = Math.max(640, el.clientWidth), H = 300, m = { t: 12, r: 12, b: 28, l: 44 };
    const x = d3.scaleBand(P, [m.l, W - m.r]).paddingInner(0.28).paddingOuter(0.1);
    const yMax = d3.max(inn, (o) => d3.sum(def.keys, (k) => o[k])), yMin = d3.max(out, (o) => d3.sum(def.keys, (k) => o[k]));
    const y = d3.scaleLinear([-yMin * 1.1, yMax * 1.05], [H - m.b, m.t]).nice();
    const svg = d3.select(el).append("svg").attr("width", W).attr("height", H).attr("role", "img")
      .attr("aria-label", T.ch_flows);
    svg.append("g").attr("class", "gridline").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(6).tickSize(-(W - m.l - m.r)).tickFormat(""));
    // selected-period band
    if (st.period >= 0) svg.append("rect").attr("x", x(P[st.period]) - x.step() * x.paddingInner() / 2).attr("width", x.step())
      .attr("y", m.t).attr("height", H - m.t - m.b).attr("fill", "#efeee9");
    const stack = d3.stack().keys(def.keys);
    const drawStack = (data, sign, dirLab) => {
      const ser = stack(data);
      ser.forEach((s, i) => {
        svg.append("g").selectAll("rect").data(s).join("rect")
          .attr("x", (d) => x(d.data.period)).attr("width", x.bandwidth())
          .attr("y", (d) => y(sign > 0 ? d[1] : -d[0])).attr("height", (d) => Math.abs(y(d[0]) - y(d[1])))
          .attr("fill", def.color(s.key, i)).attr("stroke", css("--surface")).attr("stroke-width", 1)
          .style("cursor", "pointer")
          .on("mousemove", (e, d) => showTip(e, `<b>${plab(d.data.period)}</b> · ${dirLab}<br>${def.label(s.key)}: <b>${fmt(d[1] - d[0])} Mt</b><br>${T.other === "Other" ? "Total" : "Totalt"}: ${fmt(d3.sum(def.keys, (k) => d.data[k]))} Mt`))
          .on("mouseleave", hideTip)
          .on("click", (e, d) => onPeriod(P.indexOf(d.data.period)));
      });
    };
    drawStack(inn, 1, T.inflow); drawStack(out, -1, T.outflow);
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", css("--axis"));
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`)
      .call(d3.axisBottom(x).tickFormat(plab).tickSize(0)).call((g) => g.select(".domain").remove());
    svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(6).tickFormat((v) => d3.format("~g")(Math.abs(v)))).call((g) => g.select(".domain").remove());
    svg.append("text").attr("x", m.l + 4).attr("y", m.t + 10).text("↑ " + T.inflow + " (Mt)");
    svg.append("text").attr("x", m.l + 4).attr("y", H - m.b - 6).text("↓ " + T.outflow + " (Mt)");
    // invisible full-height hit areas for clicking a period
    svg.append("g").selectAll("rect").data(P).join("rect").attr("x", (p) => x(p) - 4).attr("width", x.bandwidth() + 8)
      .attr("y", m.t).attr("height", H - m.t - m.b).attr("fill", "transparent").lower()
      .on("click", (e, p) => onPeriod(P.indexOf(p)));
    document.getElementById("lg-flows").innerHTML =
      def.keys.map((k, i) => `<span><i style="background:${def.color(k, i)}"></i>${def.label(k)}</span>`).join("");
  }

  // ---------- 2. Sankey (paper values) ----------
  function drawSankey() {
    const el = document.getElementById("ch-sankey"); el.innerHTML = "";
    const h = F.paper.headline, W = Math.max(320, el.clientWidth), H = 260;
    const col = S(), stockCol = "#898781";
    const nodes = [
      { id: "s60", name: T.sk_stock60, v: h.stock1960_Mt, c: stockCol },
      { id: "in", name: T.sk_in, v: h.inflow_Mt, c: col[0] },
      { id: "s15", name: T.sk_stock15, v: h.stock2015_Mt, c: stockCol },
      { id: "out", name: T.sk_out, v: h.outflow_Mt, c: col[1] }];
    const links = [
      { source: "s60", target: "s15", value: +(h.stock1960_Mt - h.outflow_Mt).toFixed(2) },
      { source: "s60", target: "out", value: h.outflow_Mt },
      { source: "in", target: "s15", value: h.inflow_Mt }];
    const sk = d3.sankey().nodeId((d) => d.id).nodeWidth(12).nodePadding(26).nodeSort(null)
      .extent([[4, 10], [W - 4, H - 10]]);
    const g = sk({ nodes: nodes.map((d) => ({ ...d })), links: links.map((d) => ({ ...d })) });
    const svg = d3.select(el).append("svg").attr("width", W).attr("height", H).attr("role", "img").attr("aria-label", T.ch_sankey);
    svg.append("g").attr("fill", "none").selectAll("path").data(g.links).join("path")
      .attr("d", d3.sankeyLinkHorizontal()).attr("stroke", (d) => d.source.id === "in" ? col[0] : d.target.id === "out" ? col[1] : "#c9c7bf")
      .attr("stroke-opacity", 0.45).attr("stroke-width", (d) => Math.max(1, d.width))
      .on("mousemove", (e, d) => showTip(e, `${d.source.name} → ${d.target.name}<br><b>${d3.format(".2f")(d.value)} Mt</b>`))
      .on("mouseleave", hideTip);
    svg.append("g").selectAll("rect").data(g.nodes).join("rect")
      .attr("x", (d) => d.x0).attr("y", (d) => d.y0).attr("width", (d) => d.x1 - d.x0).attr("height", (d) => Math.max(2, d.y1 - d.y0))
      .attr("rx", 2).attr("fill", (d) => d.c);
    svg.append("g").selectAll("text").data(g.nodes).join("text")
      .attr("x", (d) => (d.x0 < W / 2 ? d.x1 + 8 : d.x0 - 8)).attr("y", (d) => (d.y0 + d.y1) / 2)
      .attr("text-anchor", (d) => (d.x0 < W / 2 ? "start" : "end")).attr("dominant-baseline", "middle")
      .html((d) => `<tspan style="fill:var(--ink);font-weight:600">${d.name}</tspan> <tspan>${d3.format(".2f")(d.v)} Mt</tspan>`);
  }

  // ---------- 3. cumulative ----------
  function drawCum() {
    const el = document.getElementById("ch-cum"); el.innerHTML = "";
    const P = F.labels.periods, Y = F.labels.years;
    const sum = (dir, p) => d3.sum(F.computed.total.filter((r) => r.dir === dir && r.period === p), (r) => r.Mt);  // Total column, as Table 1
    let ci = 0, co = 0;
    const pts = [{ y: 1960, i: 0, o: 0 }].concat(P.map((p, k) => ({ y: Y[k + 1], i: (ci += sum("in", p)), o: (co += sum("out", p)) })));
    const W = Math.max(320, el.clientWidth), H = 260, m = { t: 14, r: 64, b: 26, l: 36 };
    const x = d3.scaleLinear([1960, 2015], [m.l, W - m.r]), y = d3.scaleLinear([0, d3.max(pts, (d) => d.i) * 1.08], [H - m.b, m.t]).nice();
    const col = S(), svg = d3.select(el).append("svg").attr("width", W).attr("height", H).attr("role", "img").attr("aria-label", T.ch_cum);
    svg.append("g").attr("class", "gridline").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickSize(-(W - m.l - m.r)).tickFormat(""));
    svg.append("g").attr("class", "axis").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(6).tickFormat(d3.format("d"))).call((g) => g.select(".domain").attr("stroke", css("--axis")));
    svg.append("g").attr("class", "axis").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5)).call((g) => g.select(".domain").remove());
    if (st.period >= 0) svg.append("line").attr("x1", x(Y[st.period + 1])).attr("x2", x(Y[st.period + 1])).attr("y1", m.t).attr("y2", H - m.b)
      .attr("stroke", css("--accent")).attr("stroke-dasharray", "3 3");
    const ser = [{ k: "i", c: col[0], l: T.cum_in }, { k: "o", c: col[1], l: T.cum_out }];
    ser.forEach((s) => {
      svg.append("path").datum(pts).attr("fill", "none").attr("stroke", s.c).attr("stroke-width", 2)
        .attr("d", d3.line().x((d) => x(d.y)).y((d) => y(d[s.k])));
      const last = pts[pts.length - 1];
      svg.append("text").attr("x", x(last.y) + 6).attr("y", y(last[s.k])).attr("dominant-baseline", "middle")
        .text(d3.format(".2f")(last[s.k]) + " Mt");
    });
    const cross = svg.append("line").attr("y1", m.t).attr("y2", H - m.b).attr("stroke", css("--muted")).attr("visibility", "hidden");
    const dots = ser.map((s) => svg.append("circle").attr("r", 4).attr("fill", s.c).attr("stroke", css("--surface")).attr("stroke-width", 2).attr("visibility", "hidden"));
    svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", W - m.l - m.r).attr("height", H - m.t - m.b).attr("fill", "transparent")
      .on("mousemove", (e) => {
        const yr = x.invert(d3.pointer(e)[0]), d = pts.reduce((a, b) => (Math.abs(b.y - yr) < Math.abs(a.y - yr) ? b : a));
        cross.attr("x1", x(d.y)).attr("x2", x(d.y)).attr("visibility", "visible");
        dots.forEach((c, k) => c.attr("cx", x(d.y)).attr("cy", y(d[ser[k].k])).attr("visibility", "visible"));
        showTip(e, `<b>${d.y}</b><br>${T.cum_in}: ${fmt(d.i)} Mt<br>${T.cum_out}: ${fmt(d.o)} Mt`);
      })
      .on("mouseleave", () => { cross.attr("visibility", "hidden"); dots.forEach((c) => c.attr("visibility", "hidden")); hideTip(); })
      .on("click", (e) => { const yr = Math.round((x.invert(d3.pointer(e)[0]) - 1960) / 5); if (yr >= 1) onPeriod(yr - 1); });
    document.getElementById("lg-cum").innerHTML = ser.map((s) => `<span><i style="background:${s.c}"></i>${s.l}</span>`).join("");
  }

  function drawAll() { drawFlows(); drawSankey(); drawCum(); }
  let rz;
  return {
    init(flows, cb) {
      F = flows; onPeriod = cb;
      tip = document.createElement("div"); tip.className = "tip"; tip.style.position = "fixed"; tip.hidden = true; document.body.appendChild(tip);
      document.querySelectorAll("#stackby button").forEach((b) => b.addEventListener("click", () => {
        document.querySelectorAll("#stackby button").forEach((x) => x.classList.toggle("on", x === b));
        st.stackBy = b.dataset.s; drawFlows();
      }));
      addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(drawAll, 150); });
    },
    update(strings, period) { T = strings; st.period = period; drawAll(); },
    setPeriod(period) { if (period !== st.period) { st.period = period; drawFlows(); drawCum(); } }
  };
})();
