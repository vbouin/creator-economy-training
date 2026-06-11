/* ============================================================
   i18n — FR/EN toggle
   - Long-form prose in index.html uses dual [data-lang-fr]/[data-lang-en]
     blocks toggled by CSS via <html lang>.
   - UI labels & JS-rendered strings use I18N[lang][key] via t().
   - Data objects carry *_fr / *_en fields, read via pick().
   ============================================================ */
(function () {
  const STORE_KEY = "ce-seb-lang";
  const SUPPORTED = ["fr", "en"];

  const I18N = {
    fr: {
      "nav.title": "Sommaire",
      "nav.intro": "Introduction",
      "nav.leviers": "Les 8 leviers",
      "nav.business": "Business models",
      "nav.legal": "Cadre légal",
      "nav.parties": "Parties prenantes",
      "nav.exemples": "Cas & exemples",
      "nav.limites": "Limites & ROI",
      "nav.roi": "Calculateur ROI",
      "nav.data": "Bases de données",
      "nav.audit": "Audit SEB",
      "nav.playbook": "Playbook",
      "nav.lexique": "Lexique",
      "nav.questions": "Questions live",

      "ui.search": "Rechercher...",
      "ui.all": "Tous",
      "ui.region": "Région",
      "ui.sector": "Secteur",
      "ui.type": "Type",
      "ui.platform": "Plateforme",
      "ui.niche": "Niche",
      "ui.genre": "Genre",
      "ui.tier": "Niveau",
      "ui.lever": "Levier",
      "ui.results": "résultats",
      "ui.followers": "Audience (M)",
      "ui.listeners": "Auditeurs/mois (M)",
      "ui.mau": "MAU (M)",
      "ui.name": "Nom",
      "ui.country": "Pays",
      "ui.owner": "Détenteur",
      "ui.brand": "Marque",
      "ui.partner": "Partenaire",
      "ui.year": "Année",
      "ui.outcome": "Résultat",
      "ui.note": "Note",
      "ui.ownBrand": "Marque propre",
      "ui.dealPosture": "Sponsoring",
      "ui.collabIntensity": "Intensité collabs",
      "ui.formats": "Formats favoris",
      "ui.commerce": "Social-commerce",
      "ui.yes": "Oui",
      "ui.no": "Non",
      "ui.estimate": "Chiffres = ordres de grandeur, estimations publiques.",

      "tabs.brands": "Marques",
      "tabs.licenses": "Licences / IP",
      "tabs.influencers": "Influenceurs",
      "tabs.artists": "Artistes",
      "tabs.collabs": "Collaborations",
      "tabs.platforms": "Plateformes",

      "poll.vote": "Votez",
      "poll.reveal": "Révéler les résultats",
      "poll.next": "Question suivante",
      "poll.prev": "Précédente",
      "poll.your": "Votre réponse",
      "poll.correct": "Bonne réponse",
      "poll.qof": "Question",
      "poll.start": "Lancer les questions live",
      "poll.intro": "5 questions à débattre en groupe au fil de la conférence. Projetez, laissez la salle penser et échanger, puis révélez les pistes d'animation.",
      "poll.discussion": "Échange",
      "poll.discussReveal": "Révéler les pistes",
      "poll.prompts": "Pistes pour l'échange",
      "poll.facilitator": "Pour l'animateur",

      "nav.focus": "Focus marques",
      "focus.eyebrow": "Focus marques",
      "focus.title": "Ce qui marche, et ce que ça produit",
      "focus.takeaway": "À retenir pour SEB",
      "focus.playPause": "Lecture / pause",
      "cluster.title": "Nuage interactif — marques & créateurs",
      "cluster.sub": "Chaque point = une entité. Taille = audience (M). Couleur = groupe. Filtrez, survolez, cliquez.",
      "cluster.dataset": "Jeu de données",
      "cluster.groupby": "Grouper / colorer par",
      "cluster.ds.brands": "Marques",
      "cluster.ds.influencers": "Influenceurs",
      "cluster.ds.licenses": "Licences",
      "cluster.ds.artists": "Artistes",
      "cluster.legend": "Survolez un point pour le détail.",
      "nav.sources": "Sources & méthodo",
      "nav.ia": "Futur — IA",
      "ui.source": "Source",

      "calc.title": "Calculateur de ROI d'une collaboration",
      "calc.sub": "Estimation indicative — à ajuster selon vos hypothèses. Aucune donnée n'est envoyée.",
      "calc.reach": "Audience touchée (abonnés, M)",
      "calc.engage": "Taux d'engagement",
      "calc.ctr": "Taux de clic vers le produit",
      "calc.conv": "Taux de conversion à l'achat",
      "calc.aov": "Panier moyen (EUR)",
      "calc.margin": "Marge brute",
      "calc.cost": "Coût de la collaboration (EUR)",
      "calc.integration": "Type d'intégration",
      "calc.int.demo": "Démo / tuto produit (fort)",
      "calc.int.review": "Test / review (moyen-fort)",
      "calc.int.usage": "Usage lifestyle (moyen)",
      "calc.int.name": "Name-dropping / mention (faible)",
      "calc.estReach": "Personnes exposées",
      "calc.estClicks": "Clics produit",
      "calc.estSales": "Ventes estimées",
      "calc.estRevenue": "CA généré",
      "calc.estProfit": "Marge générée",
      "calc.roi": "ROI estimé",
      "calc.disclaimer": "Modèle simplifié à visée pédagogique : la portée réelle, la qualité d'audience et l'effet de marque long terme ne sont pas capturés par ce seul calcul.",

      "viz.followersByRegion": "Audience cumulée des marques par région",
      "viz.followersBySector": "Audience cumulée des marques par secteur",
      "viz.licensesByType": "Licences par type d'IP",
      "viz.influencersByPlatform": "Influenceurs par plateforme principale",
      "viz.sebVsCompetitors": "SEB & marques du groupe vs concurrents (audience, M)",
      "viz.platformReach": "Portée des plateformes (MAU, M)",
      "viz.sub.group": "Marques du groupe SEB",
      "viz.sub.compet": "Concurrents",
    },
    en: {
      "nav.title": "Contents",
      "nav.intro": "Introduction",
      "nav.leviers": "The 8 levers",
      "nav.business": "Business models",
      "nav.legal": "Legal framework",
      "nav.parties": "Stakeholders",
      "nav.exemples": "Cases & examples",
      "nav.limites": "Limits & ROI",
      "nav.roi": "ROI calculator",
      "nav.data": "Databases",
      "nav.audit": "SEB audit",
      "nav.playbook": "Playbook",
      "nav.lexique": "Lexicon",
      "nav.questions": "Live questions",

      "ui.search": "Search...",
      "ui.all": "All",
      "ui.region": "Region",
      "ui.sector": "Sector",
      "ui.type": "Type",
      "ui.platform": "Platform",
      "ui.niche": "Niche",
      "ui.genre": "Genre",
      "ui.tier": "Tier",
      "ui.lever": "Lever",
      "ui.results": "results",
      "ui.followers": "Audience (M)",
      "ui.listeners": "Monthly listeners (M)",
      "ui.mau": "MAU (M)",
      "ui.name": "Name",
      "ui.country": "Country",
      "ui.owner": "Owner",
      "ui.brand": "Brand",
      "ui.partner": "Partner",
      "ui.year": "Year",
      "ui.outcome": "Outcome",
      "ui.note": "Note",
      "ui.ownBrand": "Own brand",
      "ui.dealPosture": "Brand deals",
      "ui.collabIntensity": "Collab intensity",
      "ui.formats": "Favored formats",
      "ui.commerce": "Social commerce",
      "ui.yes": "Yes",
      "ui.no": "No",
      "ui.estimate": "Figures = orders of magnitude, public estimates.",

      "tabs.brands": "Brands",
      "tabs.licenses": "Licenses / IP",
      "tabs.influencers": "Influencers",
      "tabs.artists": "Artists",
      "tabs.collabs": "Collaborations",
      "tabs.platforms": "Platforms",

      "poll.vote": "Vote",
      "poll.reveal": "Reveal results",
      "poll.next": "Next question",
      "poll.prev": "Previous",
      "poll.your": "Your answer",
      "poll.correct": "Correct answer",
      "poll.qof": "Question",
      "poll.start": "Start live questions",
      "poll.intro": "5 questions to debate in groups through the conference. Project, let the room think and exchange, then reveal the facilitation prompts.",
      "poll.discussion": "Discuss",
      "poll.discussReveal": "Reveal talking points",
      "poll.prompts": "Prompts for the exchange",
      "poll.facilitator": "For the facilitator",

      "nav.focus": "Brand focus",
      "focus.eyebrow": "Brand focus",
      "focus.title": "What works, and what it produces",
      "focus.takeaway": "Takeaway for SEB",
      "focus.playPause": "Play / pause",
      "cluster.title": "Interactive cloud — brands & creators",
      "cluster.sub": "Each dot = an entity. Size = audience (M). Color = group. Filter, hover, click.",
      "cluster.dataset": "Dataset",
      "cluster.groupby": "Group / color by",
      "cluster.ds.brands": "Brands",
      "cluster.ds.influencers": "Influencers",
      "cluster.ds.licenses": "Licenses",
      "cluster.ds.artists": "Artists",
      "cluster.legend": "Hover a dot for details.",
      "nav.sources": "Sources & method",
      "nav.ia": "Future — AI",
      "ui.source": "Source",

      "calc.title": "Collaboration ROI calculator",
      "calc.sub": "Indicative estimate — adjust to your assumptions. No data is sent anywhere.",
      "calc.reach": "Audience reached (followers, M)",
      "calc.engage": "Engagement rate",
      "calc.ctr": "Click-through to product",
      "calc.conv": "Purchase conversion rate",
      "calc.aov": "Average order value (EUR)",
      "calc.margin": "Gross margin",
      "calc.cost": "Collaboration cost (EUR)",
      "calc.integration": "Integration type",
      "calc.int.demo": "Product demo / tutorial (strong)",
      "calc.int.review": "Test / review (medium-strong)",
      "calc.int.usage": "Lifestyle usage (medium)",
      "calc.int.name": "Name-dropping / mention (weak)",
      "calc.estReach": "People exposed",
      "calc.estClicks": "Product clicks",
      "calc.estSales": "Estimated sales",
      "calc.estRevenue": "Revenue generated",
      "calc.estProfit": "Margin generated",
      "calc.roi": "Estimated ROI",
      "calc.disclaimer": "A simplified, educational model: real reach, audience quality and long-term brand effect are not captured by this calculation alone.",

      "viz.followersByRegion": "Combined brand audience by region",
      "viz.followersBySector": "Combined brand audience by sector",
      "viz.licensesByType": "Licenses by IP type",
      "viz.influencersByPlatform": "Influencers by primary platform",
      "viz.sebVsCompetitors": "SEB & group brands vs competitors (audience, M)",
      "viz.platformReach": "Platform reach (MAU, M)",
      "viz.sub.group": "SEB group brands",
      "viz.sub.compet": "Competitors",
    },
  };

  let lang = (function () {
    try { const s = localStorage.getItem(STORE_KEY); if (SUPPORTED.includes(s)) return s; } catch (e) {}
    return "fr"; // FR is the primary language (Groupe SEB audience); EN via toggle
  })();

  const listeners = [];

  const I = {
    get lang() { return lang; },
    supported: SUPPORTED,
    t(key) { return (I18N[lang] && I18N[lang][key]) || (I18N.fr[key]) || key; },
    /* pick a localized field: pick(obj,'note') -> obj.note_fr | obj.note_en ; pick(opt) -> opt[lang] */
    pick(obj, base) {
      if (obj == null) return "";
      if (base) { return obj[base + "_" + lang] != null ? obj[base + "_" + lang] : (obj[base + "_fr"] || ""); }
      return obj[lang] != null ? obj[lang] : (obj.fr || "");
    },
    set(next) {
      if (!SUPPORTED.includes(next) || next === lang) return;
      lang = next;
      try { localStorage.setItem(STORE_KEY, lang); } catch (e) {}
      document.documentElement.lang = lang;
      document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = I.t(el.getAttribute("data-i18n")); });
      document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.setAttribute("placeholder", I.t(el.getAttribute("data-i18n-ph"))); });
      listeners.forEach((fn) => { try { fn(lang); } catch (e) { console.error(e); } });
    },
    onChange(fn) { listeners.push(fn); },
    apply() {
      document.documentElement.lang = lang;
      document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = I.t(el.getAttribute("data-i18n")); });
      document.querySelectorAll("[data-i18n-ph]").forEach((el) => { el.setAttribute("placeholder", I.t(el.getAttribute("data-i18n-ph"))); });
    },
  };

  window.I18N = I;
})();
