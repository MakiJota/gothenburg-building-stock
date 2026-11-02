// Report and About pages. Content from the Research Square preprint (doi:10.21203/rs.3.rs-11133928/v1)
// and its Supplementary Materials 1 (predictor definitions) and 2 (machine-learning classification).
// Swedish translation: please review before publishing.
(function () {
  const PREPRINT = "https://www.researchsquare.com/article/rs-11133928/v1";
  const DOI = "https://doi.org/10.21203/rs.3.rs-11133928/v1";
  const fig = (src, cap) => `<figure><a href="img/${src}" target="_blank" rel="noopener"><img loading="lazy" src="img/${src}" alt=""></a><figcaption>${cap}</figcaption></figure>`;
  const nf = (lang) => (v) => (typeof v === "number" ? v.toLocaleString(lang === "sv" ? "sv-SE" : "en-GB") : v);
  const table = (head, rows, opts = {}) => `<div class="tbl"><table${opts.cls ? ` class="${opts.cls}"` : ""}>
    <thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((r) => `<tr${r.cls ? ` class="${r.cls}"` : ""}>${(r.cells || r).map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const cap = (t) => `<p class="tcap">${t}</p>`;

  // ---------- shared data ----------
  const FUNC_TABLE = [ // function, new n, new km2, demolished n, removed km2
    ["res", 33491, 6.35, 613, 0.39], ["aux", 3023, 0.65, 93, 0.02], ["ind", 1830, 3.62, 63, 0.18],
    ["ins", 736, 1.96, 51, 0.07], ["com", 605, 1.07, 130, 0.19]];
  const CM_FUNC = [ // rows = prediction, cols = reference
    ["Auxiliary", 15094, 173, 228, 393, 1079], ["Commercial", 35, 292, 28, 44, 22], ["Industrial", 167, 92, 821, 24, 6],
    ["Institutional", 58, 32, 6, 357, 27], ["Residential", 766, 178, 72, 285, 12988]];
  const CLASS_PERF = [["Auxiliary", .9364, .8908, .8896, .9371, .9136], ["Commercial", .3807, .996, .6936, .9855, .6884],
    ["Industrial", .7108, .991, .7396, .9896, .8509], ["Institutional", .3237, .9962, .7438, .9773, .6599], ["Residential", .9197, .932, .909, .9402, .9259]];
  const IMP_FUNC = [["eqv_rd_", .1884], ["area_m2", .1033], ["frctl__", .0779], ["cnvx_p_", .0373], ["cntrd_ln", .0319],
    ["cntrd_lt", .0306], ["log_are", .0264], ["Len_800_ma", .0228], ["vrtcs__", .0179], ["cmpctns", .0179]];
  const IMP_TYPE = [["area_m2", .4588], ["eqv_rd_", .0788], ["cnvx_p_", .0463], ["cntrd_lt", .0374], ["log_are", .0286],
    ["Len_800_su", .0271], ["cntrd_ln", .0249], ["frctl__", .0223], ["AI_800_max", .0115], ["Len_500_ma", .0114]];
  const VAR = {
    en: { eqv_rd_: "Equivalent radius", area_m2: "Footprint area", frctl__: "Fractal (shape-complexity) proxy", cnvx_p_: "Convex-hull perimeter ratio",
      cntrd_ln: "Centroid longitude", cntrd_lt: "Centroid latitude", log_are: "Log footprint area", Len_800_ma: "Max street-segment length, 800 m",
      vrtcs__: "Vertices per area", cmpctns: "Compactness", Len_800_su: "Total street length, 800 m", AI_800_max: "Max angular closeness, 800 m",
      Len_500_ma: "Max street-segment length, 500 m" },
    sv: { eqv_rd_: "Ekvivalent radie", area_m2: "Byggnadsarea", frctl__: "Fraktalt formkomplexitetsmått", cnvx_p_: "Kvot mot konvext hölje (omkrets)",
      cntrd_ln: "Centroidens longitud", cntrd_lt: "Centroidens latitud", log_are: "Log byggnadsarea", Len_800_ma: "Max gatusegmentlängd, 800 m",
      vrtcs__: "Hörnpunkter per area", cmpctns: "Kompakthet", Len_800_su: "Total gatulängd, 800 m", AI_800_max: "Max vinkelintegration, 800 m",
      Len_500_ma: "Max gatusegmentlängd, 500 m" } };
  const bar = (v, max) => `<span class="ibar"><i style="width:${(100 * v / max).toFixed(1)}%"></i></span>${v.toFixed(3)}`;

  // ---------- diagrams (HTML) ----------
  const detectDiagram = (L) => `
  <div class="diag detect" role="img" aria-label="${L.aria}">
    <div class="dcol"><div class="dh">${L.t0}</div><div class="dh">${L.t1}</div><div class="dh">${L.res}</div></div>
    <div class="drow"><span class="b on"></span><span class="b on"></span><span class="tag p">${L.persist}</span></div>
    <div class="drow"><span class="b on"></span><span class="b off"></span><span class="tag d">${L.demo}</span></div>
    <div class="drow"><span class="b off"></span><span class="b on"></span><span class="tag n">${L.new}</span></div>
  </div>`;
  const cascade = (L) => `
  <div class="diag cascade" role="img" aria-label="${L.aria}">
    <div class="node src">${L.layer}</div><div class="arr">↓</div>
    <div class="node model">${L.m1}<small>XGBoost · 88.8 %</small></div><div class="arr">↓</div>
    <div class="split">
      <div class="branch"><div class="node out">${L.nonres}</div></div>
      <div class="branch"><div class="node mid">${L.res}</div><div class="arr">↓</div>
        <div class="node model">${L.m2}<small>XGBoost · 98.7 %</small></div><div class="arr">↓</div>
        <div class="split">
          <div class="branch"><div class="node mid">${L.sf}</div><div class="arr">↓</div><div class="node out">WSF</div></div>
          <div class="branch"><div class="node mid">${L.mf}</div><div class="arr">↓</div>
            <div class="node model">${L.m3}<small>XGBoost · 88.9 %</small></div><div class="arr">↓</div>
            <div class="node out">CMF · MMF · WBMF · WMF</div></div>
        </div></div>
    </div><div class="arr">↓</div>
    <div class="node mat">${L.mat}</div>
  </div>`;

  const REFS = `
<li>Aksözen, M., Hassler, U., &amp; Kohler, N. (2017). Reconstitution of the dynamics of an urban building stock. <i>Building Research &amp; Information</i>, 45(3), 239–258.</li>
<li>Arbabi, H., Lanau, M., Li, X., et al. (2022). A scalable data collection, characterization, and accounting framework for urban material stocks. <i>Journal of Industrial Ecology</i>, 26(1), 58–71.</li>
<li>Berghauser Pont, M., Stavroulaki, G., Bobkova, E., et al. (2019). The spatial distribution and frequency of street, plot and building types across five European cities. <i>Environment and Planning B</i>, 46(7), 1226–1242.</li>
<li>Bian, X., Berghauser Pont, M., Cohen, J., &amp; Lanau, M. (2026). Enhanced material stock accounting by predicting building structures with morphological indicators.</li>
<li>Bobkova, E., Berghauser Pont, M., &amp; Marcus, L. (2021). Towards analytical typologies of plot systems. <i>Environment and Planning B</i>, 48(4), 604–620.</li>
<li>Brunner, P. H., &amp; Rechberger, H. (2003). <i>Practical Handbook of Material Flow Analysis</i>. CRC Press.</li>
<li>Cord’homme, Z., Dittrich, N., Bringedal Gedde, K., Billy, R. G., &amp; Müller, D. B. (2025). Approaching building lifetimes and hazard rates through demolition patterns. <i>Journal of Industrial Ecology</i>, 29(1), 34–46.</li>
<li>Gontia, P., Nägeli, C., Rosado, L., Kalmykova, Y., &amp; Österbring, M. (2018). Material-intensity database of residential buildings: A case-study of Sweden in the international context. <i>Resources, Conservation and Recycling</i>, 130, 228–239.</li>
<li>Gontia, P., Thuvander, L., Ebrahimi, B., et al. (2019). Spatial analysis of urban material stock with clustering algorithms: A Northern European case study. <i>Journal of Industrial Ecology</i>, 23(6), 1328–1343.</li>
<li>Gontia, P., Thuvander, L., &amp; Wallbaum, H. (2020). Spatiotemporal characteristics of residential material stocks and flows in urban, commuter, and rural settlements. <i>Journal of Cleaner Production</i>, 251, 119435.</li>
<li>Heeren, N., &amp; Hellweg, S. (2019). Tracking construction material over space and time. <i>Journal of Industrial Ecology</i>, 23(1), 253–267.</li>
<li>Hu, M., Van Der Voet, E., &amp; Huppes, G. (2010). Dynamic material flow analysis for strategic construction and demolition waste management in Beijing. <i>Journal of Industrial Ecology</i>, 14(3), 440–456.</li>
<li>Kennedy, C., &amp; Hoornweg, D. (2012). Mainstreaming urban metabolism. <i>Journal of Industrial Ecology</i>, 16(6), 780–782.</li>
<li>Kleemann, F., Lederer, J., Rechberger, H., &amp; Fellner, J. (2017). GIS-based analysis of Vienna’s material stock in buildings. <i>Journal of Industrial Ecology</i>, 21(2), 368–380.</li>
<li>Kohler, N., &amp; Hassler, U. (2002). The building stock as a research object. <i>Building Research &amp; Information</i>, 30(4), 226–236.</li>
<li>Kolkwitz, M., Luotonen, E., &amp; Huuhka, S. (2023). How changes in urban morphology translate into urban metabolisms of building stocks. <i>Environment and Planning B</i>, 50(6), 1559–1576.</li>
<li>Krausmann, F., Wiedenhofer, D., Lauk, C., et al. (2017). Global socioeconomic material stocks rise 23-fold over the 20th century and require half of annual resource use. <i>PNAS</i>, 114(8), 1880–1885.</li>
<li>Lanau, M., Liu, G., Kral, U., et al. (2019). Taking stock of built environment stock studies: Progress and prospects. <i>Environmental Science &amp; Technology</i>, 53(15), 8499–8515.</li>
<li>Lee, D. W., Rogers, M., &amp; Soifer, H. D. (2025). The modifiable areal unit problem in political science. <i>Political Analysis</i>, 33(4), 412–424.</li>
<li>Miatto, A., Schandl, H., Forlin, L., et al. (2019). A spatial analysis of material stock accumulation and demolition waste potential of buildings: A case study of Padua. <i>Resources, Conservation and Recycling</i>, 142, 245–256.</li>
<li>Miatto, A., Schandl, H., &amp; Tanikawa, H. (2017). How important are realistic building lifespan assumptions for material stock and demolition waste accounts? <i>Resources, Conservation and Recycling</i>, 122, 143–154.</li>
<li>Müller, D. B. (2006). Stock dynamics for forecasting material flows — Case study for housing in The Netherlands. <i>Ecological Economics</i>, 59(1), 142–156.</li>
<li>Newman, P. W. G. (1999). Sustainability and cities: Extending the metabolism model. <i>Landscape and Urban Planning</i>, 44(4), 219–226.</li>
<li>Nieves, J. J., Gaughan, A. E., Stevens, F. R., Yetman, G., &amp; Gros, A. (2024). A simulated ‘sandbox’ for exploring the modifiable areal unit problem. <i>Scientific Data</i>, 11(1), 239.</li>
<li>Rosado, L., Kalmykova, Y., &amp; Patrício, J. (2017). Urban metabolism profiles. <i>Journal of Cleaner Production</i>, 163, S254–S266.</li>
<li>Rudin, C. (2019). Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead. <i>Nature Machine Intelligence</i>, 1(5), 206–215.</li>
<li>Schug, F., Frantz, D., Wiedenhofer, D., et al. (2023). High-resolution mapping of 33 years of material stock and population growth in Germany using Earth Observation data. <i>Journal of Industrial Ecology</i>, 27(1), 110–124.</li>
<li>Statistics Sweden (SCB). (2026a). Completed dwellings in newly constructed buildings by region, type of building and size of dwelling, 1975–2025.</li>
<li>Statistics Sweden (SCB). (2026b). Demolition of dwellings in multi-dwelling buildings by region, type of ownership, period of construction, size of dwelling and reason for demolition.</li>
<li>Stavroulaki, I., Marcus, L., Berghauser Pont, M., Abshirini, E., Sahlberg, J., &amp; Örnö Ax, A. (2025). <i>GIS-based Time Model, Gothenburg, 1960–2015</i> (Version 2) [Data set]. Chalmers University of Technology. https://doi.org/10.5878/MA55-R589</li>
<li>Tanikawa, H., &amp; Hashimoto, S. (2009). Urban stock over time: Spatial material stock analysis using 4d-GIS. <i>Building Research &amp; Information</i>, 37(5–6), 483–502.</li>
<li>Tümtürk, O., Karakiewicz, J., &amp; De Haan, F. J. (2025). The impact of urban form on physical change. <i>Environment and Planning B</i>, 52(5), 1035–1054.</li>
<li>Wolman, A. (1965). The metabolism of cities. <i>Scientific American</i>, 213(3), 178–190.</li>
<li>Zhang, Y. (2013). Urban metabolism: A review of research methodologies. <i>Environmental Pollution</i>, 178, 463–473.</li>`;

  // ---------- localisable building blocks ----------
  function blocks(lang) {
    const n = nf(lang), sv = lang === "sv", pct = (v) => (v * 100).toFixed(1).replace(".", sv ? "," : ".") + " %";
    const d = (v, k = 2) => (sv ? v.toFixed(k).replace(".", ",") : v.toFixed(k));
    const FN = sv ? { res: "Bostäder", aux: "Komplementbyggnader", ind: "Industri", ins: "Samhällsfunktioner", com: "Handel" }
                  : { res: "Residential", aux: "Auxiliary", ind: "Industrial", ins: "Institutional", com: "Commercial" };
    const CL = sv ? { Auxiliary: "Komplement", Commercial: "Handel", Industrial: "Industri", Institutional: "Samhällsfunktion", Residential: "Bostad" }
                  : { Auxiliary: "Auxiliary", Commercial: "Commercial", Industrial: "Industrial", Institutional: "Institutional", Residential: "Residential" };
    const tot = FUNC_TABLE.reduce((a, r) => [a[0] + r[1], a[1] + r[2], a[2] + r[3], a[3] + r[4]], [0, 0, 0, 0]);
    return {
      funcTable: table(
        sv ? ["Funktion", "Nya byggnader", "Tillkommen byggnadsarea (km²)", "Rivna byggnader", "Riven byggnadsarea (km²)"]
           : ["Function", "New buildings", "Added footprint (km²)", "Demolished buildings", "Removed footprint (km²)"],
        FUNC_TABLE.map((r) => [FN[r[0]], n(r[1]), d(r[2]), n(r[3]), d(r[4])])
          .concat([{ cls: "tot", cells: [sv ? "Totalt" : "Total", n(tot[0]), d(tot[1]), n(tot[2]), d(tot[3])] }])),
      regTable: table(
        sv ? ["Modell", "Enheter", "Koefficient", "SE / 95 % KI", "R²"] : ["Model", "Units", "Coefficient", "SE / 95 % CI", "R²"],
        [[sv ? "OLS, log-log" : "OLS, log-log", "DeSO", d(0.86), "SE 0.058", d(0.439, 3)],
         [sv ? "Kvantilregression q10" : "Quantile regression q10", "DeSO", d(0.67), "0.32–0.82", "—"],
         [sv ? "Kvantilregression q90" : "Quantile regression q90", "DeSO", d(1.04), "0.98–1.09", "—"],
         [sv ? "OLS, log-log" : "OLS, log-log", sv ? "23 mellanområden" : "23 Mellan areas", d(0.55), "SE 0.174 (p = 0.0047)", d(0.323, 3) + (sv ? " (just. 0,291)" : " (adj. 0.291)")]]),
      table2: table(
        sv ? ["Göteborg", "1960", "Nettotillskott", "2015", "Ökning"] : ["Gothenburg", "1960", "Net addition", "2015", "Increase"],
        [[sv ? "Befolkning" : "Population", n(443843), n(128956), n(572799), "29 %"],
         [sv ? "Befolkningstäthet (inv./km²)" : "Population density (inh./km²)", d(992.9, 1), "", d(1281.4, 1), ""],
         [sv ? "Total byggnadsarea (km²)" : "Total footprint (km²)", d(10.8, 1), d(13.1, 1), d(23.9, 1), "121 %"],
         [sv ? "Bostäders byggnadsarea (km²)" : "Residential footprint (km²)", d(5.8, 1), d(5.9, 1), d(11.7, 1), "102 %"],
         [sv ? "Bostäders BTA (km²)" : "Residential GFA (km²)", d(17.7, 1), d(18.0, 1), d(35.7, 1), "102 %"],
         [sv ? "Materialbestånd i bostäder (Mt)" : "Residential material stock (Mt)", d(24.971, 3), d(9.7, 1), d(34.72), "39 %"],
         [sv ? "Bestånd per invånare (t)" : "Stock per capita (t)", d(56.3, 1), d(75.6, 1) + "*", d(60.6, 1), "8 %"]]) +
        cap(sv ? "* Nettoackumulering av bostadsmaterial per tillkommande invånare." : "* Net residential material accumulation per additional inhabitant."),
      mlSummary: table(
        sv ? ["Klassificeringsuppgift", "Klasser", "Observationer", "Prediktorer", "Träning", "Test", "Vald modell", "CV", "Test-träffsäkerhet", "κ"]
           : ["Classification task", "Classes", "Observations", "Predictors", "Training", "Test", "Selected model", "CV", "Holdout accuracy", "κ"],
        [[sv ? "Bostäders konstruktionstypologi" : "Residential structural typology", 4, n(331), 71, 250, 81, "XGBoost", pct(.8602), pct(.8889), d(.8508, 3)],
         [sv ? "Byggnadsfunktion (grupperad)" : "Grouped building function", 5, n(166346), 66, n(133080), n(33266), "XGBoost", pct(.8865), pct(.8883), d(.8036, 3)],
         [sv ? "Småhus / flerbostadshus" : "Single- / multifamily", 2, n(70613), 66, n(56491), n(14122), "XGBoost", pct(.9859), pct(.9871), d(.9423, 3)]]),
      typoTables:
        table(sv ? ["Typologi", "Observationer"] : ["Typology", "Observations"], [["CMF", 111], ["MMF", 78], ["WBMF", 73], ["WMF", 69], [sv ? "Totalt" : "Total", 331]]) +
        table(sv ? ["Modell", "Upprepad 5-faldig CV", "SD", "Test-träffsäkerhet", "κ"] : ["Model", "Repeated 5-fold CV", "SD", "Holdout accuracy", "κ"],
          [["Ranger (500 trees, mtry 16)", pct(.8481), "—", pct(.8765), d(.8342, 3)], ["<b>XGBoost</b>", `<b>${pct(.8602)}</b>`, d(.0351, 4), `<b>${pct(.8889)}</b>`, `<b>${d(.8508, 3)}</b>`]]) +
        cap(sv ? "Vald XGBoost-konfiguration: 100 iterationer, maxdjup 4, η 0,2, γ 0, colsample 1, min_child_weight 1, subsample 1, multi:softmax. 432 hyperparameterkombinationer prövades; 72 av 81 testbyggnader klassades rätt."
               : "Selected XGBoost configuration: 100 rounds, max depth 4, η 0.2, γ 0, colsample 1, min child weight 1, subsample 1, multi:softmax. 432 hyper-parameter combinations were evaluated; 72 of 81 holdout buildings were classified correctly.") +
        table(sv ? ["Prediktor (explorativ Random Forest)", "Full modell, MDA", "Förenklad modell"] : ["Predictor (exploratory Random Forest)", "Full model, MDA", "Simplified model"],
          (sv ? [["Byggår", 21.571, 27.782], ["Byggnadshöjd", 11.216, 10.015], ["Antal våningar", 11.134, 11.922], ["Avrundad höjd", 9.929, 11.906], ["Byggnadsvolym", 5.773, 5.591], ["Bruttoarea", 5.641, 5.968], ["Omkrets/area", 3.987, 5.14], ["Kompakthet", 3.241, 3.801], ["Medel vinkel-betweenness, 800 m", null, 5.301], ["Total gatulängd, 500 m", null, 4.15]]
              : [["Construction year", 21.571, 27.782], ["Building height", 11.216, 10.015], ["Number of floors", 11.134, 11.922], ["Rounded height", 9.929, 11.906], ["Building volume", 5.773, 5.591], ["Gross floor area", 5.641, 5.968], ["Perimeter-to-area", 3.987, 5.14], ["Compactness", 3.241, 3.801], ["Mean angular betweenness, 800 m", null, 5.301], ["Total street length, 500 m", null, 4.15]])
          .map((r) => [r[0], r[1] == null ? "—" : d(r[1], 3), d(r[2], 3)])),
      funcTables:
        table(sv ? ["Funktion", "Byggnader", "Andel"] : ["Function", "Buildings", "Share"],
          [[CL.Auxiliary, n(80604), "48.5 %"], [CL.Residential, n(70613), "42.5 %"], [CL.Industrial, n(5777), "3.5 %"], [CL.Institutional, n(5516), "3.3 %"], [CL.Commercial, n(3836), "2.3 %"], [sv ? "Totalt" : "Total", n(166346), "100 %"]]) +
        table(sv ? ["Modell", "CV-träffsäkerhet", "Test-träffsäkerhet", "κ"] : ["Model", "CV accuracy", "Holdout accuracy", "κ"],
          [["Random Forest (200 trees, mtry 22)", pct(.8775), pct(.8794), d(.7858, 3)], ["<b>XGBoost</b>", `<b>${pct(.8865)}</b> (SD 0.0015)`, `<b>${pct(.8883)}</b>`, `<b>${d(.8036, 3)}</b>`]]) +
        cap(sv ? "XGBoost: η 0,08, maxdjup 8, subsample 0,8, colsample 0,8, 250 iterationer. 95 % KI för träffsäkerhet 0,8849–0,8917; informationslös nivå 0,4846."
               : "XGBoost: η 0.08, max depth 8, subsample 0.8, colsample 0.8, 250 rounds. 95 % CI of accuracy 0.8849–0.8917; no-information rate 0.4846.") +
        `<h4>${sv ? "Förväxlingsmatris (testdata, rader = prediktion)" : "Confusion matrix (holdout, rows = prediction)"}</h4>` +
        table([sv ? "Prediktion \\ Referens" : "Prediction \\ Reference", ...Object.keys(CL).map((k) => CL[k])],
          CM_FUNC.map((r) => [CL[r[0]], ...r.slice(1).map((v, i) => (Object.keys(CL)[i] === r[0] ? `<b>${n(v)}</b>` : n(v)))]), { cls: "cm" }) +
        table([sv ? "Klass" : "Class", sv ? "Sensitivitet" : "Sensitivity", sv ? "Specificitet" : "Specificity", "PPV", "NPV", sv ? "Balanserad träffsäkerhet" : "Balanced accuracy"],
          CLASS_PERF.map((r) => [CL[r[0]], ...r.slice(1).map((v) => d(v, 3))])) +
        `<h4>${sv ? "Viktigaste prediktorer (XGBoost gain)" : "Top predictors (XGBoost gain)"}</h4>` +
        table([sv ? "Variabel" : "Variable", "Gain"], IMP_FUNC.map((r) => [VAR[lang][r[0]], bar(r[1], .19)]), { cls: "imp" }),
      typeTables:
        table(sv ? ["Bostadstyp", "Byggnader", "Andel"] : ["Residential type", "Buildings", "Share"],
          [[sv ? "Småhus" : "Single-family", n(61317), "86.8 %"], [sv ? "Flerbostadshus" : "Multifamily", n(9296), "13.2 %"]]) +
        table(sv ? ["Modell", "CV-träffsäkerhet", "Test-träffsäkerhet", "κ"] : ["Model", "CV accuracy", "Holdout accuracy", "κ"],
          [["Random Forest", pct(.9824), pct(.9835), d(.9256, 3)], ["<b>XGBoost</b>", `<b>${pct(.9859)}</b> (SD 0.0019)`, `<b>${pct(.9871)}</b>`, `<b>${d(.9423, 3)}</b>`]]) +
        table([sv ? "Prediktion \\ Referens" : "Prediction \\ Reference", sv ? "Flerbostadshus" : "Multifamily", sv ? "Småhus" : "Single-family"],
          [[sv ? "Flerbostadshus" : "Multifamily", `<b>${n(1717)}</b>`, n(40)], [sv ? "Småhus" : "Single-family", n(142), `<b>${n(12223)}</b>`]], { cls: "cm" }) +
        table([sv ? "Variabel" : "Variable", "Gain"], IMP_TYPE.map((r) => [VAR[lang][r[0]], bar(r[1], .46)]), { cls: "imp" }),
      predictors: table(sv ? ["Grupp", "Mått"] : ["Group", "Measures"], sv ? [
          ["Storlek", "byggnadsarea, omkrets, log-area, log-omkrets, ekvivalent radie, centroidens koordinater"],
          ["Form", "formindex, avgränsande rektangel (bredd, höjd, area), elongation, rektangularitet, bildförhållande, areaeffektivitet"],
          ["Komplexitet", "konvext hölje (area, omkrets), konvexitet, omkretseffektivitet, hål, hörnpunkter, delar, hörn per area, fraktalt mått, komplexitetspoäng"],
          ["Byggnad (typologimodell)", "byggår, höjd, avrundad höjd, våningar, volym, BTA"],
          ["Gatunät", "vinkel-betweenness (NB), vinkelintegration (AI) och gatulängd inom 250, 500 och 800 m: medel, summa, antal, max"]]
        : [["Size", "footprint area, perimeter, log area, log perimeter, equivalent radius, centroid coordinates"],
          ["Shape", "shape index, bounding box (width, height, area), elongation, rectangularity, aspect ratio, area efficiency"],
          ["Complexity", "convex hull (area, perimeter), convexity, perimeter efficiency, holes, vertices, parts, vertices per area, fractal proxy, complexity score"],
          ["Building (typology model)", "construction year, height, rounded height, floors, volume, GFA"],
          ["Street network", "angular betweenness (NB), angular integration (AI) and street length within 250, 500 and 800 m: mean, sum, count, max"]], { cls: "txt" })
    };
  }

  const toc = (items) => `<nav class="toc" aria-label="Contents"><div class="toct">${items[0]}</div><ol>${items.slice(1).map(([id, t]) => `<li><a href="#${id}">${t}</a></li>`).join("")}</ol></nav>`;

  // =====================================================================
  const en = {
    report: () => { const B = blocks("en"); return `
${toc(["Contents", ["r-abs", "Abstract"], ["r-bg", "Background"], ["r-data", "Data"], ["r-meth", "Methods"], ["r-res", "Results"], ["r-disc", "Discussion"], ["r-lim", "Limitations"], ["r-conc", "Conclusion"], ["r-app", "Appendix"], ["r-ml", "Machine learning"], ["r-ref", "References"]])}
<article class="rep">
<h2 id="r-abs">From urban growth to material accumulation</h2>
<p class="lede">Reconstructing building stock dynamics in Gothenburg, from 1960 to 2015.</p>
<div class="callout">Summary of the preprint <a href="${PREPRINT}" target="_blank" rel="noopener">Research Square rs-11133928/v1</a>. Numbers are as reported there; please cite the preprint.</div>
<p>Urban building stocks accumulate large quantities of materials, but their long-term development is difficult to reconstruct at the building level because historical inventories often lack consistent information on building attributes and turnover. This study develops a spatially and temporally explicit framework that integrates historical GIS, building morphology, street-network characteristics and machine-learning-based attribute enrichment, and applies it to Gothenburg, 1960–2015.</p>
<div class="figs4">
  <div><b>+29 %</b><span>population</span></div><div><b>+102 %</b><span>residential floor area</span></div>
  <div><b>+39 %</b><span>residential material stock</span></div><div><b>9.75 Mt</b><span>net accumulation (10.9 in, 1.14 out)</span></div>
</div>
<p>Construction and material inflows were concentrated in the late 1960s and early 1970s and distributed unevenly across the city. Contemporary population density was positively associated with cumulative material-inflow density but explained only part of its spatial variation.</p>

<h2 id="r-bg">Background</h2>
<p>Cities exchange materials and energy with their surroundings; urban metabolism describes them in terms of inputs, transformations, stocks and outputs, and material flow analysis (MFA) quantifies what enters, accumulates and leaves. Buildings retain materials for decades or centuries, linking past resource use to future waste and recovery. Global socioeconomic material stocks grew about 23-fold between 1900 and 2010 (≈792 Gt), and roughly half of annual extraction was used to build or renew them (Krausmann et al., 2017).</p>
<p>Building stocks evolve through construction, persistence, transformation and demolition. Stock-driven dynamic models derive flows from demand and lifetime assumptions, but demolition is not determined by age alone, and lifetime assumptions strongly affect outflow estimates (Miatto et al., 2017; Cord’homme et al., 2025). Bottom-up, spatially explicit studies estimate materials per building from geometry, period, function and structure, but historical inventories often lack those attributes, and construction and demolition are usually inferred rather than observed.</p>
<p>This study closes that gap by combining observed turnover from successive historical layers, machine-learning enrichment of missing attributes, and material accounting within one building-level framework spanning eleven five-year periods.</p>
<h3>Research questions</h3>
<ol>
  <li>How did Gothenburg's building stock evolve spatially and temporally between 1960 and 2015, and where were construction and demolition concentrated?</li>
  <li>How are spatial patterns of residential material accumulation and turnover related to population density, building characteristics and urban spatial structure?</li>
</ol>

<h2 id="r-data">Data</h2>
<p>The analysis uses the <i>GIS-based Time Model of Gothenburg, 1960–2015</i> (Stavroulaki et al., 2025): twelve historical representations of the city's buildings and street network at five-year intervals. Building layers contain individual polygons with construction year, footprint area, gross floor area (GFA), height and number of floors.</p>
<p>Geometric, morphological and street-network indicators were derived for every building, using the building and network layers of the same period so that each building is described in the urban context in which it existed. Contemporary building data provided labels for the function model; a labelled sample of residential buildings (Bian et al., 2026) trained the structural-typology model. Material-intensity coefficients come from Gontia et al. (2018); 2015 population by DeSO area from Statistics Sweden.</p>
${B.predictors}
${cap("Predictor groups (Supplementary Material 1). Street-network measures are computed with angular segment analysis on the network of the same year.")}

<h2 id="r-meth">Methods</h2>
<p>The reconstruction follows a sequential, building-level framework in four steps.</p>
${fig("fig1.png", "Figure 1. Methodological framework for the reconstruction of Gothenburg's building stock and residential material stocks and flows.")}
<h3>Step 1 — Training the classifiers</h3>
<p><b>Residential structural typology.</b> 331 labelled residential buildings: CMF (111), MMF (78), WBMF (73) and WMF (69). WSF was excluded for lack of labels and is instead assigned to single-family buildings. Random Forest, Ranger and XGBoost were compared; Ranger and XGBoost were tuned with five-fold cross-validation repeated three times. XGBoost (71 predictors, 100 rounds) reached 86.0 % cross-validated and 88.9 % holdout accuracy (κ = 0.851).</p>
<p><b>Building function.</b> 166,346 contemporary buildings. The seven original categories were grouped: Public Service → Institutional; Accessory, Farm and Other → Auxiliary. XGBoost on 66 predictors reached 88.7 % cross-validated and 88.8 % holdout accuracy (κ = 0.804). A separate model split residential buildings into single- and multifamily (98.7 % holdout accuracy).</p>
<h3>Step 2 — Detecting construction and demolition</h3>
<p>Consecutive layers were compared at five-year intervals. Detection is independent of the classifications.</p>
${detectDiagram({ aria: "Detection rule", t0: "Layer t", t1: "Layer t+5", res: "Interpretation", persist: "Persisting stock", demo: "Demolished in (t, t+5]", new: "New in (t, t+5]" })}
<h3>Step 3 — Predicting attributes of the historical stock</h3>
<p>The trained models were applied in sequence to every historical layer, with predictors computed from that layer's buildings and street network.</p>
${cascade({ aria: "Classification cascade", layer: "Historical building layer (each period)", m1: "Building-function model", nonres: "Auxiliary · Commercial · Industrial · Institutional", res: "Residential", m2: "Single- / multifamily model", sf: "Single-family", mf: "Multifamily", m3: "Structural-typology model", mat: "GFA × material intensity (17 materials) → stocks, inflows, outflows" })}
<h3>Step 4 — Residential materials</h3>
<p>Each residential building's GFA was multiplied by typology-specific material-intensity coefficients (Gontia et al., 2018) for 17 material categories. Inflows are the materials in newly constructed buildings, outflows those in demolished buildings, and net accumulation their difference per period. Because every quantity stays attached to a building, stocks and flows can be aggregated by period, place, typology and material.</p>
<h3>Spatial and statistical analysis</h3>
<p>Changes were summarised by period, function, typology and material; spatial patterns were examined with building-level maps, kernel densities of constructed and demolished area, and distance profiles from Gothenburg Central Station. For the population analysis, residential inflows 1960–2015 were aggregated to DeSO areas, divided by area, log-transformed and related to log 2015 population density with OLS and conditional quantile regression (interpreted as associations, not causal effects).</p>

<h2 id="r-res">Results</h2>
<h3>Evolution of the building stock</h3>
<p>Comparison of consecutive layers identified <b>39,685 newly constructed</b> and <b>950 demolished</b> buildings, about 13.6 km² of added and 0.85 km² of removed footprint. Construction and demolition concentrated in the historic core and around the Central Station; further construction clustered in Angered and Gunnared, Västra Frölunda/Frölunda Torg, Torslanda and other parts of Hisingen.</p>
${B.funcTable}
${cap("Constructions and demolitions by function, 1960–2015.")}
${fig("fig2a.jpeg", "Figure 2a. Examples of detected building additions and removals in selected areas.")}
${fig("fig2b.png", "Figure 2b. Kernel-density estimates of construction and demolition based on added and removed building area.")}
<p>Demolition was concentrated in the earliest periods and declined thereafter; residential buildings accounted for most demolitions, while industrial, institutional and commercial buildings contributed large shares of removed footprint and GFA relative to their numbers. Few demolitions were identified after 1990.</p>
${fig("fig3a.png", "Figure 3a. Demolished buildings by period and function: count, footprint and GFA.")}
<p>New construction peaked in the late 1960s and early 1970s: 5,225 additions in 1965–1970 and 5,853 in 1970–1975. Yet new GFA fell from about 3.57 km² to 2.34 km² between those periods, so the period with most buildings was not the one with most floor area. Construction declined in the 1980s and 1990s and rose again in the 2000s by footprint and GFA (2,381, 2,074 and 1,344 additions in the last three periods).</p>
${fig("fig3b.png", "Figure 3b. Newly constructed buildings by period and function: count, footprint and GFA.")}
<p>Residential construction concentrated 5–10 km from the Central Station (largest additions at 7–9 km); commercial construction mostly within 5 km; industrial construction at 5–7 km and 11–12 km.</p>
${fig("fig3c.png", "Figure 3c. Newly constructed GFA by distance from Gothenburg Central Station for residential, industrial and commercial buildings. Lines: GFA per distance band; shaded areas: cumulative GFA.")}
<p>Total footprint grew from about 10.8 km² (1960) to 23.9 km² (2015), +121 %. Residential footprint grew from 5.8 to 11.7 km² and residential GFA from 17.7 to 35.7 km², both about +102 %, while population rose from 443,843 to 572,799 (+29 %).</p>

<h3>Residential material stock and flows</h3>
<p>The residential material stock grew from about <b>24.97 Mt</b> in 1960 to <b>34.72 Mt</b> in 2015. About <b>10.89 Mt</b> entered through new construction, 6.84 Mt (63 %) of it between 1960 and 1975; the largest five-year inflow was 3.28 Mt in 1965–1970, falling to 1.90 Mt in 1970–1975 even though more buildings were added. Identified demolition released about <b>1.14 Mt</b>, with the largest outflow in 1970–1975 (0.44 Mt) and limited or no identified outflows in several later intervals.</p>
${fig("fig4a.png", "Figure 4a. Demolished residential buildings by period and structural typology: count, footprint and GFA.")}
${fig("fig4b.png", "Figure 4b. Newly constructed residential buildings by period and structural typology: count, footprint and GFA.")}
<p>WMF buildings contributed the largest share of cumulative construction inflows, followed by CMF, WBMF and WSF.</p>
${fig("fig4c.png", "Figure 4c. Cumulative residential material inflows from new construction, 1960–2015, by structural typology.")}

<h3>Population density and material accumulation</h3>
<p>Majorna–Stigberget–Masthugget, Krokslätt–Johanneberg, Olivedal–Haga–Annedal–Änggården and Frölunda Torg–Tofta combine high population density with high cumulative inflow density; parts of Angered, Bergsjön and Älvsborg hold large inflows relative to their 2015 density. At DeSO level a 10 % difference in population density goes with about 8.6 % higher inflow density; the association is stronger in the upper part of the distribution and weaker at the coarser Mellan scale.</p>
${B.regTable}
${cap("Log-log association between 2015 population density and cumulative residential material-inflow density, 1960–2015.")}
${fig("fig5.png", "Figure 5. Bivariate map of 2015 population density and cumulative material-inflow density across DeSO areas, with OLS and 10th/90th quantile regression lines.")}

<h3>Distance from the centre</h3>
<p>Residential inflows peak about 8 km from the Central Station, with further concentrations around 6 and 13 km, and drop beyond 15 km. CMF inflows lie mainly at 2–9 km (peaks near 6 and 8 km); WBMF spreads more widely but centres on 5–10 km; WMF has several peaks at 5–9 km plus 12–15 km; WSF lies furthest out, at 7–10 and 13–15 km. Inflows of the 1960s sit at 5–8 km, the 1970s show the largest concentration at 6–8 km, and later decades are smaller and more dispersed.</p>
${fig("fig6a.png", "Figure 6a. Total residential material inflow by distance band from the Central Station.")}
${fig("fig6b.png", "Figure 6b. Residential material inflow by distance and structural typology.")}
${fig("fig6c.png", "Figure 6c. Residential material inflow by distance and construction decade.")}

<h3>Material composition</h3>
<p>Concrete is the largest share of both inflows and outflows, followed by sand and aggregates and steel and cast iron. Outflows peaked in 1970–1975, then 1965–1970 and 1960–1965; inflows peaked in 1965–1970, declined in the 1980s and 1990s and rose again in the 2000s.</p>
${fig("fig7a.png", "Figure 7a. Absolute and relative composition of material outflows from demolished residential buildings by period.")}
${fig("fig7b.png", "Figure 7b. Absolute and relative composition of material inflows from new residential buildings by period.")}
${fig("fig7c.png", "Figure 7c. Cumulative residential material inflows by material category.")}
<p>The largest and most concentrated inflows occurred during the 1960s and 1970s, especially in southern and south-western Gothenburg and north and east of the centre. After 1975 inflows became smaller and more dispersed.</p>
${fig("fig8.png", "Figure 8. Spatial concentration of residential material inflows in each five-year period (lighter = higher).")}

<h2 id="r-disc">Discussion</h2>
<h3>Urban growth and material accumulation</h3>
<p>Residential floor area grew three to four times faster than population, so demographic change alone does not describe the city's physical expansion — a divergence also found across Swedish municipalities and in Germany (Gontia et al., 2020; Schug et al., 2023). Building counts, GFA and material inflows followed different temporal patterns, so counts alone understate the physical magnitude of growth. Official dwelling statistics show the same broad trajectory (low construction in the 1980s–1990s, renewed growth after 2000), supporting plausibility but not validating absolute numbers. Inflows exceeded identified outflows throughout: the residential stock stayed in net accumulation.</p>
<h3>Spatial patterns</h3>
<p>The present geography of residential materials reflects successive development waves with different typologies and locations. Population density captures only part of it (R² ≈ 0.44), and the relationship weakens when aggregated to Mellan areas — consistent with the modifiable areal unit problem. The DeSO and Mellan results are complementary views at different resolutions. Plots, ownership and regulation may shape where intensification and replacement occur; the building-level reconstruction provides a basis for testing that.</p>
<h3>Methodological contribution</h3>
<p>The framework integrates observed turnover, machine-learning enrichment, temporally consistent spatial context and material accounting, without relying on assumed lifetimes. Every stock and flow keeps its building-level origin, so it can be traced in time and space.</p>

<h2 id="r-lim">Limitations and future research</h2>
<ul>
  <li><b>Source completeness.</b> Historical data vary in completeness; low demolition counts after 1990 should not be read as an absence of demolition.</li>
  <li><b>Classification uncertainty.</b> XGBoost gives no standard errors per prediction and its probabilities are not calibrated; this uncertainty, and variation in material intensities, is not propagated. Commercial and Institutional predictions are the least reliable (sensitivity 0.38 and 0.32).</li>
  <li><b>System boundary.</b> Residential buildings and whole-building construction and demolition only. Roads, pipes and other infrastructure (≈28 % of Gothenburg's built-environment stock; Gontia et al., 2019), renovation, extensions and partial demolition are excluded.</li>
  <li><b>Population analysis</b> compares 2015 density with flows accumulated since 1960 and depends on the spatial units.</li>
</ul>
<p>Future work: extend accounting to non-residential buildings and infrastructure, include renovation and partial transformation, and propagate classification and material-intensity uncertainty.</p>

<h2 id="r-conc">Conclusion</h2>
<p>Applied to Gothenburg 1960–2015, the framework identified construction and demolition at five-year intervals and quantified the associated residential material flows. Population grew by about 29 % while residential footprint and GFA roughly doubled. About 10.89 Mt of residential materials entered the stock, concentrated in the first fifteen years; demolition outflows were much smaller and early. Inflows concentrated 5–10 km from the Central Station and varied by typology and decade, and contemporary population density captures only part of that historical geography. By keeping the location and temporal status of each building, the framework moves beyond static inventories towards an empirical account of how material stocks are formed and modified.</p>

<h2 id="r-app">Appendix</h2>
<h3>Table 1. Residential counts, footprint, GFA and material mass per period</h3>
<div id="table1"></div>
<h3>Table 2. Stock at the start and end of the period</h3>
${B.table2}

<h2 id="r-ml">Machine-learning classification</h2>
<p>From Supplementary Material 2. For each task the data were split into training and independent holdout sets; classifiers were compared by cross-validation on the training data, the best model was chosen on cross-validated accuracy, and the holdout set was used only for the final evaluation. R 4.5.1 with caret, xgboost, ranger, sf and dplyr.</p>
${B.mlSummary}
<h3>Residential structural typology</h3>
<p>71 predictors (39 network, 32 morphology/geometry). Preliminary comparisons with 33-, 46- and 91-variable representations were treated as exploratory; final selection compared Ranger and XGBoost on the same data. The importance values below come from exploratory Random Forest models, not the final XGBoost model.</p>
${B.typoTables}
<h3>Grouped building function</h3>
<p>The labelled data are strongly imbalanced, which matters for interpreting overall accuracy. Performance is strongest for Auxiliary and Residential; Commercial and Institutional results should be read with more caution.</p>
${B.funcTables}
<h3>Single- versus multifamily residential</h3>
<p>Footprint area dominates the distinction, followed by size, shape, location and street-network context.</p>
${B.typeTables}

<h2 id="r-ref">References</h2>
<ol class="refs">${REFS}</ol>
</article>`; },
    about: () => `
<h2>About</h2>
<p class="lede">This site accompanies the preprint <i>From Urban Growth to Material Accumulation: Reconstructing Building Stock Dynamics in Gothenburg, from 1960 to 2015</i>.</p>
<ul class="links">
  <li><span>Preprint (Research Square)</span><a href="${PREPRINT}" target="_blank" rel="noopener">researchsquare.com/article/rs-11133928/v1</a></li>
  <li><span>ORCID</span><a href="https://orcid.org/0000-0001-5252-6504" target="_blank" rel="noopener">0000-0001-5252-6504</a></li>
  <li><span>Website</span><a href="https://nodalworks.se/" target="_blank" rel="noopener">nodalworks.se</a></li>
  <li><span>LinkedIn</span><a href="https://www.linkedin.com/in/phd-cohen-urban-data/" target="_blank" rel="noopener">linkedin.com/in/phd-cohen-urban-data</a></li>
  <li><span>Email</span><span>cohen.jota@gmail.com</span></li>
</ul>
<h3>How to cite</h3>
<p class="cite">Cohen, J. (2026). From Urban Growth to Material Accumulation: Reconstructing Building Stock Dynamics in Gothenburg, from 1960 to 2015. <i>Research Square</i> (preprint). ${DOI}</p>
<h3>About the map</h3>
<p>Buildings are shown as pre-rendered raster images; no building geometries or attributes are distributed. The grid layer sums buildings by the cell containing each building. Study area: the analysis square used in the preprint. Source data: GIS-based Time Model of Gothenburg 1960–2015 (Stavroulaki et al., 2025, Chalmers University of Technology, doi:10.5878/MA55-R589). Basemap © Esri, HERE, Garmin, © OpenStreetMap contributors.</p>
`
  };

  // =====================================================================
  const sv = {
    report: () => { const B = blocks("sv"); return `
${toc(["Innehåll", ["r-abs", "Sammanfattning"], ["r-bg", "Bakgrund"], ["r-data", "Data"], ["r-meth", "Metod"], ["r-res", "Resultat"], ["r-disc", "Diskussion"], ["r-lim", "Begränsningar"], ["r-conc", "Slutsats"], ["r-app", "Bilaga"], ["r-ml", "Maskininlärning"], ["r-ref", "Referenser"]])}
<article class="rep">
<h2 id="r-abs">Från stadstillväxt till materialackumulering</h2>
<p class="lede">Rekonstruktion av byggnadsbeståndets dynamik i Göteborg 1960–2015.</p>
<div class="callout">Sammanfattning av preprinten <a href="${PREPRINT}" target="_blank" rel="noopener">Research Square rs-11133928/v1</a>. Siffrorna är de som redovisas där; citera gärna preprinten.</div>
<p>Städers byggnadsbestånd ackumulerar stora mängder material, men deras långsiktiga utveckling är svår att rekonstruera på byggnadsnivå eftersom historiska register ofta saknar konsekvent information om byggnaders egenskaper och omsättning. Studien utvecklar ett rumsligt och tidsmässigt explicit ramverk som kombinerar historisk GIS, byggnadsmorfologi, gatunätets egenskaper och maskininlärning, och tillämpar det på Göteborg 1960–2015.</p>
<div class="figs4">
  <div><b>+29 %</b><span>befolkning</span></div><div><b>+102 %</b><span>bostäders bruttoarea</span></div>
  <div><b>+39 %</b><span>materialbestånd i bostäder</span></div><div><b>9,75 Mt</b><span>nettoackumulering (10,9 in, 1,14 ut)</span></div>
</div>
<p>Nybyggnad och materialinflöden koncentrerades till slutet av 1960-talet och början av 1970-talet och fördelades ojämnt över staden. Dagens befolkningstäthet har ett positivt samband med det ackumulerade materialinflödet men förklarar bara en del av dess rumsliga variation.</p>

<h2 id="r-bg">Bakgrund</h2>
<p>Städer utbyter material och energi med sin omgivning; urban metabolism beskriver dem i termer av tillförsel, omvandling, bestånd och utflöden, och materialflödesanalys (MFA) kvantifierar vad som tillförs, ackumuleras och lämnar systemet. Byggnader binder material i årtionden eller århundraden och kopplar tidigare resursanvändning till framtida avfall och återvinning. De globala materialbestånden växte omkring 23 gånger mellan 1900 och 2010 (≈792 Gt), och ungefär hälften av den årliga utvinningen användes för att bygga eller förnya dem (Krausmann m.fl., 2017).</p>
<p>Byggnadsbestånd förändras genom nybyggnad, beständighet, omvandling och rivning. Dynamiska modeller härleder flöden från efterfrågan och antagna livslängder, men rivning bestäms inte enbart av ålder och antagandena påverkar utflödesskattningarna starkt (Miatto m.fl., 2017; Cord’homme m.fl., 2025). Rumsligt explicita studier skattar material per byggnad utifrån geometri, period, funktion och konstruktion, men historiska register saknar ofta dessa uppgifter och nybyggnad och rivning härleds snarare än observeras.</p>
<p>Studien fyller den luckan genom att i ett och samma ramverk på byggnadsnivå kombinera observerad omsättning från på varandra följande historiska skikt, maskininlärning för saknade attribut och materialberäkning över elva femårsperioder.</p>
<h3>Forskningsfrågor</h3>
<ol>
  <li>Hur utvecklades Göteborgs byggnadsbestånd i rum och tid 1960–2015, och var koncentrerades nybyggnad och rivning?</li>
  <li>Hur hänger de rumsliga mönstren av materialackumulering och omsättning i bostäder samman med befolkningstäthet, byggnaders egenskaper och stadens rumsliga struktur?</li>
</ol>

<h2 id="r-data">Data</h2>
<p>Analysen använder <i>GIS-baserad tidsmodell för Göteborg 1960–2015</i> (Stavroulaki m.fl., 2025): tolv historiska representationer av stadens byggnader och gatunät med femårsintervall. Byggnadsskikten innehåller enskilda polygoner med byggår, byggnadsarea, bruttoarea (BTA), höjd och våningsantal.</p>
<p>Geometriska, morfologiska och gatunätsbaserade mått beräknades för varje byggnad med skikten från samma period, så att varje byggnad beskrivs i det stadssammanhang där den fanns. Nutida byggnadsdata gav klasser för funktionsmodellen; ett klassat urval av bostadshus (Bian m.fl., 2026) tränade typologimodellen. Materialintensiteter kommer från Gontia m.fl. (2018); befolkning 2015 per DeSO från SCB.</p>
${B.predictors}
${cap("Prediktorgrupper (supplement 1). Gatunätsmåtten beräknas med vinkelsegmentanalys på samma års gatunät.")}

<h2 id="r-meth">Metod</h2>
<p>Rekonstruktionen följer ett sekventiellt ramverk på byggnadsnivå i fyra steg.</p>
${fig("fig1.png", "Figur 1. Metodramverk för rekonstruktionen av Göteborgs byggnadsbestånd och bostädernas materialbestånd och -flöden.")}
<h3>Steg 1 — Träning av klassificerare</h3>
<p><b>Bostäders konstruktionstypologi.</b> 331 klassade bostadshus: CMF (111), MMF (78), WBMF (73) och WMF (69). WSF uteslöts på grund av för få exempel och tilldelas i stället småhus. Random Forest, Ranger och XGBoost jämfördes; Ranger och XGBoost optimerades med upprepad 5-faldig korsvalidering (3 upprepningar). XGBoost (71 prediktorer, 100 iterationer) nådde 86,0 % i korsvalidering och 88,9 % på testdata (κ = 0,851).</p>
<p><b>Byggnadsfunktion.</b> 166 346 nutida byggnader. De sju ursprungliga kategorierna grupperades: Samhällsfunktion = offentlig service; komplement-, jordbruks- och övriga byggnader = Komplementbyggnad. XGBoost med 66 prediktorer nådde 88,7 % i korsvalidering och 88,8 % på testdata (κ = 0,804). En separat modell delade bostäder i småhus och flerbostadshus (98,7 % på testdata).</p>
<h3>Steg 2 — Identifiering av nybyggnad och rivning</h3>
<p>På varandra följande skikt jämfördes med femårsintervall. Identifieringen är oberoende av klassificeringen.</p>
${detectDiagram({ aria: "Identifieringsregel", t0: "Skikt t", t1: "Skikt t+5", res: "Tolkning", persist: "Kvarstående bestånd", demo: "Riven under (t, t+5]", new: "Ny under (t, t+5]" })}
<h3>Steg 3 — Prediktion av attribut i det historiska beståndet</h3>
<p>Modellerna tillämpades i följd på varje historiskt skikt, med prediktorer beräknade från skiktets egna byggnader och gatunät.</p>
${cascade({ aria: "Klassificeringskedja", layer: "Historiskt byggnadsskikt (varje period)", m1: "Funktionsmodell", nonres: "Komplement · Handel · Industri · Samhällsfunktion", res: "Bostad", m2: "Modell småhus / flerbostadshus", sf: "Småhus", mf: "Flerbostadshus", m3: "Typologimodell", mat: "BTA × materialintensitet (17 material) → bestånd, inflöden, utflöden" })}
<h3>Steg 4 — Material i bostäder</h3>
<p>Varje bostadshus BTA multiplicerades med typologispecifika materialintensiteter (Gontia m.fl., 2018) för 17 materialkategorier. Inflöden är materialet i nya byggnader, utflöden materialet i rivna, och nettoackumuleringen skillnaden per period. Eftersom alla mängder är knutna till en byggnad kan bestånd och flöden aggregeras per period, plats, typologi och material.</p>
<h3>Rumslig och statistisk analys</h3>
<p>Förändringarna sammanfattades per period, funktion, typologi och material; rumsliga mönster studerades med kartor på byggnadsnivå, kärntäthet för tillkommen och riven yta samt avståndsprofiler från Göteborgs central. För befolkningsanalysen aggregerades bostadsinflöden 1960–2015 till DeSO, dividerades med ytan, logaritmerades och relaterades till log befolkningstäthet 2015 med OLS och kvantilregression (tolkat som samband, inte orsakseffekter).</p>

<h2 id="r-res">Resultat</h2>
<h3>Byggnadsbeståndets utveckling</h3>
<p>Jämförelsen av skikten identifierade <b>39 685 nya</b> och <b>950 rivna</b> byggnader, omkring 13,6 km² tillkommen och 0,85 km² riven byggnadsarea. Nybyggnad och rivning koncentrerades till den historiska kärnan och området kring Centralstationen; nybyggnad koncentrerades även till Angered och Gunnared, Västra Frölunda/Frölunda Torg, Torslanda och andra delar av Hisingen.</p>
${B.funcTable}
${cap("Nybyggnad och rivning per funktion, 1960–2015.")}
${fig("fig2a.jpeg", "Figur 2a. Exempel på identifierade tillkomna och rivna byggnader i utvalda områden.")}
${fig("fig2b.png", "Figur 2b. Kärntäthet för nybyggnad och rivning baserad på tillkommen och riven byggnadsarea.")}
<p>Rivningarna koncentrerades till de första perioderna och minskade därefter; bostäder stod för flest rivningar, medan industri, samhällsfunktioner och handel stod för stora delar av den rivna ytan i förhållande till antalet. Få rivningar identifierades efter 1990.</p>
${fig("fig3a.png", "Figur 3a. Rivna byggnader per period och funktion: antal, byggnadsarea och BTA.")}
<p>Nybyggandet toppade i slutet av 1960-talet och början av 1970-talet: 5 225 nya byggnader 1965–1970 och 5 853 under 1970–1975. Ny BTA minskade ändå från omkring 3,57 till 2,34 km² mellan perioderna, så perioden med flest byggnader var inte den med mest yta. Nybyggandet minskade under 1980- och 1990-talen och ökade igen under 2000-talet mätt i yta (2 381, 2 074 och 1 344 nya byggnader under de tre sista perioderna).</p>
${fig("fig3b.png", "Figur 3b. Nya byggnader per period och funktion: antal, byggnadsarea och BTA.")}
<p>Bostadsbyggandet koncentrerades 5–10 km från Centralstationen (störst vid 7–9 km); handel främst inom 5 km; industri vid 5–7 km och 11–12 km.</p>
${fig("fig3c.png", "Figur 3c. Ny BTA efter avstånd från Göteborgs central för bostäder, industri och handel. Linjer: BTA per avståndsband; ytor: ackumulerad BTA.")}
<p>Den totala byggnadsarean ökade från omkring 10,8 km² (1960) till 23,9 km² (2015), +121 %. Bostädernas byggnadsarea ökade från 5,8 till 11,7 km² och deras BTA från 17,7 till 35,7 km², båda omkring +102 %, medan befolkningen ökade från 443 843 till 572 799 (+29 %).</p>

<h3>Materialbestånd och materialflöden i bostäder</h3>
<p>Bostädernas materialbestånd växte från omkring <b>24,97 Mt</b> 1960 till <b>34,72 Mt</b> 2015. Omkring <b>10,89 Mt</b> tillfördes genom nybyggnad, varav 6,84 Mt (63 %) 1960–1975; det största femårsinflödet var 3,28 Mt 1965–1970 och sjönk till 1,90 Mt 1970–1975 trots att fler byggnader tillkom. Identifierad rivning frigjorde omkring <b>1,14 Mt</b>, mest 1970–1975 (0,44 Mt), och få eller inga utflöden identifierades under flera senare perioder.</p>
${fig("fig4a.png", "Figur 4a. Rivna bostadshus per period och konstruktionstypologi: antal, byggnadsarea och BTA.")}
${fig("fig4b.png", "Figur 4b. Nya bostadshus per period och konstruktionstypologi: antal, byggnadsarea och BTA.")}
<p>WMF står för den största delen av det ackumulerade inflödet, följt av CMF, WBMF och WSF.</p>
${fig("fig4c.png", "Figur 4c. Ackumulerat materialinflöde från nya bostäder 1960–2015 per konstruktionstypologi.")}

<h3>Befolkningstäthet och materialackumulering</h3>
<p>Majorna–Stigberget–Masthugget, Krokslätt–Johanneberg, Olivedal–Haga–Annedal–Änggården och Frölunda Torg–Tofta kombinerar hög befolkningstäthet med högt ackumulerat inflöde; delar av Angered, Bergsjön och Älvsborg har stora inflöden i förhållande till tätheten 2015. På DeSO-nivå motsvarar 10 % högre befolkningstäthet omkring 8,6 % högre inflödestäthet; sambandet är starkare i fördelningens övre del och svagare på mellanområdesnivå.</p>
${B.regTable}
${cap("Log-log-samband mellan befolkningstäthet 2015 och ackumulerat materialinflöde per ytenhet 1960–2015.")}
${fig("fig5.png", "Figur 5. Bivariat karta över befolkningstäthet 2015 och ackumulerat materialinflöde per DeSO, med OLS- och kvantilregressionslinjer (10:e/90:e).")}

<h3>Avstånd från centrum</h3>
<p>Inflödet till bostäder toppar omkring 8 km från Centralstationen, med fler koncentrationer kring 6 och 13 km, och avtar bortom 15 km. CMF ligger främst vid 2–9 km (toppar vid 6 och 8 km); WBMF sprids mer men centreras kring 5–10 km; WMF har flera toppar vid 5–9 km samt 12–15 km; WSF ligger längst ut, vid 7–10 och 13–15 km. 1960-talets inflöden ligger vid 5–8 km, 1970-talet har den största koncentrationen vid 6–8 km, och senare decennier är mindre och mer spridda.</p>
${fig("fig6a.png", "Figur 6a. Totalt materialinflöde i bostäder per avståndsband från Centralstationen.")}
${fig("fig6b.png", "Figur 6b. Materialinflöde efter avstånd och konstruktionstypologi.")}
${fig("fig6c.png", "Figur 6c. Materialinflöde efter avstånd och byggdecennium.")}

<h3>Materialsammansättning</h3>
<p>Betong är den största andelen av både in- och utflöden, följt av sand och ballast samt stål och gjutjärn. Utflödena var störst 1970–1975, därefter 1965–1970 och 1960–1965; inflödena var störst 1965–1970, minskade under 1980- och 1990-talen och ökade igen under 2000-talet.</p>
${fig("fig7a.png", "Figur 7a. Absolut och relativ sammansättning av utflöden från rivna bostadshus per period.")}
${fig("fig7b.png", "Figur 7b. Absolut och relativ sammansättning av inflöden från nya bostadshus per period.")}
${fig("fig7c.png", "Figur 7c. Ackumulerat materialinflöde i bostäder per materialkategori.")}
<p>De största och mest koncentrerade inflödena skedde under 1960- och 1970-talen, särskilt i södra och sydvästra Göteborg samt norr och öster om centrum. Efter 1975 blev inflödena mindre och mer spridda.</p>
${fig("fig8.png", "Figur 8. Rumslig koncentration av materialinflöden i bostäder per femårsperiod (ljusare = högre).")}

<h2 id="r-disc">Diskussion</h2>
<h3>Stadstillväxt och materialackumulering</h3>
<p>Bostädernas bruttoarea växte tre till fyra gånger snabbare än befolkningen, så demografisk förändring ensam beskriver inte stadens fysiska expansion — en skillnad som också observerats i svenska kommuner och i Tyskland (Gontia m.fl., 2020; Schug m.fl., 2023). Antal byggnader, BTA och materialinflöden följde olika tidsmönster, så antal byggnader underskattar tillväxtens fysiska omfattning. Officiell bostadsstatistik visar samma övergripande förlopp (lågt byggande under 1980- och 1990-talen, ökning efter 2000), vilket stöder rimligheten men inte de absoluta talen. Inflödena översteg de identifierade utflödena hela perioden: bostadsbeståndet var i nettoackumulering.</p>
<h3>Rumsliga mönster</h3>
<p>Dagens geografi för bostadsmaterial speglar på varandra följande utbyggnadsvågor med olika typologier och lägen. Befolkningstätheten fångar bara en del av den (R² ≈ 0,44), och sambandet försvagas på mellanområdesnivå — i linje med MAUP. DeSO- och mellanområdesresultaten är kompletterande vyer i olika upplösning. Fastigheter, ägande och reglering kan påverka var förtätning och ersättning sker; rekonstruktionen på byggnadsnivå ger underlag för att pröva det.</p>
<h3>Metodbidrag</h3>
<p>Ramverket förenar observerad omsättning, maskininlärning, tidsmässigt konsekvent rumsligt sammanhang och materialberäkning, utan att förlita sig på antagna livslängder. Varje bestånd och flöde behåller sitt ursprung på byggnadsnivå och kan följas i tid och rum.</p>

<h2 id="r-lim">Begränsningar och fortsatt forskning</h2>
<ul>
  <li><b>Källornas fullständighet.</b> Historiska data varierar; de få rivningarna efter 1990 ska inte tolkas som att rivning saknades.</li>
  <li><b>Osäkerhet i klassificeringen.</b> XGBoost ger inga standardfel per prediktion och sannolikheterna är inte kalibrerade; denna osäkerhet och variationen i materialintensitet förs inte vidare. Handel och samhällsfunktioner är minst tillförlitliga (sensitivitet 0,38 och 0,32).</li>
  <li><b>Systemgräns.</b> Endast bostadshus och nybyggnad/rivning av hela byggnader. Vägar, ledningar och annan infrastruktur (≈28 % av Göteborgs byggda materialbestånd; Gontia m.fl., 2019), renovering, tillbyggnad och delvis rivning ingår inte.</li>
  <li><b>Befolkningsanalysen</b> jämför täthet 2015 med flöden sedan 1960 och beror på de rumsliga enheterna.</li>
</ul>
<p>Fortsatt arbete: utvidga till lokaler och infrastruktur, inkludera renovering och delvis omvandling, och föra vidare osäkerhet från klassificering och materialintensiteter.</p>

<h2 id="r-conc">Slutsats</h2>
<p>Tillämpat på Göteborg 1960–2015 identifierade ramverket nybyggnad och rivning med femårsintervall och kvantifierade bostädernas materialflöden. Befolkningen ökade med omkring 29 % medan bostädernas byggnadsarea och BTA ungefär fördubblades. Omkring 10,89 Mt bostadsmaterial tillfördes, främst under de första femton åren; rivningens utflöden var betydligt mindre och tidiga. Inflödena koncentrerades 5–10 km från Centralstationen och varierade mellan typologier och decennier, och dagens befolkningstäthet fångar bara en del av den historiska geografin. Genom att behålla varje byggnads läge och tidsstatus går ramverket bortom statiska inventeringar mot en empirisk beskrivning av hur materialbestånd bildas och förändras.</p>

<h2 id="r-app">Bilaga</h2>
<h3>Tabell 1. Bostäder: antal, byggnadsarea, BTA och materialmassa per period</h3>
<div id="table1"></div>
<h3>Tabell 2. Bestånd vid periodens början och slut</h3>
${B.table2}

<h2 id="r-ml">Klassificering med maskininlärning</h2>
<p>Från supplement 2. För varje uppgift delades data i tränings- och oberoende testdata; klassificerare jämfördes med korsvalidering på träningsdata, den bästa modellen valdes på korsvaliderad träffsäkerhet och testdata användes bara för slututvärdering. R 4.5.1 med caret, xgboost, ranger, sf och dplyr.</p>
${B.mlSummary}
<h3>Bostäders konstruktionstypologi</h3>
<p>71 prediktorer (39 gatunät, 32 morfologi/geometri). Preliminära jämförelser med 33, 46 och 91 variabler betraktades som explorativa; slutvalet jämförde Ranger och XGBoost på samma data. Variablernas betydelse nedan kommer från explorativa Random Forest-modeller, inte den slutliga XGBoost-modellen.</p>
${B.typoTables}
<h3>Grupperad byggnadsfunktion</h3>
<p>Klassfördelningen är mycket obalanserad, vilket påverkar tolkningen av den totala träffsäkerheten. Modellen är starkast för komplementbyggnader och bostäder; resultat för handel och samhällsfunktioner bör tolkas försiktigare.</p>
${B.funcTables}
<h3>Småhus eller flerbostadshus</h3>
<p>Byggnadsarean dominerar, följt av storlek, form, läge och gatunät.</p>
${B.typeTables}

<h2 id="r-ref">Referenser</h2>
<ol class="refs">${REFS}</ol>
</article>`; },
    about: () => `
<h2>Om</h2>
<p class="lede">Webbplatsen hör till preprinten <i>From Urban Growth to Material Accumulation: Reconstructing Building Stock Dynamics in Gothenburg, from 1960 to 2015</i>.</p>
<ul class="links">
  <li><span>Preprint (Research Square)</span><a href="${PREPRINT}" target="_blank" rel="noopener">researchsquare.com/article/rs-11133928/v1</a></li>
  <li><span>ORCID</span><a href="https://orcid.org/0000-0001-5252-6504" target="_blank" rel="noopener">0000-0001-5252-6504</a></li>
  <li><span>Webbplats</span><a href="https://nodalworks.se/" target="_blank" rel="noopener">nodalworks.se</a></li>
  <li><span>LinkedIn</span><a href="https://www.linkedin.com/in/phd-cohen-urban-data/" target="_blank" rel="noopener">linkedin.com/in/phd-cohen-urban-data</a></li>
  <li><span>E-post</span><span>cohen.jota@gmail.com</span></li>
</ul>
<h3>Citera</h3>
<p class="cite">Cohen, J. (2026). From Urban Growth to Material Accumulation: Reconstructing Building Stock Dynamics in Gothenburg, from 1960 to 2015. <i>Research Square</i> (preprint). ${DOI}</p>
<h3>Om kartan</h3>
<p>Byggnaderna visas som förrenderade rasterbilder; inga byggnadsgeometrier eller attribut distribueras. Rutnätet summerar byggnaderna efter den ruta där varje byggnad ligger. Studieområde: analyskvadraten i preprinten. Källdata: GIS-baserad tidsmodell för Göteborg 1960–2015 (Stavroulaki m.fl., 2025, Chalmers tekniska högskola, doi:10.5878/MA55-R589). Bakgrundskarta © Esri, HERE, Garmin, © OpenStreetMap-bidragsgivare.</p>
`
  };

  window.CONTENT = { en, sv };
})();
