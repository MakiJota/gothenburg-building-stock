// Report and About pages. Content condensed from the Research Square preprint
// (doi:10.21203/rs.3.rs-11133928/v1) and its Supplementary Material 1.
// Swedish translation: please review before publishing.
(function () {
  const PREPRINT = "https://www.researchsquare.com/article/rs-11133928/v1";
  const fig = (src, cap) => `<figure><img loading="lazy" src="img/${src}" alt=""><figcaption>${cap}</figcaption></figure>`;

  const mlTables = (L) => `
  <div class="tbl"><table>
    <thead><tr><th>${L.model}</th><th>${L.labels}</th><th>${L.pred}</th><th>${L.cv}</th><th>${L.acc}</th><th>κ</th></tr></thead>
    <tbody>
      <tr><td>${L.m_typo}</td><td>331</td><td>71</td><td>86.0 %</td><td>88.9 %</td><td>0.851</td></tr>
      <tr><td>${L.m_func}</td><td>166,346</td><td>66</td><td>88.7 %</td><td>88.8 %</td><td>0.804</td></tr>
    </tbody></table></div>
  <h3>${L.cmp_title}</h3>
  <div class="tbl"><table>
    <thead><tr><th>${L.model}</th><th>${L.initial}</th><th>${L.robust_cv}</th><th>${L.holdout}</th></tr></thead>
    <tbody>
      <tr><td>Random Forest</td><td>0.864</td><td>—</td><td>—</td></tr>
      <tr><td>Ranger</td><td>0.889</td><td>0.848</td><td>0.877 (κ 0.834)</td></tr>
      <tr><td><b>XGBoost</b></td><td>0.827</td><td><b>0.860</b> (SD 0.035)</td><td><b>0.889</b> (κ 0.851)</td></tr>
    </tbody></table></div>
  <h3>${L.imp_title}</h3>
  <div class="tbl"><table>
    <thead><tr><th>${L.feature}</th><th>${L.full}</th><th>${L.simple}</th></tr></thead>
    <tbody>
      <tr><td>${L.f_year}</td><td>21.6</td><td>27.8</td></tr>
      <tr><td>${L.f_height}</td><td>11.2</td><td>10.0</td></tr>
      <tr><td>${L.f_floors}</td><td>11.1</td><td>11.9</td></tr>
      <tr><td>${L.f_rheight}</td><td>9.9</td><td>11.9</td></tr>
      <tr><td>${L.f_volume}</td><td>5.8</td><td>5.6</td></tr>
      <tr><td>${L.f_gfa}</td><td>5.6</td><td>6.0</td></tr>
      <tr><td>${L.f_nb800}</td><td>—</td><td>5.3</td></tr>
      <tr><td>${L.f_peri}</td><td>4.0</td><td>5.1</td></tr>
      <tr><td>${L.f_len500}</td><td>—</td><td>4.2</td></tr>
    </tbody></table></div>`;

  const en = {
    report: () => `
<h2>From urban growth to material accumulation</h2>
<p class="lede">A building-level reconstruction of Gothenburg's building stock between 1960 and 2015, and of the residential materials that entered and left it through construction and demolition.</p>
<div class="callout">This is a summary of the preprint <a href="${PREPRINT}" target="_blank" rel="noopener">Research Square rs-11133928/v1</a>. Numbers are as reported there; please cite the preprint.</div>

<h3>Research questions</h3>
<ol>
  <li>How did Gothenburg's building stock evolve spatially and temporally between 1960 and 2015, and where were construction and demolition concentrated?</li>
  <li>How are spatial patterns of residential material accumulation and turnover related to population density, building characteristics and urban spatial structure?</li>
</ol>

<h2>Data and methods</h2>
<p>The analysis uses the <i>GIS-based Time Model of Gothenburg, 1960–2015</i> (Stavroulaki et al., 2025): twelve building and street-network layers at five-year intervals, with footprint, gross floor area (GFA), height and floors. Geometric, morphological and street-network indicators were computed for every building from the layers of its own period. Population for 2015 comes from Statistics Sweden at DeSO level; material-intensity coefficients from Gontia et al. (2018).</p>
<ol class="steps4">
  <li><b>Train two classifiers.</b> A residential structural-typology model (CMF, MMF, WBMF, WMF; 331 labelled buildings, Bian et al., 2026) and a building-function model (166,346 contemporary buildings, six groups).</li>
  <li><b>Detect construction and demolition</b> by comparing consecutive layers: present before but absent after = demolished; absent before but present after = new.</li>
  <li><b>Predict missing attributes</b> for the historical stock: function first; single-family buildings become WSF, multifamily buildings get a predicted typology.</li>
  <li><b>Compute materials.</b> GFA × typology-specific material intensity (17 material categories) gives each residential building's material content; inflows come from new buildings, outflows from demolished ones.</li>
</ol>
${fig("fig1.png", "Figure 1. Methodological framework for the reconstruction of the building stock and residential material stocks and flows.")}

<h2>Results</h2>
<h3>A city that grew faster in floor area than in people</h3>
<p>Comparing consecutive layers identified <b>39,685 new</b> and <b>950 demolished</b> buildings (about 13.6 km² of footprint added and 0.85 km² removed). Population grew by <b>29 %</b> (443,843 → 572,799), while residential footprint and GFA both grew by about <b>102 %</b> (GFA 17.7 → 35.7 km²). Total footprint rose from 10.8 to 23.9 km² (+121 %).</p>
<p>Residential buildings made up 33,491 of the additions (6.35 km² footprint), followed by auxiliary (3,023), industrial (1,830; 3.62 km²), institutional (736) and commercial (605) buildings. Of the demolished buildings, 613 were residential. Construction and demolition concentrated in the historic core and around the Central Station; further construction clusters are Angered–Gunnared, Västra Frölunda/Frölunda Torg, Torslanda and Hisingen.</p>
${fig("fig2b.png", "Figure 2b. Kernel density of constructed and demolished building area, 1960–2015.")}
<p>The peak in the number of additions (5,853 in 1970–1975) did not coincide with the peak in floor area (3.57 km² of GFA in 1965–1970): building counts alone understate how physically large the late-1960s expansion was. Demolition was concentrated in the early periods; few demolitions were identified after 1990.</p>
${fig("fig3b.png", "Figure 3b. Newly constructed buildings by period and function: count, footprint and GFA.")}
${fig("fig3c.png", "Figure 3c. New GFA by distance from Gothenburg Central Station. Residential construction peaks 7–9 km out; commercial stays within ~5 km.")}

<h3>Residential materials</h3>
<p>The residential material stock grew from <b>24.97 Mt</b> in 1960 to <b>34.72 Mt</b> in 2015 (+39 %). About <b>10.89 Mt</b> entered through new construction, 63 % of it (6.84 Mt) between 1960 and 1975, with the largest five-year inflow in 1965–1970 (3.28 Mt). Identified demolition released about <b>1.14 Mt</b>, most of it in 1970–1975 (0.44 Mt). Concrete dominates both inflows and outflows, followed by sand and aggregates and steel. WMF buildings contribute the largest share of cumulative inflow, followed by CMF, WBMF and WSF.</p>
${fig("fig7b.png", "Figure 7b. Composition of residential material inflows by period.")}
${fig("fig4c.png", "Figure 4c. Cumulative residential material inflows by structural typology.")}
${fig("fig6a.png", "Figure 6a. Residential material inflow by distance from the Central Station (peak around 8 km).")}
${fig("fig8.png", "Figure 8. Spatial distribution of residential material inflows per five-year period.")}

<h3>Population density and material accumulation</h3>
<p>Across DeSO areas, 2015 population density is positively associated with cumulative material-inflow density 1960–2015 (log-log OLS β = 0.86, SE 0.058, R² = 0.44): a 10 % difference in density goes with about 8.6 % more inflow. The relationship is stronger at the top of the distribution (quantile regression: 0.67 at q10, 1.04 at q90) and weaker when aggregated to 23 Mellan areas (β = 0.55, R² = 0.32), a reminder of the modifiable areal unit problem. Angered, Bergsjön and Älvsborg hold large historical inflows relative to their present density.</p>
${fig("fig5.png", "Figure 5. 2015 population density versus cumulative residential material-inflow density.")}

<h2>Findings</h2>
<ul>
  <li><b>Floor area outpaced population</b> (+102 % vs +29 %): demographic change alone does not describe the city's physical growth.</li>
  <li><b>The stock was in net accumulation</b> throughout: inflows (10.9 Mt) were roughly ten times the identified outflows.</li>
  <li><b>Timing matters:</b> almost two-thirds of the inflow arrived 1960–1975, the period of large-scale industrialised housing.</li>
  <li><b>Geography matters:</b> inflows concentrate 5–10 km from the centre and differ by typology; WSF lies further out than multifamily stock.</li>
  <li><b>Method:</b> consecutive historical layers plus machine-learning attribute enrichment let stocks and flows keep their building-level location and timing.</li>
</ul>

<h2>Limitations</h2>
<p>Historical sources vary in completeness, so the low demolition counts after 1990 should not be read as an absence of demolition. Classification uncertainty and material-intensity variation are not propagated into the estimates. The system boundary covers residential buildings and whole-building construction and demolition only; infrastructure, renovation, extensions and partial demolition are excluded. The population analysis compares 2015 density with flows accumulated since 1960.</p>

<h2>Appendix</h2>
<h3>Table 1. Residential counts, footprint, GFA and material mass per period</h3>
<div id="table1"></div>
<h3>Machine-learning models (Supplementary Material 1)</h3>
${mlTables(ML_EN)}
<p>Models were developed in R 4.5.1 with <code>caret</code>, <code>xgboost</code>, <code>ranger</code> and <code>sf</code>. The final XGBoost typology model: 100 rounds, max depth 4, η 0.20, selected by repeated 5-fold cross-validation (3 repeats) over 432 hyper-parameter combinations; it classified 72 of 81 holdout buildings correctly. Construction year and building height/floors are the strongest predictors; street-network context adds information.</p>
`,
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
<p class="cite">Cohen, J. (2026). From Urban Growth to Material Accumulation: Reconstructing Building Stock Dynamics in Gothenburg, from 1960 to 2015. <i>Research Square</i> (preprint). https://doi.org/10.21203/rs.3.rs-11133928/v1</p>
<h3>About the map</h3>
<p>Buildings are shown as pre-rendered raster images; no building geometries or attributes are distributed. The grid layer sums buildings by the cell containing each building. Study area: the analysis square used in the preprint. Source data: GIS-based Time Model of Gothenburg 1960–2015 (Stavroulaki et al., 2025, Chalmers University of Technology, doi:10.5878/MA55-R589). Basemap © OpenStreetMap contributors © CARTO.</p>
`
  };

  const sv = {
    report: () => `
<h2>Från stadstillväxt till materialackumulering</h2>
<p class="lede">En rekonstruktion på byggnadsnivå av Göteborgs byggnadsbestånd 1960–2015, och av de bostadsmaterial som tillförts och lämnat beståndet genom nybyggnad och rivning.</p>
<div class="callout">Detta är en sammanfattning av preprinten <a href="${PREPRINT}" target="_blank" rel="noopener">Research Square rs-11133928/v1</a>. Siffrorna är de som redovisas där; citera gärna preprinten.</div>

<h3>Forskningsfrågor</h3>
<ol>
  <li>Hur utvecklades Göteborgs byggnadsbestånd i rum och tid 1960–2015, och var koncentrerades nybyggnad och rivning?</li>
  <li>Hur hänger de rumsliga mönstren av materialackumulering och omsättning i bostäder samman med befolkningstäthet, byggnaders egenskaper och stadens rumsliga struktur?</li>
</ol>

<h2>Data och metod</h2>
<p>Analysen bygger på <i>GIS-baserad tidsmodell för Göteborg 1960–2015</i> (Stavroulaki m.fl., 2025): tolv skikt med byggnader och gatunät med femårsintervall, med byggnadsarea, bruttoarea (BTA), höjd och våningsantal. Geometriska, morfologiska och gatunätsbaserade mått beräknades för varje byggnad utifrån skikten från dess egen period. Befolkningsdata för 2015 kommer från SCB på DeSO-nivå; materialintensiteter från Gontia m.fl. (2018).</p>
<ol class="steps4">
  <li><b>Träna två klassificerare.</b> En modell för bostäders konstruktionstypologi (CMF, MMF, WBMF, WMF; 331 klassade byggnader, Bian m.fl., 2026) och en modell för byggnadsfunktion (166 346 nutida byggnader, sex grupper).</li>
  <li><b>Identifiera nybyggnad och rivning</b> genom att jämföra på varandra följande skikt: finns före men inte efter = riven; finns inte före men efter = ny.</li>
  <li><b>Prediktera saknade attribut</b> för det historiska beståndet: först funktion; småhus blir WSF, flerbostadshus får en predikterad typologi.</li>
  <li><b>Beräkna material.</b> BTA × typologispecifik materialintensitet (17 materialkategorier) ger varje bostadshus materialinnehåll; inflöden kommer från nya byggnader, utflöden från rivna.</li>
</ol>
${fig("fig1.png", "Figur 1. Metodramverk för rekonstruktionen av byggnadsbeståndet och bostädernas materialbestånd och -flöden.")}

<h2>Resultat</h2>
<h3>En stad som växte snabbare i yta än i invånare</h3>
<p>Jämförelsen av skikten identifierade <b>39 685 nya</b> och <b>950 rivna</b> byggnader (cirka 13,6 km² tillkommen och 0,85 km² försvunnen byggnadsarea). Befolkningen ökade med <b>29 %</b> (443 843 → 572 799), medan bostädernas byggnadsarea och BTA båda ökade med omkring <b>102 %</b> (BTA 17,7 → 35,7 km²). Den totala byggnadsarean ökade från 10,8 till 23,9 km² (+121 %).</p>
<p>Bostäder stod för 33 491 av de nya byggnaderna (6,35 km²), följt av komplementbyggnader (3 023), industri (1 830; 3,62 km²), samhällsfunktioner (736) och handel (605). Av de rivna byggnaderna var 613 bostäder. Nybyggnad och rivning koncentrerades till den historiska kärnan och området kring Centralstationen; andra nybyggnadskluster är Angered–Gunnared, Västra Frölunda/Frölunda Torg, Torslanda och Hisingen.</p>
${fig("fig2b.png", "Figur 2b. Kärntäthet för tillkommen och riven byggnadsarea, 1960–2015.")}
<p>Toppen i antal nya byggnader (5 853 under 1970–1975) sammanföll inte med toppen i yta (3,57 km² BTA under 1965–1970): antal byggnader underskattar hur omfattande expansionen i slutet av 1960-talet var. Rivningarna koncentrerades till de tidiga perioderna; få rivningar identifierades efter 1990.</p>
${fig("fig3b.png", "Figur 3b. Nya byggnader per period och funktion: antal, byggnadsarea och BTA.")}
${fig("fig3c.png", "Figur 3c. Ny BTA efter avstånd från Göteborgs central. Bostadsbyggandet toppar 7–9 km ut; handel ligger inom ca 5 km.")}

<h3>Material i bostäder</h3>
<p>Bostädernas materialbestånd växte från <b>24,97 Mt</b> 1960 till <b>34,72 Mt</b> 2015 (+39 %). Omkring <b>10,89 Mt</b> tillfördes genom nybyggnad, varav 63 % (6,84 Mt) 1960–1975, med det största femårsinflödet 1965–1970 (3,28 Mt). Identifierad rivning frigjorde omkring <b>1,14 Mt</b>, främst 1970–1975 (0,44 Mt). Betong dominerar både in- och utflöden, följt av sand och ballast samt stål. WMF står för den största delen av det ackumulerade inflödet, följt av CMF, WBMF och WSF.</p>
${fig("fig7b.png", "Figur 7b. Sammansättning av materialinflöden i bostäder per period.")}
${fig("fig4c.png", "Figur 4c. Ackumulerat materialinflöde i bostäder per konstruktionstypologi.")}
${fig("fig6a.png", "Figur 6a. Materialinflöde i bostäder efter avstånd från Centralstationen (topp kring 8 km).")}
${fig("fig8.png", "Figur 8. Rumslig fördelning av materialinflöden i bostäder per femårsperiod.")}

<h3>Befolkningstäthet och materialackumulering</h3>
<p>Över DeSO-områden har befolkningstätheten 2015 ett positivt samband med det ackumulerade materialinflödet per ytenhet 1960–2015 (log-log OLS β = 0,86, SE 0,058, R² = 0,44): 10 % högre täthet motsvarar omkring 8,6 % högre inflöde. Sambandet är starkare i fördelningens övre del (kvantilregression: 0,67 vid q10, 1,04 vid q90) och svagare aggregerat till 23 mellanområden (β = 0,55, R² = 0,32), ett exempel på MAUP. Angered, Bergsjön och Älvsborg har stora historiska inflöden i förhållande till dagens täthet.</p>
${fig("fig5.png", "Figur 5. Befolkningstäthet 2015 mot ackumulerat materialinflöde per ytenhet.")}

<h2>Slutsatser</h2>
<ul>
  <li><b>Ytan växte snabbare än befolkningen</b> (+102 % mot +29 %): demografisk förändring ensam beskriver inte stadens fysiska tillväxt.</li>
  <li><b>Beståndet var i nettoackumulering</b> hela perioden: inflödena (10,9 Mt) var ungefär tio gånger de identifierade utflödena.</li>
  <li><b>Tidpunkten spelar roll:</b> nästan två tredjedelar av inflödet kom 1960–1975, det storskaliga industrialiserade bostadsbyggandets period.</li>
  <li><b>Geografin spelar roll:</b> inflödena koncentreras 5–10 km från centrum och skiljer sig mellan typologier; WSF ligger längre ut än flerbostadshusen.</li>
  <li><b>Metod:</b> på varandra följande historiska skikt plus maskininlärning gör att bestånd och flöden behåller sin lokalisering och tidpunkt på byggnadsnivå.</li>
</ul>

<h2>Begränsningar</h2>
<p>De historiska källorna varierar i fullständighet, så de få rivningarna efter 1990 ska inte tolkas som att rivning saknades. Osäkerhet i klassificering och materialintensitet förs inte vidare till skattningarna. Systemgränsen omfattar bostadshus och hela byggnaders nybyggnad och rivning; infrastruktur, renovering, tillbyggnad och delvis rivning ingår inte. Befolkningsanalysen jämför täthet 2015 med flöden ackumulerade sedan 1960.</p>

<h2>Bilaga</h2>
<h3>Tabell 1. Bostäder: antal, byggnadsarea, BTA och materialmassa per period</h3>
<div id="table1"></div>
<h3>Maskininlärningsmodeller (supplement 1)</h3>
${mlTables(ML_SV)}
<p>Modellerna utvecklades i R 4.5.1 med <code>caret</code>, <code>xgboost</code>, <code>ranger</code> och <code>sf</code>. Den slutliga XGBoost-modellen för typologi: 100 iterationer, maxdjup 4, η 0,20, vald genom upprepad 5-faldig korsvalidering (3 upprepningar) över 432 hyperparameterkombinationer; den klassade 72 av 81 testbyggnader rätt. Byggår och byggnadens höjd/våningsantal är de starkaste prediktorerna; gatunätets egenskaper tillför information.</p>
`,
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
<p class="cite">Cohen, J. (2026). From Urban Growth to Material Accumulation: Reconstructing Building Stock Dynamics in Gothenburg, from 1960 to 2015. <i>Research Square</i> (preprint). https://doi.org/10.21203/rs.3.rs-11133928/v1</p>
<h3>Om kartan</h3>
<p>Byggnaderna visas som förrenderade rasterbilder; inga byggnadsgeometrier eller attribut distribueras. Rutnätet summerar byggnaderna efter den ruta där varje byggnad ligger. Studieområde: analyskvadraten i preprinten. Källdata: GIS-baserad tidsmodell för Göteborg 1960–2015 (Stavroulaki m.fl., 2025, Chalmers tekniska högskola, doi:10.5878/MA55-R589). Bakgrundskarta © OpenStreetMap-bidragsgivare © CARTO.</p>
`
  };

  const ML_EN = { model: "Model", labels: "Labelled buildings", pred: "Predictors", cv: "CV accuracy", acc: "Holdout accuracy",
    m_typo: "Residential structural typology (XGBoost)", m_func: "Building function (XGBoost)",
    cmp_title: "Typology model: algorithm comparison", initial: "Initial comparison (33 features)", robust_cv: "Repeated 5-fold CV (71 features)", holdout: "Holdout (81 buildings)",
    imp_title: "Typology model: strongest predictors (mean decrease in accuracy)", feature: "Feature", full: "Full model", simple: "Simplified model",
    f_year: "Construction year", f_height: "Height", f_floors: "Floors", f_rheight: "Rounded height", f_volume: "Volume", f_gfa: "GFA",
    f_nb800: "Betweenness within 800 m (mean)", f_peri: "Perimeter/area", f_len500: "Street length within 500 m" };
  const ML_SV = { model: "Modell", labels: "Klassade byggnader", pred: "Prediktorer", cv: "CV-träffsäkerhet", acc: "Träffsäkerhet testdata",
    m_typo: "Bostäders konstruktionstypologi (XGBoost)", m_func: "Byggnadsfunktion (XGBoost)",
    cmp_title: "Typologimodell: jämförelse av algoritmer", initial: "Första jämförelsen (33 variabler)", robust_cv: "Upprepad 5-faldig CV (71 variabler)", holdout: "Testdata (81 byggnader)",
    imp_title: "Typologimodell: viktigaste prediktorer (mean decrease in accuracy)", feature: "Variabel", full: "Full modell", simple: "Förenklad modell",
    f_year: "Byggår", f_height: "Höjd", f_floors: "Våningar", f_rheight: "Avrundad höjd", f_volume: "Volym", f_gfa: "BTA",
    f_nb800: "Betweenness inom 800 m (medel)", f_peri: "Omkrets/area", f_len500: "Gatulängd inom 500 m" };

  window.CONTENT = { en, sv };
})();
