/* ============================================================
   app.js — interactions
   nav · progress · TOC · lang toggle · reveal · levers ·
   data explorer · lexicon · ROI calculator · live poll deck
   ============================================================ */
(function () {
  const DB = window.DB || {};
  const I = window.I18N;
  const t = (k) => I.t(k);
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* ---------- language toggle ---------- */
  function initLang() {
    $$(".lang-toggle button").forEach((b) => {
      b.addEventListener("click", () => I.set(b.dataset.lang));
    });
    function syncButtons(l) {
      $$(".lang-toggle button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === l ? "true" : "false"));
    }
    I.onChange((l) => { syncButtons(l); rerender(); });
    syncButtons(I.lang);
    I.apply();
  }

  /* ---------- progress + topbar + TOC ---------- */
  function initNav() {
    const prog = $(".progress"), bar = $(".topbar");
    const onScroll = () => {
      const h = document.documentElement;
      const sc = h.scrollTop, max = h.scrollHeight - h.clientHeight;
      if (prog) prog.style.width = (max > 0 ? (sc / max) * 100 : 0) + "%";
      if (bar) bar.classList.toggle("solid", sc > 60);
    };
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const toc = $(".toc"), scrim = $(".scrim");
    const open = (o) => { if (toc) toc.classList.toggle("open", o); if (scrim) scrim.classList.toggle("show", o); };
    $(".nav-toggle") && $(".nav-toggle").addEventListener("click", () => open(!toc.classList.contains("open")));
    $(".toc-close") && $(".toc-close").addEventListener("click", () => open(false));
    scrim && scrim.addEventListener("click", () => open(false));
    $$(".toc a").forEach((a) => a.addEventListener("click", () => open(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") open(false); });
  }

  /* ---------- reveal on scroll ---------- */
  function initReveal() {
    if (!("IntersectionObserver" in window)) { $$(".reveal").forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((e) => io.observe(e));
  }
  function observeNew(root) {
    if (!("IntersectionObserver" in window)) { $$(".reveal", root).forEach((e) => e.classList.add("in")); return; }
    const io = new IntersectionObserver((ents) => { ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12 });
    $$(".reveal", root).forEach((e) => io.observe(e));
  }

  /* ---------- lever accordions ---------- */
  function initLevers() {
    $$(".lever-head").forEach((h) => {
      h.addEventListener("click", () => {
        const lever = h.closest(".lever");
        const open = lever.classList.contains("open");
        lever.classList.toggle("open", !open);
        h.setAttribute("aria-expanded", String(!open));
      });
    });
  }

  /* ---------- data explorer ---------- */
  const tag = (v) => `<span class="tag-cell">${esc(v)}</span>`;
  const pill = (v, cls) => `<span class="tag-cell ${cls || ""}">${esc(v)}</span>`;

  const EXPLORER = {
    brands: {
      rows: () => DB.brands || [],
      search: (r) => [r.name, r.country, r.owner, r.notable_for].join(" "),
      filters: [
        { key: "ui.region", field: "region" },
        { key: "ui.sector", field: "sector" },
      ],
      cols: [
        { key: "ui.name", get: (r) => `<strong>${esc(r.name)}</strong>` },
        { key: "ui.country", get: (r) => esc(r.country) + " " + tag(r.region) },
        { key: "ui.sector", get: (r) => tag(r.sector) },
        { key: "ui.followers", get: (r) => r.est_followers_total_millions, num: true },
        { key: "ui.collabIntensity", get: (r) => tag(r.collab_intensity) },
        { key: "ui.note", get: (r) => esc(I.pick(r, "note")) },
      ],
      sortDefault: "est_followers_total_millions",
    },
    licenses: {
      rows: () => DB.licenses || [],
      search: (r) => [r.name, r.owner, r.franchise, r.origin_country, (r.collab_examples || []).join(" ")].join(" "),
      filters: [
        { key: "ui.type", field: "type" },
        { key: "ui.tier", field: "popularity_tier" },
      ],
      cols: [
        { key: "ui.name", get: (r) => `<strong>${esc(r.name)}</strong>` },
        { key: "ui.type", get: (r) => tag(r.type) },
        { key: "ui.country", get: (r) => esc(r.origin_country) },
        { key: "ui.owner", get: (r) => esc(r.owner) },
        { key: "ui.tier", get: (r) => pill(r.popularity_tier, r.popularity_tier === "S" ? "r" : "") },
        { key: "ui.note", get: (r) => esc(I.pick(r, "note")) },
      ],
      sortDefault: null,
    },
    influencers: {
      rows: () => DB.influencers || [],
      search: (r) => [r.name, r.handle, r.country, (r.notable_partnerships || []).join(" ")].join(" "),
      filters: [
        { key: "ui.region", field: "region" },
        { key: "ui.platform", field: "primary_platform" },
        { key: "ui.niche", field: "niche" },
      ],
      cols: [
        { key: "ui.name", get: (r) => `<strong>${esc(r.name)}</strong><br><span class="muted" style="font-size:.8rem">${esc(r.handle || "")}</span>` },
        { key: "ui.country", get: (r) => esc(r.country) },
        { key: "ui.platform", get: (r) => tag(r.primary_platform) },
        { key: "ui.followers", get: (r) => r.est_followers_millions, num: true },
        { key: "ui.niche", get: (r) => tag(r.niche) },
        { key: "ui.ownBrand", get: (r) => (r.has_own_brand ? pill(t("ui.yes"), "g") : t("ui.no")) },
        { key: "ui.note", get: (r) => esc(I.pick(r, "note")) },
      ],
      sortDefault: "est_followers_millions",
    },
    artists: {
      rows: () => DB.artists || [],
      search: (r) => [r.name, r.country, r.genre, (r.notable_brand_partnerships || []).join(" ")].join(" "),
      filters: [{ key: "ui.genre", field: "genre" }],
      cols: [
        { key: "ui.name", get: (r) => `<strong>${esc(r.name)}</strong>` },
        { key: "ui.country", get: (r) => esc(r.country) },
        { key: "ui.genre", get: (r) => tag(r.genre) },
        { key: "ui.listeners", get: (r) => r.est_monthly_listeners_millions, num: true },
        { key: "ui.followers", get: (r) => r.est_social_followers_millions, num: true },
        { key: "ui.note", get: (r) => esc(I.pick(r, "note")) },
      ],
      sortDefault: "est_monthly_listeners_millions",
    },
    collaborations: {
      rows: () => DB.collaborations || [],
      search: (r) => [r.brand, r.partner, r.levier, r.business_model, I.pick(r, "description"), r.outcome_signal].join(" "),
      filters: [
        { key: "ui.lever", field: "levier" },
        { key: "ui.region", field: "region" },
      ],
      cols: [
        { key: "ui.brand", get: (r) => `<strong>${esc(r.brand)}</strong>` },
        { key: "ui.partner", get: (r) => esc(r.partner) + "<br>" + tag(r.partner_type) },
        { key: "ui.lever", get: (r) => tag(r.levier) },
        { key: "ui.note", get: (r) => esc(I.pick(r, "description")) },
        { key: "ui.outcome", get: (r) => esc(r.outcome_signal) },
        { key: "ui.year", get: (r) => esc(r.year) },
        { key: "ui.source", get: (r) => `<span class="muted" style="font-size:.82rem">${esc(r.source_note)}</span>` },
      ],
      sortDefault: null,
    },
    platforms: {
      rows: () => DB.platforms || [],
      search: (r) => [r.name, r.region, (r.favored_formats || []).join(" ")].join(" "),
      filters: [{ key: "ui.region", field: "region" }],
      cols: [
        { key: "ui.name", get: (r) => `<strong>${esc(r.name)}</strong>` },
        { key: "ui.region", get: (r) => tag(r.region) },
        { key: "ui.mau", get: (r) => r.mau_millions, num: true },
        { key: "ui.formats", get: (r) => (r.favored_formats || []).map(tag).join(" ") },
        { key: "ui.commerce", get: (r) => (r.commerce_features ? pill(t("ui.yes"), "g") : t("ui.no")) },
        { key: "ui.note", get: (r) => esc(I.pick(r, "note")) },
      ],
      sortDefault: "mau_millions",
    },
  };

  const explorerState = { tab: "brands", q: "", filters: {}, sort: null, dir: -1 };

  function renderExplorer() {
    const cfg = EXPLORER[explorerState.tab];
    if (!cfg) return;
    const ctrlHost = $("#explorer-controls");
    const tableHost = $("#explorer-table");
    if (!ctrlHost || !tableHost) return;

    // controls
    let ctrl = `<input type="text" id="exp-search" aria-label="${t("ui.search")}" data-i18n-ph="ui.search" placeholder="${t("ui.search")}" value="${esc(explorerState.q)}">`;
    cfg.filters.forEach((f) => {
      const vals = [...new Set(cfg.rows().map((r) => r[f.field]).filter(Boolean))].sort();
      const cur = explorerState.filters[f.field] || "";
      ctrl += `<select data-field="${f.field}" aria-label="${t(f.key)}"><option value="">${t(f.key)}: ${t("ui.all")}</option>`
        + vals.map((v) => `<option value="${esc(v)}"${v === cur ? " selected" : ""}>${esc(v)}</option>`).join("") + `</select>`;
    });
    ctrlHost.innerHTML = ctrl;
    $("#exp-search").addEventListener("input", (e) => { explorerState.q = e.target.value; renderRows(); });
    $$("select", ctrlHost).forEach((s) => s.addEventListener("change", (e) => {
      explorerState.filters[e.target.dataset.field] = e.target.value; renderRows();
    }));

    renderRows();
  }

  function renderRows() {
    const cfg = EXPLORER[explorerState.tab];
    const tableHost = $("#explorer-table");
    let rows = cfg.rows().slice();
    const q = explorerState.q.trim().toLowerCase();
    if (q) rows = rows.filter((r) => cfg.search(r).toLowerCase().includes(q));
    Object.entries(explorerState.filters).forEach(([f, v]) => { if (v) rows = rows.filter((r) => r[f] === v); });

    const sortField = explorerState.sort || cfg.sortDefault;
    if (sortField) {
      rows.sort((a, b) => {
        const av = a[sortField], bv = b[sortField];
        if (typeof av === "number" && typeof bv === "number") return (av - bv) * explorerState.dir;
        return String(av).localeCompare(String(bv)) * explorerState.dir;
      });
    }

    const head = cfg.cols.map((c, i) => {
      const isNum = c.num;
      return `<th data-col="${i}">${t(c.key)}</th>`;
    }).join("");
    const body = rows.map((r) => "<tr>" + cfg.cols.map((c) => `<td>${c.num ? esc(c.get(r)) : c.get(r)}</td>`).join("") + "</tr>").join("");

    tableHost.innerHTML = `<div class="tbl-wrap"><table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
      + `<p class="explorer-count">${rows.length} ${t("ui.results")} · ${t("ui.estimate")}</p>`;

    $$("th[data-col]", tableHost).forEach((th) => th.addEventListener("click", () => {
      const c = cfg.cols[+th.dataset.col];
      const field = c.field || fieldFromGetter(cfg, +th.dataset.col);
      // toggle sort using the column's primary data field if numeric, else name
      const f = c.num ? guessNumField(cfg, +th.dataset.col) : null;
      if (f) { explorerState.dir = explorerState.sort === f ? -explorerState.dir : -1; explorerState.sort = f; renderRows(); }
    }));
  }
  function fieldFromGetter() { return null; }
  function guessNumField(cfg, idx) {
    // map known numeric columns back to fields
    const map = { "ui.followers": ["est_followers_total_millions", "est_followers_millions", "est_social_followers_millions"], "ui.listeners": ["est_monthly_listeners_millions"], "ui.mau": ["mau_millions"] };
    const key = cfg.cols[idx].key;
    const cands = map[key] || [];
    const sample = cfg.rows()[0] || {};
    return cands.find((f) => f in sample) || null;
  }

  function initExplorer() {
    $$(".tab[data-tab]").forEach((tb) => tb.addEventListener("click", () => {
      explorerState.tab = tb.dataset.tab; explorerState.q = ""; explorerState.filters = {}; explorerState.sort = null; explorerState.dir = -1;
      $$(".tab[data-tab]").forEach((x) => x.setAttribute("aria-selected", x === tb ? "true" : "false"));
      renderExplorer();
    }));
    renderExplorer();
  }

  /* ---------- lexicon ---------- */
  function renderLexicon() {
    const host = $("#lex-list");
    if (!host) return;
    const q = ($("#lex-search") && $("#lex-search").value || "").trim().toLowerCase();
    let rows = (DB.lexicon || []).slice();
    if (q) rows = rows.filter((r) => (r.term + " " + I.pick(r, "def")).toLowerCase().includes(q));
    rows.sort((a, b) => a.term.localeCompare(b.term));
    host.innerHTML = rows.map((r) =>
      `<div class="lex-item"><div class="lex-term">${esc(r.term)}<span class="lex-cat">${esc(r.cat)}</span></div>`
      + `<div class="lex-def">${esc(I.pick(r, "def"))}</div></div>`).join("")
      || `<p class="muted">${t("ui.results")}: 0</p>`;
  }
  function initLexicon() {
    const s = $("#lex-search");
    if (s) s.addEventListener("input", renderLexicon);
    renderLexicon();
  }

  /* ---------- ROI calculator ---------- */
  const INTEG = { demo: 1, review: 0.7, usage: 0.45, name: 0.2 };
  function initCalc() {
    const host = $("#calc");
    if (!host) return;
    const fields = [
      { id: "reach", min: 0.1, max: 50, step: 0.1, val: 5, fmt: (v) => v + " M" },
      { id: "engage", min: 0.5, max: 15, step: 0.5, val: 4, fmt: (v) => v + " %" },
      { id: "ctr", min: 0.5, max: 20, step: 0.5, val: 5, fmt: (v) => v + " %" },
      { id: "conv", min: 0.2, max: 12, step: 0.2, val: 2, fmt: (v) => v + " %" },
      { id: "aov", min: 20, max: 400, step: 5, val: 120, fmt: (v) => v + " EUR" },
      { id: "margin", min: 10, max: 70, step: 1, val: 40, fmt: (v) => v + " %" },
      { id: "cost", min: 1000, max: 300000, step: 1000, val: 30000, fmt: (v) => (v / 1000) + "k EUR" },
    ];
    const left = $("#calc-inputs");
    left.innerHTML = fields.map((f) =>
      `<div class="calc-field"><label for="cf-${f.id}" data-i18n="calc.${f.id}">${t("calc." + f.id)}</label>`
      + `<div class="vrange"><input type="range" id="cf-${f.id}" aria-label="${t("calc." + f.id)}" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.val}">`
      + `<output id="co-${f.id}">${f.fmt(f.val)}</output></div></div>`
    ).join("")
      + `<div class="calc-field"><label data-i18n="calc.integration">${t("calc.integration")}</label>`
      + `<select id="cf-integration" aria-label="${t("calc.integration")}">`
      + ["demo", "review", "usage", "name"].map((k) => `<option value="${k}">${t("calc.int." + k)}</option>`).join("")
      + `</select></div>`;

    function compute() {
      const g = (id) => parseFloat($("#cf-" + id).value);
      const reachM = g("reach"), engage = g("engage") / 100, ctr = g("ctr") / 100, conv = g("conv") / 100,
        aov = g("aov"), margin = g("margin") / 100, cost = g("cost");
      const mult = INTEG[$("#cf-integration").value] || 0.5;
      const exposed = reachM * 1e6 * engage;            // engaged exposures
      const clicks = exposed * ctr * mult;
      const sales = clicks * conv;
      const revenue = sales * aov;
      const profit = revenue * margin - cost;
      const roi = cost > 0 ? (revenue * margin - cost) / cost : 0;
      fields.forEach((f) => { $("#co-" + f.id).textContent = f.fmt(g(f.id)); });
      const nf = (n) => new Intl.NumberFormat(I.lang === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 0 }).format(Math.round(n));
      const out = $("#calc-out");
      const roiPct = Math.round(roi * 100);
      out.innerHTML =
        `<div class="co-lbl" data-i18n="calc.roi">${t("calc.roi")}</div>`
        + `<div class="co-big ${roi >= 0 ? "pos" : "neg"}">${roiPct > 0 ? "+" : ""}${nf(roiPct)} %</div>`
        + `<hr>`
        + `<div class="calc-line"><span data-i18n="calc.estReach">${t("calc.estReach")}</span><b>${nf(exposed)}</b></div>`
        + `<div class="calc-line"><span data-i18n="calc.estClicks">${t("calc.estClicks")}</span><b>${nf(clicks)}</b></div>`
        + `<div class="calc-line"><span data-i18n="calc.estSales">${t("calc.estSales")}</span><b>${nf(sales)}</b></div>`
        + `<div class="calc-line"><span data-i18n="calc.estRevenue">${t("calc.estRevenue")}</span><b>${nf(revenue)} EUR</b></div>`
        + `<div class="calc-line"><span data-i18n="calc.estProfit">${t("calc.estProfit")}</span><b>${nf(profit)} EUR</b></div>`;
    }
    $$("input,select", host).forEach((el) => el.addEventListener("input", compute));
    host._compute = compute;
    compute();
  }

  /* ---------- live poll deck ---------- */
  const pollState = { idx: 0, revealed: false, chosen: null };
  function renderPoll() {
    const host = $("#poll");
    if (!host) return;
    const qs = DB.questions || [];
    const q = qs[pollState.idx];
    if (!q) return;
    const total = qs.length;
    const isDiscussion = q.type === "discussion";
    const isQuiz = q.type === "quiz";
    const typeLabel = isDiscussion ? t("poll.discussion") : (isQuiz ? "QUIZ" : (I.lang === "fr" ? "SONDAGE" : "POLL"));
    const kicker = `${t("poll.qof")} ${pollState.idx + 1} / ${total} · ${typeLabel} · §${q.section}`;

    let mid = "";
    if (isDiscussion) {
      const prompts = I.pick(q, "prompts") || [];
      mid = `<div class="discuss-label">${t("poll.prompts")}</div><ul class="discuss-prompts">`
        + prompts.map((p) => `<li>${esc(p)}</li>`).join("") + `</ul>`;
    } else {
      mid = `<div class="poll-opts">` + (q.options || []).map((o, i) => {
        let cls = "poll-opt";
        if (pollState.chosen === i) cls += " chosen";
        if (pollState.revealed && isQuiz && q.correct === i) cls += " correct";
        const letter = String.fromCharCode(65 + i);
        return `<button class="${cls}" data-opt="${i}"><span class="po-bar"></span>`
          + `<span class="po-txt"><strong style="font-family:var(--mono);margin-right:10px;color:var(--red-ink)">${letter}</strong>${esc(I.pick(o))}</span></button>`;
      }).join("") + `</div>`;
    }

    const fbLabel = isDiscussion ? t("poll.facilitator") : (isQuiz ? (t("poll.correct") + " : " + String.fromCharCode(65 + q.correct)) : "Insight");
    const fb = pollState.revealed ? `<div class="poll-feedback"><strong>${fbLabel}.</strong> ${esc(I.pick(q, "insight"))}</div>` : "";
    const revealLabel = pollState.revealed ? (t("poll.next") + " &rarr;") : (isDiscussion ? t("poll.discussReveal") : t("poll.reveal"));

    host.className = "poll" + (pollState.revealed ? " revealed" : "");
    host.innerHTML =
      `<div class="q-kicker">${esc(kicker)}</div>`
      + `<h3>${esc(I.pick(q, "q"))}</h3>`
      + mid + fb
      + `<div class="poll-nav">`
      + `<button class="btn-link" data-act="prev"${pollState.idx === 0 ? " disabled style=opacity:.4" : ""}>&larr; ${t("poll.prev")}</button>`
      + `<button class="btn-link solid" data-act="reveal">${revealLabel}</button>`
      + `</div>`;

    $$(".poll-opt", host).forEach((b) => b.addEventListener("click", () => { pollState.chosen = +b.dataset.opt; renderPoll(); }));
    const prevB = $('[data-act="prev"]', host);
    prevB && prevB.addEventListener("click", () => { if (pollState.idx > 0) { pollState.idx--; pollState.revealed = false; pollState.chosen = null; renderPoll(); } });
    $('[data-act="reveal"]', host).addEventListener("click", () => {
      if (!pollState.revealed) { pollState.revealed = true; renderPoll(); }
      else if (pollState.idx < total - 1) { pollState.idx++; pollState.revealed = false; pollState.chosen = null; renderPoll(); host.scrollIntoView({ behavior: "smooth", block: "center" }); }
    });
  }

  /* ---------- brand focus spotlights ---------- */
  function renderFocus() {
    const host = $("#focus-grid");
    if (!host || !DB.focus) return;
    host.innerHTML = DB.focus.map((f) => {
      const poster = f.video ? `assets/img/${f.video.replace(".mp4", "-poster.jpg")}` : "";
      const vid = f.video
        ? `<div class="focus-media"><video src="assets/video/${f.video}" poster="${poster}" muted loop playsinline preload="metadata" onerror="this.closest('.focus-media').classList.add('novid')"></video>`
          + (f.video2 ? `<video src="assets/video/${f.video2}" poster="assets/img/${f.video2.replace(".mp4", "-poster.jpg")}" muted loop playsinline preload="none" class="focus-media-2"></video>` : "")
          + `<button class="focus-play" aria-label="play">►</button></div>`
        : "";
      return `<article class="focus reveal">`
        + vid
        + `<div class="focus-body"><span class="k">${esc(I.pick(f, "lever"))}</span>`
        + `<h3>${esc(f.brand)}</h3>`
        + `<p class="focus-head">${esc(I.pick(f, "headline"))}</p>`
        + `<div class="focus-metric"><span class="fm-val">${esc(f.metric)}</span><span class="fm-lbl">${esc(I.pick(f, "metric_label"))}</span></div>`
        + `<p>${esc(I.pick(f, "body"))}</p>`
        + `<p class="focus-take"><strong>${t("focus.takeaway")} —</strong> ${esc(I.pick(f, "takeaway"))}</p>`
        + `</div></article>`;
    }).join("");
    // play/pause on click
    $$(".focus-media", host).forEach((m) => {
      const vids = $$("video", m);
      m.querySelector(".focus-play") && m.querySelector(".focus-play").addEventListener("click", () => {
        const playing = vids[0] && !vids[0].paused;
        vids.forEach((v) => { if (playing) v.pause(); else v.play().catch(() => {}); });
        m.classList.toggle("playing", !playing);
      });
    });
    if (window.CE) window.CE.observeNew(host);
  }
  function initPoll() {
    renderPoll();
    const banner = $(".mode-banner");
    const goBtn = $("#poll-go");
    goBtn && goBtn.addEventListener("click", () => { $("#questions").scrollIntoView({ behavior: "smooth" }); });
  }

  /* ---------- SEB deep analysis (what SEB does + competitor actions) ---------- */
  const sebCompetState = { channel: "" };
  function renderSebAnalysis() {
    const A = DB.sebAnalysis;
    if (!A) return;
    const does = $("#seb-does");
    if (does && A.seb_insights) {
      does.innerHTML = A.seb_insights.map((f) =>
        `<div class="card reveal"><span class="k">${esc(f.brand)}</span>`
        + `<p style="color:var(--ink-2)">${esc(I.pick(f, "action"))}</p>`
        + `<p class="focus-take" style="margin-top:12px"><strong>${I.lang === "fr" ? "Leçon" : "Lesson"} —</strong> ${esc(I.pick(f, "lesson"))}</p>`
        + `<cite style="display:block;margin-top:8px;font-family:var(--mono);font-size:.62rem;color:var(--muted);font-style:normal">${esc(f.source)}</cite></div>`
      ).join("");
      if (window.CE) window.CE.observeNew(does);
    }
    const ctrl = $("#seb-compet-controls"), host = $("#seb-compet");
    if (ctrl && host && A.competitor_actions) {
      const channels = [...new Set(A.competitor_actions.map((c) => c.channel))].sort();
      ctrl.innerHTML = `<select id="seb-ch" aria-label="${t("ui.platform")}"><option value="">${t("ui.platform")}: ${t("ui.all")}</option>`
        + channels.map((c) => `<option value="${esc(c)}"${c === sebCompetState.channel ? " selected" : ""}>${esc(c)}</option>`).join("") + `</select>`;
      $("#seb-ch").addEventListener("change", (e) => { sebCompetState.channel = e.target.value; paintCompet(); });
      paintCompet();
    }
    function paintCompet() {
      let rows = A.competitor_actions.slice();
      if (sebCompetState.channel) rows = rows.filter((r) => r.channel === sebCompetState.channel);
      host.innerHTML = rows.map((c) =>
        `<div class="card reveal"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><h3 style="font-size:1.15rem">${esc(c.competitor)}</h3><span class="tag-cell">${esc(c.channel)}</span></div>`
        + `<p style="color:var(--muted);margin-top:8px">${esc(I.pick(c, "action"))}</p>`
        + `<p style="margin-top:10px;color:var(--red-ink);font-weight:500;font-size:.92rem">▸ ${esc(I.pick(c, "result"))}</p>`
        + `<cite style="display:block;margin-top:8px;font-family:var(--mono);font-size:.62rem;color:var(--muted);font-style:normal">${esc(c.source)}</cite></div>`
      ).join("") + `<p class="explorer-count" style="grid-column:1/-1">${rows.length} ${t("ui.results")} · ${t("ui.estimate")}</p>`;
      if (window.CE) window.CE.observeNew(host);
    }
  }

  /* ---------- sources & URLs ---------- */
  function renderSources() {
    const host = $("#sources-list");
    if (!host || !DB.sources) return;
    const heads = {
      audience: { fr: "Données & audiences", en: "Data & audiences" },
      platforms: { fr: "Plateformes & études", en: "Platforms & studies" },
      cases: { fr: "Cas & campagnes", en: "Cases & campaigns" },
      seb: { fr: "SEB & marché", en: "SEB & market" },
    };
    const order = ["audience", "platforms", "cases", "seb"];
    host.innerHTML = order.map((cat) => {
      const items = DB.sources.filter((s) => s.cat === cat);
      if (!items.length) return "";
      return `<div class="src-group"><h4>${esc((heads[cat] || {})[I.lang] || cat)}</h4><ul>`
        + items.map((s) => {
          let dom = ""; try { dom = new URL(s.url).hostname.replace(/^www\./, ""); } catch (e) { dom = s.url; }
          return `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} <span class="src-dom">${esc(dom)} ↗</span></a></li>`;
        }).join("") + `</ul></div>`;
    }).join("");
  }

  /* ---------- scroll-scrubbed videos ---------- */
  function initScrub() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    $$(".scrolly").forEach((b) => {
      const v = $(".scrolly-sticky > video", b);
      if (!v) return;
      v.pause();
      let dur = v.duration || 0, ticking = false;
      const update = () => {
        const total = b.offsetHeight - window.innerHeight;
        const top = b.getBoundingClientRect().top;
        let p = total > 0 ? (-top) / total : 0;
        p = Math.min(Math.max(p, 0), 1);
        if (dur) { const t = p * Math.max(0, dur - 0.05); if (Math.abs((v.currentTime || 0) - t) > 0.012) { try { v.currentTime = t; } catch (e) {} } }
        ticking = false;
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      const onMeta = () => { dur = v.duration || 0; update(); };
      if (v.readyState >= 1) onMeta(); else { v.addEventListener("loadedmetadata", onMeta); v.load(); }
      document.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    });
  }

  /* ---------- re-render on language change ---------- */
  function rerender() {
    renderExplorer();
    renderLexicon();
    renderPoll();
    renderFocus();
    renderSebAnalysis();
    renderSources();
    if (window.DataViz) { window.DataViz.renderAll(); window.DataViz.renderClusters(); }
    const calc = $("#calc"); if (calc && calc._compute) calc._compute();
  }

  /* ---------- boot ---------- */
  /* ---------- porte d'accès (hébergement public) ----------
     Le code n'apparaît jamais en clair : seul son empreinte SHA-256 est stockée.
     Pour changer le code :  python3 -c "import hashlib;print(hashlib.sha256('NOUVEAU-CODE'.encode()).hexdigest())"
     NB : dissuasif, pas un chiffrement — sur un repo public le contenu reste lisible dans les sources. */
  var GATE_HASH = "e5ef157facf77e92f68c6441c59cd133a77301e175ea8c22b02de53f602d97d3";
  function gateUnlock() {
    try { localStorage.setItem("ce-access", "ok"); } catch (e) {}
    document.documentElement.classList.remove("locked");
    var g = document.querySelector(".gate");
    if (g) g.remove();
  }
  function gateSha(s) {
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  function initGate() {
    var ok = false;
    try { ok = localStorage.getItem("ce-access") === "ok"; } catch (e) {}
    if (ok) return gateUnlock();
    if (!(window.crypto && crypto.subtle)) { gateUnlock(); return; } // contexte non sécurisé : fail-open (le contenu n'est de toute façon pas chiffré)
    document.documentElement.classList.add("locked");
    var g = document.createElement("div");
    g.className = "gate";
    g.innerHTML =
      '<form class="gate-card" novalidate>'
      + '<p class="gate-eyebrow">Exoflow × Groupe SEB</p>'
      + '<h2 class="gate-title"><span data-lang-fr>Accès réservé</span><span data-lang-en>Restricted access</span></h2>'
      + '<p class="gate-sub"><span data-lang-fr>Entrez le code d’accès communiqué en formation.</span><span data-lang-en>Enter the access code shared during the training.</span></p>'
      + '<div class="gate-row"><input type="password" id="gate-input" autocomplete="off" aria-label="Code d’accès / Access code" placeholder="••••••••">'
      + '<button type="submit" class="gate-btn"><span data-lang-fr>Entrer</span><span data-lang-en>Enter</span></button></div>'
      + '<p class="gate-err" hidden><span data-lang-fr>Code incorrect.</span><span data-lang-en>Incorrect code.</span></p>'
      + '</form>';
    document.body.appendChild(g);
    var input = g.querySelector("#gate-input"), err = g.querySelector(".gate-err");
    g.querySelector("form").addEventListener("submit", function (e) {
      e.preventDefault();
      gateSha(input.value.trim().toLowerCase()).then(function (h) {
        if (h === GATE_HASH) gateUnlock();
        else { err.hidden = false; input.value = ""; input.focus(); g.querySelector(".gate-card").classList.add("shake"); setTimeout(function () { g.querySelector(".gate-card").classList.remove("shake"); }, 450); }
      });
    });
    setTimeout(function () { input.focus(); }, 100);
    // déverrouillage par paramètre d'URL (génération PDF, lien direct maîtrisé) : ?code=...
    var p = new URLSearchParams(location.search).get("code");
    if (p) gateSha(p.trim().toLowerCase()).then(function (h) { if (h === GATE_HASH) gateUnlock(); });
  }

  /* ---------- mode conférence (P1) ----------
     Pattern slides clavier repris de qual-sigma (SLIDES_V2). */
  function initMode() {
    const btn = $("#mode-toggle");
    if (!btn) return;
    const progress = $("#conf-progress"), cpAct = $("#cp-act"), cpN = $("#cp-n");
    const blackout = $("#blackout"), help = $("#kbd-help");
    let stops = [], idx = 0;

    function collectStops() {
      stops = $$("section").filter((s) => s.offsetParent !== null || s.offsetHeight > 0);
    }
    function actOf(i) {
      let act = "";
      for (let k = 0; k <= i; k++) if (stops[k].dataset.act) act = stops[k].dataset.act;
      return act;
    }
    function paint() {
      if (!document.body.classList.contains("mode-conf")) return;
      const a = actOf(idx);
      const word = document.body.dataset[I.lang === "fr" ? "actwordFr" : "actwordEn"] || (I.lang === "fr" ? "Acte" : "Act");
      cpAct.textContent = a ? (word + " " + a + " · ") : "";
      cpN.textContent = (idx + 1) + " / " + stops.length;
    }
    function goTo(i) {
      idx = Math.max(0, Math.min(stops.length - 1, i));
      stops[idx].scrollIntoView({ behavior: "smooth", block: "start" });
      paint();
    }
    function syncFromScroll() {
      if (!document.body.classList.contains("mode-conf")) return;
      const y = window.scrollY + window.innerHeight * 0.4;
      for (let k = stops.length - 1; k >= 0; k--) {
        if (stops[k].offsetTop <= y) { idx = k; break; }
      }
      paint();
    }
    function setMode(conf, save) {
      document.body.classList.toggle("mode-conf", conf);
      btn.setAttribute("aria-pressed", conf ? "true" : "false");
      progress.hidden = !conf;
      if (!conf) { blackout.hidden = true; help.hidden = true; }
      if (conf) { collectStops(); syncFromScroll(); }
      if (save) { try { localStorage.setItem("ce-mode", conf ? "conf" : "lecture"); } catch (e) {} }
    }
    btn.addEventListener("click", () => setMode(!document.body.classList.contains("mode-conf"), true));
    let st;
    window.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(syncFromScroll, 120); }, { passive: true });
    document.addEventListener("keydown", (e) => {
      if (!document.body.classList.contains("mode-conf")) return;
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select" || tag === "textarea") return;
      if (e.key === "Escape") { blackout.hidden = true; help.hidden = true; return; }
      if (!blackout.hidden || !help.hidden) {
        if (e.key.toLowerCase() === "b" && !blackout.hidden) { blackout.hidden = true; e.preventDefault(); }
        if (e.key === "?" && !help.hidden) { help.hidden = true; e.preventDefault(); }
        return;
      }
      switch (e.key) {
        case "ArrowRight": case "PageDown": e.preventDefault(); goTo(idx + 1); break;
        case " ": e.preventDefault(); goTo(idx + (e.shiftKey ? -1 : 1)); break;
        case "ArrowLeft": case "PageUp": e.preventDefault(); goTo(idx - 1); break;
        case "Home": e.preventDefault(); goTo(0); break;
        case "End": e.preventDefault(); goTo(stops.length - 1); break;
        case "b": case "B": e.preventDefault(); blackout.hidden = false; break;
        case "?": e.preventDefault(); help.hidden = false; break;
      }
    });
    blackout.addEventListener("click", () => { blackout.hidden = true; });
    help.addEventListener("click", () => { help.hidden = true; });
    I.onChange(paint);
    let saved = "lecture";
    try { saved = localStorage.getItem("ce-mode") || "lecture"; } catch (e) {}
    setMode(saved === "conf", false);
  }

  function boot() {
    initGate();
    initLang();
    initNav();
    initMode();
    initLevers();
    initExplorer();
    initLexicon();
    initCalc();
    initPoll();
    renderFocus();
    renderSebAnalysis();
    renderSources();
    if (window.DataViz) { window.DataViz.renderAll(); window.DataViz.initClusters(); }
    initScrub();
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $$("video[autoplay]").forEach((v) => { v.removeAttribute("autoplay"); try { v.pause(); } catch (e) {} v.setAttribute("controls", ""); });
    }
    initReveal();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.CE = { rerender, observeNew };
})();
