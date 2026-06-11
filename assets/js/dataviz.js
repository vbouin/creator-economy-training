/* ============================================================
   dataviz — lightweight horizontal bar charts from window.DB
   No external libs. Renders into [data-viz] containers.
   ============================================================ */
(function () {
  const DB = window.DB || {};
  const I18N = window.I18N;
  const t = (k) => window.I18N.t(k);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  function groupSum(rows, keyFn, valFn) {
    const m = new Map();
    rows.forEach((r) => {
      const k = keyFn(r); if (k == null) return;
      m.set(k, (m.get(k) || 0) + (valFn(r) || 0));
    });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  function groupCount(rows, keyFn) {
    const m = new Map();
    rows.forEach((r) => { const k = keyFn(r); if (k == null) return; m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }

  const fmt = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : (Math.round(n * 10) / 10).toString());

  function bars(pairs, opts) {
    opts = opts || {};
    const max = Math.max(...pairs.map((p) => p[1]), 1);
    return pairs.map((p, i) => {
      const w = Math.max(2, (p[1] / max) * 100);
      const label = opts.labelMap ? (opts.labelMap[p[0]] || p[0]) : p[0];
      return `<div class="bar-row"><div class="bl" title="${label}">${label}</div>`
        + `<div class="bar-track"><div class="bar-fill" data-w="${w}"></div></div>`
        + `<div class="bar-val">${opts.suffix ? fmt(p[1]) + opts.suffix : fmt(p[1])}</div></div>`;
    }).join("");
  }

  function card(title, sub, inner) {
    return `<div class="viz-card reveal"><h3>${title}</h3><div class="viz-sub">${sub}</div>${inner}</div>`;
  }

  function animate(root) {
    (root || document).querySelectorAll(".bar-fill[data-w]").forEach((el) => {
      requestAnimationFrame(() => { el.style.width = el.getAttribute("data-w") + "%"; });
    });
  }

  const PLAT = (id) => {
    const p = (DB.platforms || []).find((x) => x.id === id); return p ? p.name : id;
  };
  const platLabels = {};
  (DB.platforms || []).forEach((p) => { platLabels[p.id] = p.name; });
  // common short platform names for influencer field
  ["youtube","tiktok","instagram","douyin","xiaohongshu","bilibili","weibo","twitch","kick","facebook"].forEach((k)=>{ if(!platLabels[k]) platLabels[k]=k.charAt(0).toUpperCase()+k.slice(1); });

  const regionLabel = { "fr": {}, "en": {} };

  function renderAll() {
    const host = document.getElementById("viz-grid");
    if (!host) return;
    const estimate = `<p class="muted" style="font-size:.78rem;margin-top:10px">${t("ui.estimate")}</p>`;

    const region = groupSum(DB.brands || [], (r) => r.region, (r) => r.est_followers_total_millions);
    const sector = groupSum(DB.brands || [], (r) => r.sector, (r) => r.est_followers_total_millions);
    const lic = groupCount(DB.licenses || [], (r) => r.type);
    const infl = groupCount(DB.influencers || [], (r) => r.primary_platform);
    const plat = (DB.platforms || []).map((p) => [p.name, p.mau_millions]).sort((a, b) => b[1] - a[1]);

    // SEB group vs competitors
    const grp = (DB.sebAudit && DB.sebAudit.group_brands || []).map((b) => [b.name, b.est_followers_millions]);
    const comp = (DB.sebAudit && DB.sebAudit.competitors || []).map((b) => [b.name, b.est_followers_millions]);

    const sectorLabels = {
      tech: "Tech", fashion: "Fashion", luxury: "Luxury", sportswear: "Sportswear", beauty: "Beauty",
      fnb: "Food & Bev", automotive: "Automotive", gaming: "Gaming", "home-appliance": "Home appliance",
      toys: "Toys", entertainment: "Entertainment", other: "Other",
    };
    const typeLabels = {
      film: "Film", tv: "TV", anime: "Anime", manga: "Manga", game: "Game", character: "Character",
      sport: "Sport", music: "Music", toy: "Toy", comic: "Comic",
    };

    host.innerHTML = [
      card(t("viz.followersByRegion"), t("ui.followers"), bars(region, { suffix: "M" }) + estimate),
      card(t("viz.followersBySector"), t("ui.followers"), bars(sector, { suffix: "M", labelMap: sectorLabels })),
      card(t("viz.licensesByType"), t("ui.results"), bars(lic, { labelMap: typeLabels })),
      card(t("viz.influencersByPlatform"), t("ui.results"), bars(infl, { labelMap: platLabels })),
      card(t("viz.platformReach"), t("ui.mau"), bars(plat, { suffix: "M" }) + estimate),
    ].join("");
    animate(host);

    // SEB audit dedicated chart
    const sebHost = document.getElementById("seb-viz");
    if (sebHost) {
      sebHost.innerHTML = card(
        t("viz.sebVsCompetitors"),
        t("ui.estimate"),
        `<div style="font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--red-ink);margin:4px 0 8px">${t("viz.sub.group")}</div>`
        + bars(grp.sort((a, b) => b[1] - a[1]), { suffix: "M" })
        + `<div style="font-family:var(--mono);font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--blue);margin:18px 0 8px">${t("viz.sub.compet")}</div>`
        + bars(comp.sort((a, b) => b[1] - a[1]), { suffix: "M" })
      );
      animate(sebHost);
    }
  }

  /* ============================================================
     Interactive bubble-cluster cloud (filterable)
     ============================================================ */
  const PALETTE = ["#ff0033","#195edd","#1f9d63","#b8730a","#8a4fd0","#0fb5c6","#d6336c","#5b6470","#e8a200","#2c7a5b","#7a4fd0","#c44"];
  const CL_CFG = {
    brands: { rows: () => DB.brands || [], val: (r) => r.est_followers_total_millions || 1, name: (r) => r.name, sub: (r) => r.country, groups: ["region", "sector"] },
    influencers: { rows: () => DB.influencers || [], val: (r) => r.est_followers_millions || 1, name: (r) => r.name, sub: (r) => (r.handle || r.country), groups: ["region", "niche", "primary_platform"] },
    licenses: { rows: () => DB.licenses || [], val: (r) => ({ S: 9, A: 5, B: 2 }[r.popularity_tier] || 2), name: (r) => r.name, sub: (r) => r.owner, groups: ["type", "popularity_tier"] },
    artists: { rows: () => DB.artists || [], val: (r) => r.est_monthly_listeners_millions || 1, name: (r) => r.name, sub: (r) => r.country, groups: ["genre"] },
  };
  const clusterState = { dataset: "brands", groupBy: "region", q: "" };

  function buildClusterControls() {
    const host = document.getElementById("cluster-controls");
    if (!host) return;
    const cfg = CL_CFG[clusterState.dataset];
    if (!cfg.groups.includes(clusterState.groupBy)) clusterState.groupBy = cfg.groups[0];
    const dsOpts = Object.keys(CL_CFG).map((k) => `<option value="${k}"${k === clusterState.dataset ? " selected" : ""}>${t("cluster.ds." + k)}</option>`).join("");
    const gbOpts = cfg.groups.map((g) => `<option value="${g}"${g === clusterState.groupBy ? " selected" : ""}>${t("ui." + ({ region: "region", sector: "sector", niche: "niche", primary_platform: "platform", type: "type", popularity_tier: "tier", genre: "genre" }[g] || "region"))}</option>`).join("");
    host.innerHTML =
      `<label style="font-family:var(--mono);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${t("cluster.dataset")}</label>`
      + `<select id="cl-ds" aria-label="${t("cluster.dataset")}">${dsOpts}</select>`
      + `<label style="font-family:var(--mono);font-size:.66rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)">${t("cluster.groupby")}</label>`
      + `<select id="cl-gb" aria-label="${t("cluster.groupby")}">${gbOpts}</select>`
      + `<input type="text" id="cl-q" aria-label="${t("ui.search")}" data-i18n-ph="ui.search" placeholder="${t("ui.search")}" value="${clusterState.q.replace(/"/g, "&quot;")}">`;
    document.getElementById("cl-ds").addEventListener("change", (e) => { clusterState.dataset = e.target.value; clusterState.groupBy = CL_CFG[clusterState.dataset].groups[0]; clusterState.q = ""; buildClusterControls(); renderClusters(); });
    document.getElementById("cl-gb").addEventListener("change", (e) => { clusterState.groupBy = e.target.value; renderClusters(); });
    document.getElementById("cl-q").addEventListener("input", (e) => { clusterState.q = e.target.value; highlightClusters(); });
  }

  function renderClusters() {
    const host = document.getElementById("cluster-viz");
    if (!host) return;
    const cfg = CL_CFG[clusterState.dataset];
    const rows = cfg.rows();
    const gb = clusterState.groupBy;
    // group
    const groups = new Map();
    rows.forEach((r) => { const g = r[gb] || "—"; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(r); });
    const gEntries = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    const colorOf = {}; gEntries.forEach(([g], i) => { colorOf[g] = PALETTE[i % PALETTE.length]; });

    const W = 1000, H = 600;
    const n = gEntries.length;
    const cols = Math.ceil(Math.sqrt(n));
    const rowsN = Math.ceil(n / cols);
    const cellW = W / cols, cellH = H / rowsN;
    const maxVal = Math.max(...rows.map(cfg.val), 1);
    const sizeK = (v) => Math.max(2.5, Math.min(18, Math.sqrt(v / maxVal) * 18));

    let circles = "";
    let labels = "";
    gEntries.forEach(([g, pts], gi) => {
      const col = gi % cols, row = Math.floor(gi / cols);
      const cx = col * cellW + cellW / 2, cy = row * cellH + cellH / 2 + 8;
      const maxR = Math.min(cellW, cellH) / 2 - 16;
      const spiralK = pts.length > 1 ? (maxR - 14) / Math.sqrt(pts.length) : 0;
      const sorted = pts.slice().sort((a, b) => cfg.val(b) - cfg.val(a));
      sorted.forEach((r, i) => {
        const ang = i * 2.399963;
        const rad = spiralK * Math.sqrt(i);
        const x = cx + rad * Math.cos(ang), y = cy + rad * Math.sin(ang);
        const rr = sizeK(cfg.val(r));
        const label = (cfg.name(r) + " · " + (cfg.sub(r) || "") + " · " + Math.round(cfg.val(r)) + (clusterState.dataset === "licenses" ? "" : "M")).replace(/"/g, "");
        circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${colorOf[g]}" fill-opacity="0.62" stroke="${colorOf[g]}" stroke-width="0.8" `
          + `data-name="${esc(cfg.name(r)).toLowerCase()}" data-tip="${esc(label)}"><title>${esc(label)}</title></circle>`;
      });
      labels += `<text x="${(col * cellW + cellW / 2).toFixed(1)}" y="${(row * cellH + 16).toFixed(1)}" text-anchor="middle" font-family="Space Mono, monospace" font-size="11" fill="${colorOf[g]}" font-weight="700">${esc(String(g))}</text>`;
    });

    const legend = gEntries.map(([g]) => `<span class="cl-leg"><i style="background:${colorOf[g]}"></i>${esc(String(g))}</span>`).join("");
    host.innerHTML =
      `<div class="cl-legend">${legend}</div>`
      + `<div class="cl-stage"><svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${t("cluster.title")}">${labels}${circles}</svg>`
      + `<div class="cl-tip" id="cl-tip" hidden></div></div>`
      + `<p class="muted" style="font-size:.78rem;margin-top:8px">${t("cluster.legend")} · ${t("ui.estimate")}</p>`;

    const svg = host.querySelector("svg"), tip = host.querySelector("#cl-tip");
    svg.addEventListener("mousemove", (e) => {
      const el = e.target.closest("circle");
      if (el) {
        tip.hidden = false; tip.textContent = el.getAttribute("data-tip");
        const r = host.getBoundingClientRect();
        tip.style.left = (e.clientX - r.left + 12) + "px";
        tip.style.top = (e.clientY - r.top + 12) + "px";
      } else { tip.hidden = true; }
    });
    svg.addEventListener("mouseleave", () => { tip.hidden = true; });
    highlightClusters();
  }

  function highlightClusters() {
    const host = document.getElementById("cluster-viz");
    if (!host) return;
    const q = clusterState.q.trim().toLowerCase();
    host.querySelectorAll("circle").forEach((c) => {
      if (!q) { c.style.opacity = ""; return; }
      c.style.opacity = c.getAttribute("data-name").includes(q) ? "1" : "0.08";
    });
  }

  function initClusters() {
    buildClusterControls();
    renderClusters();
  }

  /* ============================================================
     SEB positioning map — creator intensity × audience
     ============================================================ */
  const GROUP_INTENSITY = { "Supor": 3, "Tefal": 2, "Moulinex": 2, "Krups": 1, "Rowenta": 1, "SEB": 1, "Calor": 1, "All-Clad": 1, "WMF": 1, "Lagostina": 1, "Emsa": 1 };
  const INT = { low: 1, medium: 2, high: 3 };
  const shortName = (s) => String(s).split(/[(\/]/)[0].trim();

  function renderSebMap() {
    document.querySelectorAll("[data-seb-map]").forEach(renderSebMapInto);
  }
  function renderSebMapInto(host) {
    if (!host || !DB.sebAudit) return;
    const grp = (DB.sebAudit.group_brands || []).map((b) => ({ name: shortName(b.name), aud: b.est_followers_millions || 0, x: GROUP_INTENSITY[shortName(b.name)] || 1, seb: true }));
    const comp = (DB.sebAudit.competitors || []).map((b) => ({ name: shortName(b.name), aud: b.est_followers_millions || 0, x: INT[b.collab_intensity] || 1, seb: false }));
    const pts = grp.concat(comp);
    const W = 920, H = 440, L = 72, R = 892, T = 28, B = 364;
    const maxAud = Math.max(...pts.map((p) => p.aud), 8);
    const colC = { 1: L + (R - L) * 0.17, 2: L + (R - L) * 0.5, 3: L + (R - L) * 0.83 };
    const colW = (R - L) * 0.30;
    const yFor = (v) => B - (Math.min(v, maxAud) / maxAud) * (B - T);
    // even horizontal spread within each intensity column → no label/bubble overlap
    const byCol = { 1: [], 2: [], 3: [] };
    pts.forEach((p) => byCol[p.x].push(p));
    let circles = "";
    Object.keys(byCol).forEach((c) => {
      const arr = byCol[c].sort((a, b) => b.aud - a.aud), n = arr.length;
      arr.forEach((p, i) => {
        const x = colC[c] + (n > 1 ? (i - (n - 1) / 2) / (n - 1) * colW : 0);
        const y = yFor(p.aud);
        const rr = Math.max(4.5, Math.min(13, Math.sqrt(p.aud) * 4));
        const col = p.seb ? "#ff0033" : "#195edd";
        const tip = `${p.name} · ${p.aud}M · ${p.seb ? "Groupe SEB" : (I18N.lang === "fr" ? "Concurrent" : "Competitor")}`;
        circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}" fill="${col}" fill-opacity="${p.seb ? .72 : .5}" stroke="${col}" stroke-width="1.3" data-tip="${esc(tip)}" style="cursor:pointer"><title>${esc(tip)}</title></circle>`;
      });
    });
    const xLab = (I18N.lang === "fr") ? ["Faible", "Moyen", "Élevé"] : ["Low", "Medium", "High"];
    const axisLabel = (I18N.lang === "fr") ? "→ Intensité de la stratégie créateurs" : "→ Creator-strategy intensity";
    host.innerHTML =
      `<div class="viz-card"><h3>${I18N.lang === "fr" ? "Carte de positionnement — intensité créateurs × audience" : "Positioning map — creator intensity × audience"}</h3>`
      + `<div class="viz-sub">${I18N.lang === "fr" ? "Rouge = Groupe SEB · bleu = concurrents · taille = audience. Survolez une bulle pour le détail. " : "Red = Groupe SEB · blue = competitors · size = audience. Hover a bubble for details. "}${t("ui.estimate")}</div>`
      + `<div class="cl-stage"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${I18N.lang === "fr" ? "Carte de positionnement SEB vs concurrents" : "SEB vs competitors positioning map"}">`
      + `<line x1="${L}" y1="${B}" x2="${R}" y2="${B}" class="sch-axis"/><line x1="${L}" y1="${T}" x2="${L}" y2="${B}" class="sch-axis"/>`
      + [1, 2, 3].map((c) => `<line x1="${colC[c]}" y1="${T}" x2="${colC[c]}" y2="${B}" stroke="var(--line)" stroke-dasharray="3 6"/><text x="${colC[c]}" y="${B + 24}" text-anchor="middle" class="sch-flowlabel">${xLab[c - 1]}</text>`).join("")
      + `<text x="${(L + R) / 2}" y="${B + 46}" text-anchor="middle" class="sch-flowlabel" fill="var(--muted)">${axisLabel}</text>`
      + `<text transform="translate(20 ${(T + B) / 2}) rotate(-90)" text-anchor="middle" class="sch-flowlabel" fill="var(--muted)">${t("ui.followers")}</text>`
      + circles + `</svg><div class="cl-tip" hidden></div></div>`
      + `<div class="cl-legend" style="margin-top:10px"><span class="cl-leg"><i style="background:#ff0033"></i>Groupe SEB</span><span class="cl-leg"><i style="background:#195edd"></i>${I18N.lang === "fr" ? "Concurrents" : "Competitors"}</span></div></div>`;
    const stage = host.querySelector(".cl-stage"), svg = stage.querySelector("svg"), tip = stage.querySelector(".cl-tip");
    svg.addEventListener("mousemove", (e) => {
      const el = e.target.closest("circle");
      if (el) { tip.hidden = false; tip.textContent = el.getAttribute("data-tip"); const r = stage.getBoundingClientRect(); tip.style.left = (e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top + 12) + "px"; }
      else tip.hidden = true;
    });
    svg.addEventListener("mouseleave", () => { tip.hidden = true; });
  }

  const _renderAll = renderAll;
  function renderAllPlus() { _renderAll(); renderSebMap(); }

  window.DataViz = { renderAll: renderAllPlus, initClusters, renderClusters: () => { buildClusterControls(); renderClusters(); } };
})();
