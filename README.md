# Site du cabinet de kinésithérapie

Site vitrine du cabinet, construit avec **Next.js 15 (App Router)**, **TypeScript** et **Tailwind CSS**.
Aucune dépendance en dehors de Next.js et React.

---

## 1. Lancer le site sur votre ordinateur

Prérequis : [Node.js](https://nodejs.org) version 20 ou plus récente.

```bash
npm install
npm run dev
```

Puis ouvrez http://localhost:3000.

Avant la mise en ligne, vérifiez que tout compile :

```bash
npm run typecheck
npm run lint
npm run build
```

---

## 2. Personnaliser le site — où modifier quoi

Tous les contenus sont séparés du design, dans `src/data/`.
Chaque information manquante est marquée **`[À RENSEIGNER]`** et apparaît surlignée en vert clair sur le site
tant qu'elle n'est pas remplie.

| Fichier | Contenu |
|---|---|
| `src/data/site.ts` | **Configuration centrale** : nom du cabinet, praticien, adresse, téléphone, e-mail, horaires initiaux, coordonnées GPS, réseaux sociaux, accès |
| `src/lib/booking/config.ts` | **Prise de rendez-vous** : types de rendez-vous et durées, délais, rappels, conservation des données |
| `src/data/services.ts` | Les prises en charge (une page `/soins/…` est créée pour chacune) |
| `src/data/practitioner.ts` | Présentation, parcours, diplômes, formations du kinésithérapeute, numéro RPPS |
| `src/data/cabinet.ts` | Présentation du cabinet, équipements, environnement, étapes du déroulement |
| `src/data/faq.ts` | Questions fréquentes |
| `src/data/testimonials.ts` | Témoignages (la section reste masquée tant que la liste est vide) |
| `src/data/images.ts` | Photos du site (hero, cabinet, portrait, galerie) |
| `src/app/globals.css` | **Palette de couleurs** (bloc `:root`, en haut du fichier) |

### Points importants

- **Prises en charge** : les six catégories sont des exemples. Supprimez celles qui ne correspondent pas à
  l'activité réelle du cabinet et relisez les textes.
- **Prise de rendez-vous** : tous les boutons « Prendre rendez-vous » mènent au module de réservation intégré
  (`/rendez-vous`), décrit plus bas.
- **Carte** : renseignez `LATITUDE` et `LONGITUDE` (clic droit sur Google Maps → coordonnées).
  La carte OpenStreetMap n'est chargée que si le visiteur clique sur « Afficher la carte ».
- **Horaires** : ceux de `site.ts` servent au premier démarrage ; ensuite, ils se modifient dans l'espace admin
  (`/admin/horaires`) et s'appliquent à la fois aux réservations et à l'affichage sur le site.
- **Témoignages** : vérifiez auprès du Conseil départemental de l'Ordre ce qui est autorisé avant d'en publier.

### Ajouter des photos

1. Déposez les fichiers dans `public/images/` (JPG ou PNG, 2000 px de large suffisent).
2. Dans `src/data/images.ts`, renseignez `src`, `alt` (description de la photo), `width` et `height`.

Next.js convertit automatiquement les images en AVIF/WebP et les charge à la bonne taille.

### Logo

Le logo est un pictogramme (arc d'amplitude articulaire) suivi du nom du cabinet :
`src/components/layout/Logo.tsx`. Pour utiliser un fichier, déposez-le dans `public/` et remplacez le
contenu du composant par un `<Image>`.

---

## 3. Prise de rendez-vous en ligne

Parcours patient sur `/rendez-vous` : **consultation → date → horaire → coordonnées → récapitulatif → confirmation**.

- Créneaux calculés automatiquement à partir des horaires, de la durée du rendez-vous, des rendez-vous
  existants, des congés et des indisponibilités, en heure de Paris (heure d'été/hiver gérée).
- Vérification complète **côté serveur** au moment de la validation ; la réservation est **atomique** : deux
  patients ne peuvent jamais obtenir le même créneau.
- Lien direct vers un type de rendez-vous : `/rendez-vous?service=bilan` (identifiants dans `config.ts`).
- Chaque patient reçoit un lien personnel sécurisé `/rendez-vous/gestion/…` pour consulter, déplacer ou annuler
  (jusqu'à 24 h avant, réglable).
- Confirmation avec ajout à Google Agenda ou fichier `.ics`.
- Aucune donnée médicale demandée ; le message libre du patient n'est jamais recopié dans les e-mails.

### Espace administrateur — `/admin`

Tableau de bord du jour, agenda jour / semaine / mois, liste avec recherche et filtres, création et modification
manuelles, statuts (en attente, confirmé, annulé, terminé, absent), horaires, congés, indisponibilités,
paramètres, notifications, suppression des données (RGPD).

Accès protégé par mot de passe (`ADMIN_PASSWORD`), session signée (`SESSION_SECRET`), cookie sécurisé.

### Base de données

SQLite, **intégré à Node.js** (`node:sqlite`, Node 22.13 ou plus récent) : aucune dépendance, aucun service à
payer. Le fichier (`DATABASE_PATH`, par défaut `./data/cabinet.db`) et les tables sont créés automatiquement au
premier démarrage ; les migrations sont appliquées automatiquement. Sauvegarde : copier ce fichier.

⚠️ Ce fichier doit être sur un **disque persistant** (VPS, Render / Railway / Fly.io avec volume…).

**Sur Vercel** (pas de disque conservé), le site utilise à la place une base **Turso** (SQLite hébergé, offre
gratuite) : il suffit de renseigner `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN`. Les tables et les horaires
initiaux sont créés automatiquement au premier accès. Voir « Mise en ligne sur Vercel » ci-dessous.

### E-mails

Confirmation, modification, annulation, rappel 24 h avant (patient) et notification de nouveau rendez-vous
(cabinet).

**Configuration retenue : envoi depuis la boîte Gmail du cabinet** (`lpkine197166@gmail.com`), sans service
payant ni nom de domaine. Mise en place, une seule fois :

1. Se connecter au compte Google `lpkine197166@gmail.com`.
2. Activer la **validation en deux étapes** (Compte Google › Sécurité).
3. Créer un **mot de passe d'application** (Compte Google › Sécurité › Mots de passe des applications),
   nommé par exemple « Site cabinet ». Google affiche un code de 16 lettres.
4. Copier ce code dans `GMAIL_APP_PASSWORD` (fichier `.env.local` ou réglages de l'hébergeur).
   Les autres réglages (`EMAIL_PROVIDER=gmail`, `GMAIL_USER`, `ADMIN_EMAIL`) sont déjà remplis dans
   `.env.example`.
5. Faire une réservation test avec sa propre adresse : la confirmation doit arriver. La page **Paramètres** de
   l'espace admin indique « Configuré (Gmail) ».

Les e-mails envoyés apparaissent dans « Messages envoyés » de la boîte Gmail, et les patients peuvent y
répondre directement. Gmail limite l'envoi à quelques centaines d'e-mails par jour, largement suffisant pour
un cabinet.

Si le cabinet a un jour son propre nom de domaine, il est possible de passer à Brevo, Resend ou SendGrid
(voir `.env.example`).

Sans configuration, les rendez-vous fonctionnent mais aucun e-mail n'est envoyé.

### Tâche planifiée (rappels + purge RGPD)

Sur Vercel : rien à faire, c'est programmé dans `vercel.json`. Sur un serveur classique, appeler `/api/cron`
toutes les heures avec l'en-tête `Authorization: Bearer <CRON_SECRET>`. Exemple (cron du serveur) :

```
0 * * * * curl -fsS -H "Authorization: Bearer VOTRE_SECRET" https://www.votre-domaine.fr/api/cron
```

### Formulaire de contact

Les messages sont envoyés à `ADMIN_EMAIL` via le même fournisseur d'e-mails.

### Anti-spam

Champ piège, délai minimal de saisie, limitation par adresse IP, contrôle d'origine (CSRF), et Cloudflare
Turnstile en option (`NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`).

### Sécurité

- **Espace admin** : mot de passe (12 caractères min.), session signée de 8 h dans un cookie `HttpOnly` / `SameSite=Strict`.
  Changer `ADMIN_PASSWORD` ou `SESSION_SECRET` déconnecte toutes les sessions. Vérification à trois niveaux :
  `src/middleware.ts` (toutes les requêtes /admin), chaque page admin (`requireAdmin`), chaque API (`adminRoute`).
- **Limitation des tentatives enregistrée en base** (`src/lib/rate-limit.ts`) : connexion admin (8 essais / 15 min par
  adresse, 100 / h au total), réservations, demandes de lien, formulaire de contact. Les adresses IP et e-mails ne sont
  pas stockés en clair (empreinte HMAC), et sont purgés au bout de 48 h. Sans base (Turso non configuré sur Vercel),
  un compteur en mémoire prend le relais, moins efficace.
- **En-têtes HTTP** (`next.config.ts`) : politique de sécurité du contenu (CSP), HSTS, `X-Frame-Options: DENY`,
  `nosniff`, `Referrer-Policy`, caméra/micro limités au site.
- **Contrôle d'origine** (CSRF) sur toutes les requêtes qui modifient des données ; validation de toutes les entrées
  côté serveur ; requêtes SQL paramétrées ; liens patients à jeton aléatoire de 256 bits (seule l'empreinte est stockée).
- **Vérification automatique** à chaque envoi sur GitHub (`.github/workflows/build.yml`) : types, compilation, tests
  (`npm run test:tele`, `npm run test:security`), audit des dépendances (`npm audit`, bloquant à partir de « high »),
  puis tests de bout en bout sur le site compilé (`tests/smoke.e2e.mjs` : en-têtes, protection admin, CSP).

### Téléconsultation

Rendez-vous en vidéo avec le kinésithérapeute (page publique `/teleconsultation`, salle patient
`/teleconsultation/<lien personnel>`, espace admin `/admin/teleconsultations`). Détails techniques, tests et points
de conformité : [`docs/TELECONSULTATION.md`](docs/TELECONSULTATION.md).

1. Créer un compte sur [daily.co](https://www.daily.co) et copier la **clé API** (Developers > API keys).
2. Dans le tableau de bord Daily, vérifier que **l'enregistrement est désactivé** pour le domaine.
3. Renseigner `DAILY_API_KEY` (et éventuellement `DAILY_GEO`) dans `.env.local` ou dans Vercel
   (Settings > Environment Variables), puis redéployer.
4. Dans `/admin/teleconsultations` : activer le service, choisir la durée et le tarif (vide = « communiqué par le cabinet »).

Tant que `DAILY_API_KEY` est vide, le service n'est pas proposé et aucune salle n'est créée.
**Avant d'ouvrir le service à de vrais patients, lire la section « Conformité » du document ci-dessus.**

---

## 4. Mise en ligne

### Sur Vercel (recommandé)

1. **Base de données** — créer un compte sur [turso.tech](https://turso.tech), puis une base (région
   Europe, ex. Paris ou Francfort). Copier son **URL** (`libsql://…`) et créer un **jeton** (« Create token »).
2. **Code** — mettre le dossier du projet sur GitHub (dépôt **privé**), par exemple avec GitHub Desktop.
3. **Vercel** — [vercel.com/new](https://vercel.com/new) → importer le dépôt. Next.js est détecté tout seul.
4. Avant de cliquer sur « Deploy », ouvrir **Environment Variables** et ajouter :

   | Variable | Valeur |
   | --- | --- |
   | `TURSO_DATABASE_URL` | URL de la base Turso |
   | `TURSO_AUTH_TOKEN` | jeton Turso |
   | `ADMIN_PASSWORD` | mot de passe de l'espace admin (12 caractères min.) |
   | `SESSION_SECRET` | 32 caractères aléatoires min. |
   | `CRON_SECRET` | 16 caractères aléatoires min. |
   | `REMINDER_HOURS_BEFORE` | `27` |
   | `EMAIL_PROVIDER` | `gmail` |
   | `GMAIL_USER` | adresse Gmail du cabinet |
   | `GMAIL_APP_PASSWORD` | mot de passe d'application Google |
   | `EMAIL_FROM_NAME` | nom affiché comme expéditeur |
   | `ADMIN_EMAIL` | adresse qui reçoit les notifications |
   | `NEXT_PUBLIC_SITE_URL` et `APP_URL` | adresse du site, ex. `https://leopold-pirard.vercel.app` puis le nom de domaine |

5. Cliquer sur **Deploy**. Les mises à jour suivantes sont publiées automatiquement à chaque envoi sur GitHub.
6. La tâche planifiée (rappels + purge) est déjà programmée par `vercel.json` : une fois par jour vers 18 h
   (offre gratuite de Vercel). Vercel envoie lui-même `CRON_SECRET`.
7. Nom de domaine : Vercel → projet → **Settings → Domains**. Mettre ensuite à jour `NEXT_PUBLIC_SITE_URL`
   et `APP_URL`, puis redéployer.

### Sur un serveur classique

1. Copier `.env.example` en `.env.local` (ou dans les variables de l'hébergeur) et tout remplir.
2. `npm install` puis `npm run build` puis `npm start`.
3. Programmer la tâche planifiée (ci-dessus).
4. Passer `INDEXING_ENABLED` à `true` dans `src/data/site.ts` une fois les informations complètes.

Pensez aussi à la fiche **Google Business Profile** du cabinet, avec exactement les mêmes nom, adresse et
téléphone que sur le site : c'est le levier principal du référencement local.

---

## 5. Pages légales

`/mentions-legales`, `/confidentialite` et `/cookies` sont des **modèles à compléter**, qui décrivent le
fonctionnement réel du site (aucun cookie de suivi, carte chargée à la demande). Ils doivent être relus par un
professionnel du droit avant la mise en ligne.

---

## 6. Structure du projet

```
src/
├── app/                      Pages (une route = un dossier) ; pages publiques dans (site)/
│   ├── page.tsx              Accueil
│   ├── cabinet/              Le cabinet (galerie)
│   ├── kinesitherapeute/     Le kinésithérapeute
│   ├── soins/                Liste des soins + soins/[slug]
│   ├── deroulement/          Déroulement (frise)
│   ├── faq/                  FAQ
│   ├── contact/              Contact + formulaire + carte
│   ├── rendez-vous/          Réservation + gestion/[token]
│   ├── mentions-legales/ · confidentialite/ · cookies/
│   ├── admin/                Espace administrateur (connexion + (panel)/…)
│   ├── api/booking/          API de réservation (dispos, créneaux, réservation, gestion, .ics)
│   ├── api/admin/            API de l'espace admin
│   ├── api/cron/             Rappels et purge (tâche planifiée)
│   ├── api/contact/          Réception du formulaire
│   ├── not-found.tsx         Page 404
│   ├── sitemap.ts · robots.ts · opengraph-image.tsx · icon.svg
│   ├── layout.tsx            Structure commune (header, footer, données structurées)
│   └── globals.css           Palette + design system
├── components/
│   ├── layout/               Header, Footer, Logo, PageHeader, MobileBookingBar, LegalPage
│   ├── sections/             Hero, TrustBar, CabinetIntro, ProcessSteps, Testimonials, BookingCTA
│   ├── ui/                   Button, BookingButton, ServiceCard, FAQ, Gallery, ContactForm, Map, …
│   ├── booking/              Parcours de réservation (calendrier, créneaux, formulaire, récap…)
│   ├── admin/                Espace admin (agenda, fiche rendez-vous, horaires, congés…)
│   └── seo/                  JsonLd
├── data/                     Contenus et configuration (voir tableau ci-dessus)
└── lib/
    ├── booking/              Cœur de la réservation : config, créneaux, fuseau, stockage SQLite, règles
    ├── email/                Envoi et modèles d'e-mails
    └── …                     SEO, sécurité, authentification
```

## 7. Design system

- **Couleurs** : ivoire froid, gris-vert, anthracite, bleu pétrole (principal), vert sauge (secondaire) —
  définies une seule fois dans `globals.css`, exposées à Tailwind dans `tailwind.config.ts`.
- **Typographie** : Manrope (auto-hébergée par Next.js, aucune requête vers Google côté visiteur),
  échelle fluide `display` → `h1` → `h2` → `h3` → `lead` → `body` → `small` → `micro`.
- **Rayons** : `control` (boutons, champs) < `card` < `panel` < `media` (photos).
- **Mouvement** : animations de 150 à 400 ms, désactivées si l'utilisateur a demandé à réduire les animations.
