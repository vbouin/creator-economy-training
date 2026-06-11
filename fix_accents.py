#!/usr/bin/env python3
"""Restore French accents in *_fr string fields of data/*.json (in place).
Curated, unambiguous vocabulary only (skips a/à, ou/où except a few exact phrases).
Run:  python3 fix_accents.py  then  python3 build_bundle.py
"""
import json, re, pathlib

DATA = pathlib.Path(__file__).parent / "data"

# lowercase plain -> accented. Capitalized variants are generated automatically.
PAIRS = {
 "createur":"créateur","createurs":"créateurs","createur":"créateur","createurs":"créateurs",
 "creation":"création","creations":"créations","creer":"créer","cree":"créé","creee":"créée","crees":"créés","creees":"créées",
 "economie":"économie","economique":"économique","economiques":"économiques","ecosysteme":"écosystème","ecosystemes":"écosystèmes",
 "presence":"présence","present":"présent","presente":"présente","presents":"présents","presentes":"présentes","presenter":"présenter",
 "strategie":"stratégie","strategies":"stratégies","strategique":"stratégique",
 "communaute":"communauté","communautes":"communautés",
 "evenement":"événement","evenements":"événements","evenementiel":"événementiel","evenementielle":"événementielle",
 "genere":"généré","generee":"générée","generes":"générés","generees":"générées","generer":"générer","generent":"génèrent","generation":"génération","generationnel":"générationnel","intergenerationnel":"intergénérationnel","intergenerationnelle":"intergénérationnelle",
 "reseau":"réseau","reseaux":"réseaux",
 "celebrite":"célébrité","celebrites":"célébrités","celebre":"célèbre","celebres":"célèbres",
 "fidele":"fidèle","fideles":"fidèles","fidelite":"fidélité","fideliser":"fidéliser","fidelise":"fidélisé",
 "modele":"modèle","modeles":"modèles",
 "tres":"très","meme":"même","memes":"mêmes","etre":"être","deja":"déjà","apres":"après","ete":"été","etat":"état",
 "geant":"géant","geante":"géante","geants":"géants","geantes":"géantes",
 "numero":"numéro","decennie":"décennie","decennies":"décennies",
 "esthetique":"esthétique","esthetiques":"esthétiques",
 "americain":"américain","americaine":"américaine","americains":"américains","americaines":"américaines",
 "coreen":"coréen","coreenne":"coréenne","coreens":"coréens","coreennes":"coréennes",
 "bresilien":"brésilien","bresilienne":"brésilienne","bresiliens":"brésiliens",
 "egyptien":"égyptien","egyptienne":"égyptienne",
 "nigerian":"nigérian","nigeriane":"nigériane","nigerians":"nigérians",
 "kenyan":"kényan","kenyane":"kényane",
 "desirabilite":"désirabilité","desirable":"désirable","desirables":"désirables",
 "penetration":"pénétration","reference":"référence","references":"références",
 "categorie":"catégorie","categories":"catégories",
 "specifique":"spécifique","specifiques":"spécifiques",
 "democratisant":"démocratisant","democratise":"démocratise","democratiser":"démocratiser","democratisation":"démocratisation",
 "relaye":"relayé","relayee":"relayée","relayes":"relayés","relayees":"relayées",
 "portee":"portée","portees":"portées","lancee":"lancée","lancees":"lancées",
 "elevee":"élevée","elevees":"élevées","eleve":"élevé","eleves":"élevés",
 "maitrise":"maîtrise","maitrisee":"maîtrisée","cle":"clé","cles":"clés",
 "annee":"année","annees":"années","societe":"société","societes":"sociétés",
 "propriete":"propriété","proprietes":"propriétés","proprietaire":"propriétaire","proprietaires":"propriétaires",
 "media":"média","medias":"médias","mediatique":"médiatique",
 "premiere":"première","premieres":"premières","derniere":"dernière","dernieres":"dernières","entiere":"entière","maniere":"manière","particuliere":"particulière","chere":"chère",
 "legende":"légende","legendaire":"légendaire","experience":"expérience","experiences":"expériences",
 "negocie":"négocié","negocier":"négocier","negociation":"négociation",
 "selectif":"sélectif","selective":"sélective","selectifs":"sélectifs","selectives":"sélectives","selection":"sélection",
 "complementaire":"complémentaire","equite":"équité","equipe":"équipe","equipes":"équipes","equivalent":"équivalent",
 "evolue":"évolué","evolution":"évolution","declinaisons":"déclinaisons","declinee":"déclinée","declinees":"déclinées",
 "inedit":"inédit","inedite":"inédite","qualite":"qualité","qualites":"qualités","notoriete":"notoriété",
 "acces":"accès","succes":"succès","interet":"intérêt","interets":"intérêts",
 "controle":"contrôle","controlee":"contrôlée","cout":"coût","couts":"coûts","couteux":"coûteux","couteuse":"coûteuse",
 "extreme":"extrême","extremes":"extrêmes",
 "mondialisee":"mondialisée","mondialise":"mondialisé","heritage":"héritage","heritages":"héritages",
 "veritable":"véritable","realite":"réalité","realisation":"réalisation","realisations":"réalisations","realise":"réalisé","realisee":"réalisée",
 "operationnel":"opérationnel","phenomene":"phénomène","phenomenes":"phénomènes",
 "prive":"privé","privee":"privée","detail":"détail","details":"détails","detaille":"détaillé",
 "elabore":"élaboré","exclusivite":"exclusivité","remunere":"rémunéré","remuneration":"rémunération",
 "energie":"énergie","electromenager":"électroménager","menager":"ménager","menagere":"ménagère","menagers":"ménagers",
 "beaute":"beauté","sante":"santé","durabilite":"durabilité","acceleration":"accélération","accelere":"accéléré",
 "authenticite":"authenticité","visibilite":"visibilité","egerie":"égérie","egeries":"égéries",
 "edition":"édition","editions":"éditions","etabli":"établi","etablie":"établie","etranger":"étranger",
 "hote":"hôte","hotes":"hôtes","decoration":"décoration","deco":"déco","capitalise":"capitalisé",
 "diffusee":"diffusée","diffuse":"diffusé","ciblee":"ciblée","ciblees":"ciblées",
 "dediee":"dédiée","dedie":"dédié","integree":"intégrée","integre":"intégré","integration":"intégration","integrant":"intégrant",
 "reputation":"réputation",
 # second batch
 "depasser":"dépasser","depasse":"dépasse","depasse":"dépassé","depassant":"dépassant",
 "monetisent":"monétisent","monetiser":"monétiser","monetise":"monétisé","monetisation":"monétisation",
 "parait":"paraît","paraitre":"paraître","comedie":"comédie","comedien":"comédien","comedienne":"comédienne",
 "video":"vidéo","videos":"vidéos","demo":"démo","demos":"démos","democratique":"démocratique",
 "complete":"complète","completes":"complètes","completer":"compléter","complet":"complet",
 "definie":"définie","defini":"défini","definir":"définir","definis":"définis","definies":"définies",
 "resultat":"résultat","resultats":"résultats","frequente":"fréquente","frequent":"fréquent","frequence":"fréquence","frequemment":"fréquemment",
 "rapporte":"rapporté","rapportee":"rapportée","revelateur":"révélateur","revele":"révélé","revelee":"révélée",
 "abonne":"abonné","abonnee":"abonnée","abonnes":"abonnés","abonnees":"abonnées",
 "expose":"exposé","exposee":"exposée","exposes":"exposés","exposees":"exposées",
 "duree":"durée","durees":"durées","detenteur":"détenteur","detenteurs":"détenteurs","detient":"détient","detenue":"détenue","detenu":"détenu","detenus":"détenus",
 "necessairement":"nécessairement","necessaire":"nécessaire","echange":"échange","echanges":"échanges","echanger":"échanger",
 "variete":"variété","varietes":"variétés","vetement":"vêtement","vetements":"vêtements","cafe":"café","cafes":"cafés",
 "soigne":"soigné","soignee":"soignée","soignes":"soignés","soignees":"soignées",
 "enorme":"énorme","enormes":"énormes","cinematographique":"cinématographique","cinema":"cinéma",
 "streamee":"streamée","streame":"streamé","streames":"streamés","streamees":"streamées",
 "malgre":"malgré","editoriale":"éditoriale","editorial":"éditorial","affinite":"affinité","affinites":"affinités",
 "tournee":"tournée","tournees":"tournées","prisee":"prisée","prisees":"prisées","engage":"engagé","engagee":"engagée","engages":"engagés","engagees":"engagées",
 "limitee":"limitée","limitees":"limitées","creant":"créant","creent":"créent","co-signe":"co-signé","signee":"signée",
 "fonde":"fondé","fondee":"fondée","fondateur":"fondateur","fondatrice":"fondatrice",
 "developpe":"développé","developpee":"développée","developpement":"développement","developper":"développer",
 "differente":"différente","different":"différent","differents":"différents","differentes":"différentes",
 "interactif":"interactif","interactive":"interactive","reactif":"réactif",
 "popularite":"popularité","longevite":"longévité","credibilite":"crédibilité","creativite":"créativité","viralite":"viralité","fiabilite":"fiabilité","accessibilite":"accessibilité","inclusivite":"inclusivité",
 "inclusive":"inclusive","inclusif":"inclusif","aspirationnel":"aspirationnel","aspirationnelle":"aspirationnelle",
 "ambassadrice":"ambassadrice","ambassadeur":"ambassadeur","ambassadeurs":"ambassadeurs",
 "pratique":"pratique","numerique":"numérique","numeriques":"numériques","digitale":"digitale","digitaux":"digitaux",
 "ecoute":"écoute","ecoutee":"écoutée","ecoutes":"écoutes","ecoutees":"écoutées","ecouter":"écouter",
 "renforce":"renforcé","renforcee":"renforcée","considere":"considéré","consideree":"considérée",
 "europeen":"européen","europeenne":"européenne","europeens":"européens","europeennes":"européennes",
 "japonais":"japonais","chinois":"chinois","coreen":"coréen",
 "phenomenes":"phénomènes","systeme":"système","systemes":"systèmes","probleme":"problème","problemes":"problèmes",
 "lumiere":"lumière","matiere":"matière","carriere":"carrière","frontiere":"frontière",
 "succes":"succès","proces":"procès","exces":"excès","apres":"après","aupres":"auprès","pres":"près",
 "tete":"tête","tetes":"têtes","fete":"fête","fetes":"fêtes","interet":"intérêt",
 "operation":"opération","operations":"opérations","federe":"fédéré","federer":"fédérer",
 "verite":"vérité","veritable":"véritable","veritables":"véritables","generaliste":"généraliste",
 "deguisements":"déguisements","prefere":"préféré","preferes":"préférés","preferee":"préférée",
 "decline":"décliné","declinee":"déclinée","declinaison":"déclinaison","precommande":"précommande","precommandes":"précommandes",
 "annoncee":"annoncée","creneau":"créneau","decale":"décalé","decalee":"décalée",
 "reel":"réel","reelle":"réelle","reellement":"réellement","gere":"gère","geree":"gérée","gerer":"gérer","gerent":"gèrent",
 "evenementiels":"événementiels","evenementielles":"événementielles","creatif":"créatif","creative":"créative","creatifs":"créatifs","creatives":"créatives",
 "voila":"voilà","apogee":"apogée","aout":"août","decembre":"décembre",
 "autorite":"autorité","autorites":"autorités","acquerir":"acquérir","declencher":"déclencher","declenche":"déclenche","declenchent":"déclenchent","declenchee":"déclenchée",
 "rarete":"rareté","verse":"versé","versee":"versée","paye":"payé","payee":"payée","independamment":"indépendamment","independance":"indépendance","independant":"indépendant",
 "incremental":"incrémental","incrementale":"incrémentale","incrementales":"incrémentales","incrementaux":"incrémentaux",
 "fedres":"fédérés","federe":"fédéré","federee":"fédérée","federer":"fédérer","prefere":"préféré","preferee":"préférée","preferes":"préférés",
 "datee":"datée","datees":"datées","reputee":"réputée","repute":"réputé","reputes":"réputés","reputees":"réputées",
 "couvree":"couvrée","operee":"opérée","opere":"opéré","operent":"opèrent","cible":"cible","ciblage":"ciblage",
 "elaboree":"élaborée","pietre":"piètre","emergente":"émergente","emergent":"émergent","emerge":"émerge",
 "deplace":"déplacé","deplacee":"déplacée","deplacer":"déplacer","deplacement":"déplacement",
 "conquerir":"conquérir","conquete":"conquête","conquetes":"conquêtes","opportunite":"opportunité","opportunites":"opportunités",
 "operationnelle":"opérationnelle","problematique":"problématique","thematique":"thématique","schematique":"schématique","systematique":"systématique","systematiquement":"systématiquement",
 "complementaires":"complémentaires","evidente":"évidente","evident":"évident","precise":"précise","precis":"précis","precisement":"précisément",
 "interesse":"intéressé","interessant":"intéressant","interessante":"intéressante","modere":"modéré","moderee":"modérée",
 "controlee":"contrôlée","decideur":"décideur","decideurs":"décideurs","decision":"décision","decisions":"décisions",
 "ecart":"écart","ecarts":"écarts","identifie":"identifié","identifies":"identifiés","identifiee":"identifiée","identifiees":"identifiées",
 "editrice":"éditrice","editrices":"éditrices","differenciant":"différenciant","differencier":"différencier","differenciation":"différenciation",
 "defiler":"défiler","recurrent":"récurrent","recurrente":"récurrente","recurrents":"récurrents","reelles":"réelles",
 "donnee":"donnée","donnees":"données","touchee":"touchée","pedagogique":"pédagogique","visee":"visée","simplifie":"simplifié","simplifiee":"simplifiée",
 "region":"région","regions":"régions","intensite":"intensité","estime":"estimé","estimee":"estimée","estimes":"estimés","estimees":"estimées",
 "legal":"légal","legale":"légale","legaux":"légaux","legales":"légales","reveler":"révéler","revelez":"révélez","precedente":"précédente","precedent":"précédent",
 "reponse":"réponse","reponses":"réponses","debattre":"débattre","conference":"conférence","conferences":"conférences","entite":"entité","entites":"entités",
 "methodo":"méthodo","methode":"méthode","methodes":"méthodes","methodologie":"méthodologie","hypothese":"hypothèse","hypotheses":"hypothèses",
 "envoyee":"envoyée","envoye":"envoyé","envoyees":"envoyées","capturee":"capturée","captures":"capturés","cumulee":"cumulée","cumulees":"cumulées","ca":"ça",
 "publicite":"publicité","publicites":"publicités","fiscalite":"fiscalité","fiscalites":"fiscalités","regle":"règle","regles":"règles","retouche":"retouché","retouches":"retouchés","retouchee":"retouchée","reutiliser":"réutiliser","reutilisation":"réutilisation","reutilise":"réutilise","reutilisee":"réutilisée",
}

# preposition "à": only before tokens that are almost always prepositional (\b protects words like 'via')
A_PATTERN = re.compile(r"\ba (l'|l’|la\b|faible|fort\b|forte|forts|moindre|grande|grand\b|base de|prix\b|vie\b|partir|travers|distance|domicile|venir|moitié|hauteur|chaque|l'esprit|l'echelle|l'international|l'achat|19|24)")
A_CAP = [("A distinguer","À distinguer"),("A retenir","À retenir"),("A terme","À terme"),("A l'inverse","À l'inverse"),("A garder","À garder"),("A noter","À noter")]

# exact-phrase fixes for ambiguous cases
PHRASES = [
 ("qui marché", "qui marche"), ("ça marché", "ça marche"),
 ("a debattre", "à débattre"), ("a ajuster", "à ajuster"), ("a visee", "à visée"), ("a visée", "à visée"), ("a la performance", "à la performance"),
 ("rouge a levres", "rouge à lèvres"), ("a levres", "à lèvres"), ("levres", "lèvres"), ("levre", "lèvre"),
 ("ou des individus", "où des individus"),
 ("ou un hote", "où un hôte"),
 ("ou une", "où une"),
 ("la ou", "là où"),
 ("nee des reseaux", "née des réseaux"),
 ("nee du", "né du"),
 ("ne du web", "né du web"),
]

def cap(w):
    return w[0].upper() + w[1:] if w else w

# build full map incl. capitalized
MAP = {}
for k, v in PAIRS.items():
    MAP[k] = v
    MAP[cap(k)] = cap(v)
# longest first
KEYS = sorted(MAP, key=len, reverse=True)
PATTERN = re.compile(r"\b(" + "|".join(re.escape(k) for k in KEYS) + r")\b")

def fix(s):
    for a, b in PHRASES:
        s = s.replace(a, b)
        s = s.replace(cap(a), cap(b))
    for a, b in A_CAP:
        s = s.replace(a, b)
    s = PATTERN.sub(lambda m: MAP[m.group(0)], s)
    s = A_PATTERN.sub(lambda m: "à " + m.group(1), s)
    return s

def walk(node, in_fr=False):
    if isinstance(node, dict):
        return {k: walk(v, in_fr or k.endswith("_fr")) for k, v in node.items()}
    if isinstance(node, list):
        return [walk(x, in_fr) for x in node]
    if isinstance(node, str) and in_fr:
        return fix(node)
    return node

count = 0
for p in sorted(DATA.glob("*.json")):
    data = json.loads(p.read_text(encoding="utf-8"))
    fixed = walk(data)
    if fixed != data:
        p.write_text(json.dumps(fixed, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        count += 1
        print(f"  fixed {p.name}")
# --- index.html : fix accents inside data-lang-fr text segments only ---
HTML = DATA.parent / "index.html"
if HTML.exists():
    html = HTML.read_text(encoding="utf-8")
    html2 = re.sub(r'(data-lang-fr[^>]*>)([^<]+)', lambda m: m.group(1) + fix(m.group(2)), html)
    if html2 != html:
        HTML.write_text(html2, encoding="utf-8")
        count += 1
        print("  fixed index.html (data-lang-fr segments)")

# --- i18n.js : fix accents in the FR block VALUES only (not keys, not EN) ---
JS = DATA.parent / "assets" / "js" / "i18n.js"
if JS.exists():
    s = JS.read_text(encoding="utf-8")
    m = re.search(r'(\bfr:\s*\{)(.*?)(\n\s*\},\s*\n\s*en:\s*\{)', s, re.S)
    if m:
        block = m.group(2)
        block2 = re.sub(r'(:\s*")([^"]*)(")', lambda x: x.group(1) + fix(x.group(2)) + x.group(3), block)
        if block2 != block:
            s = s[:m.start(2)] + block2 + s[m.end(2):]
            JS.write_text(s, encoding="utf-8")
            count += 1
            print("  fixed i18n.js (fr block values)")

print(f"\n{count} files updated.")
