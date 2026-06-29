# Creator Economy — Playbook · Exoflow × Groupe SEB

Site interactif bilingue (FR/EN) pour la formation des chefs de marque du Groupe SEB sur la **creator economy**, structuré en **5 actes** : le constat (+ carte SEB vs concurrents en cliffhanger), le terrain de jeu, l'arsenal (8 leviers, business models, Design-to-Share), les pièges (légal, scandales, ROI), à vous de jouer (audit SEB, playbook, canvas, calculateur). Avec **7 bases de données explorables (~780 entrées)** dont benchmarks de prix, **mode Conférence** (navigation clavier) et **5 questions d'échange**.

DA Exoflow : Fraunces / Inter / Space Mono, sections éditoriales clair/sombre, rouge `#ff0033` + bleu `#195edd`.

## 🌐 En ligne

**https://vbouin.github.io/creator-economy-training/** — code d'accès : `exoflow`

## 🔐 Accès

Le site est protégé par un **code d'accès** (porte client-side, empreinte SHA-256 — le code n'apparaît jamais en clair dans les sources). Déverrouillage mémorisé en localStorage ; lien direct possible via `?code=…`.

Pour changer le code : générer la nouvelle empreinte puis remplacer `GATE_HASH` dans `assets/js/app.js` :
```bash
python3 -c "import hashlib;print(hashlib.sha256('NOUVEAU-CODE'.encode()).hexdigest())"
```
> ⚠️ **Limite assumée** : c'est un verrou dissuasif, pas un chiffrement. Si le dépôt est public, le contenu (HTML, données) reste lisible dans les sources. Pour une protection réelle : dépôt privé + hébergement avec authentification (Cloudflare Access, Netlify password…).

## Lancer

```bash
cd creator-economy-seb
python3 server.py            # → http://localhost:4600/
```
Ou ouvrir `index.html` directement (`file://`) — les données sont pré-bundlées ; seules les vidéos préfèrent le serveur (Range requests).

## Double usage
- **Mode Conférence** (bouton topbar) : navigation section par section au clavier (`←` `→` `Espace` `Début/Fin`), indicateur « Acte N · n/N », `B` écran noir, `?` aide raccourcis.
- **Mode Lecture** : scroll libre, exploration des bases, calculateur ROI, lexique, PDF A4 téléchargeable.

## Étendre les bases de données
1. Édite le `.json` concerné dans `data/` (respecte le schéma), ou dépose un `data/<base>-extra*.json` (même schéma) — `build_bundle.py` fusionne et **déduplique** (par id et par nom).
2. Relance :
   ```bash
   python3 fix_accents.py     # restaure les accents FR (idempotent)
   python3 build_bundle.py    # → assets/js/data-bundle.js
   ```
3. Recharge — explorateur, filtres et graphiques se mettent à jour.

## Générer le PDF
```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --no-pdf-header-footer --virtual-time-budget=25000 \
  --print-to-pdf="Exoflow-Creator-Economy-Playbook.pdf" "file://$(pwd)/index.html"
```
La porte d'accès et les éléments de navigation sont masqués à l'impression ; le PDF affiche les deux langues (handout complet).

## Structure
```
├── index.html               # playbook scrollytelling (5 actes)
├── data.html · roi.html · lexique.html   # outils (explorateur · ROI · lexique)
├── server.py                # serveur local + Range (vidéo)
├── build_bundle.py          # data/*.json → assets/js/data-bundle.js
├── fix_accents.py           # accents FR des champs *_fr
├── data/                    # brands(84) · licenses(138) · influencers(318, ~175 food)
│                            # artists(84) · collaborations(135) · platforms(18)
│                            # benchmarks · seb-audit · seb-analysis · lexicon(44)
│                            # focus(7) · questions(5) · sources(18)
├── assets/css/styles.css    # design system + print + gate + mode conférence
├── assets/js/               # app.js · dataviz.js · i18n.js · data-bundle.js (généré)
├── assets/img/              # logos, favicon, images de cas → SOURCES-IMAGES.md
└── assets/video/            # hero, cas, IA, scroll-scrub (~28 Mo)
```

## ⚖️ Fiabilité, données & images
- Tous les chiffres (abonnés, MAU, prix) sont des **ordres de grandeur / estimations publiques**, à recouper avant usage externe ou décision d'investissement. Les collaborations citées sont réelles et documentées.
- Images de cas : sources et licences tracées dans [`assets/img/SOURCES-IMAGES.md`](assets/img/SOURCES-IMAGES.md). Usage pédagogique interne OK ; **re-vérifier les 6 images presse avant toute publication grand public**.
- Pages en `noindex` + CSP + Referrer-Policy. Headers serveur recommandés : `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, HSTS.

© Exoflow 2026 — document de travail interne. [exoflow.fr](https://exoflow.fr) · [LinkedIn](https://www.linkedin.com/in/victorbouin)
