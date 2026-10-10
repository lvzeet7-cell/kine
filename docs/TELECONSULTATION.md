# Téléconsultation — documentation technique

Ce document décrit le module de téléconsultation : fonctionnement, fichiers, configuration, tests et points de
conformité à vérifier **avant** d'ouvrir le service à de vrais patients.

> Rien dans ce module ne rend la plateforme « conforme » ou « certifiée » à elle seule. Les choix techniques
> ci-dessous réduisent les risques ; la conformité (HDS, RGPD, règles du télésoin) reste à vérifier et à documenter
> par le cabinet (voir § 8).

---

## 1. Ce que fait le module

| Pour qui | Où | Quoi |
| --- | --- | --- |
| Public | `/teleconsultation` | Présentation, durée et tarif (réglés dans l'admin), bouton « Réserver une téléconsultation » — ou message « pas ouverte » si le service est désactivé / non configuré. |
| Patient | `/rendez-vous?service=teleconsultation` | Réservation avec le module existant : vérification serveur, pas de double réservation, récapitulatif avec lieu « en ligne » et tarif. |
| Patient | `/teleconsultation/<lien personnel>` | Nom du cabinet, date/heure, consignes, test caméra/micro, bouton « Rejoindre ». États : à venir, salle ouverte, annulée, terminée, expirée, lien invalide, visioconférence non configurée. |
| Praticien | `/admin/teleconsultations` | Onglets Aujourd'hui / À venir / Passées / Annulées / Toutes, filtre par dates ; patient, coordonnées, date, durée, tarif, statut, connexions, problèmes signalés ; actions : ouvrir la salle, détails/modifier/annuler, marquer comme terminée, renvoyer le lien ; réglages (activation, durée, tarif). |
| Praticien | `/admin/teleconsultations/<id>` | Salle côté praticien + fiche du patient. |

**Salle vidéo** : vidéo de l'autre participant, aperçu de sa propre caméra, micro et caméra on/off, quitter,
indicateur de qualité de connexion, salle d'attente, écran de fin, bandeau « connexion interrompue », écran d'erreur
avec « Rejoindre à nouveau », « Signaler un problème technique » (patient). Responsive (testé à 390 px de large).

## 2. Choix techniques

- **Fournisseur : Daily** (`@daily-co/daily-js`, objet d'appel — interface entièrement personnalisée, pas d'iframe).
  Alternative possible : Jitsi auto-hébergé chez un hébergeur certifié HDS (voir § 8) — l'interface `VideoProvider`
  (`src/lib/video/provider.ts`) permet d'ajouter un autre fournisseur sans toucher au reste.
  Le serveur public gratuit de Jitsi (meet.jit.si) n'est **pas** utilisé.
- **Salles privées** (`privacy: "private"`), 2 participants maximum, langue française, expiration automatique
  150 min après la fin prévue (`exp` + `eject_at_room_exp`). **Aucun enregistrement** n'est activé.
- **Nom de salle aléatoire** (`lp-` + 15 octets aléatoires) : aucun nom, e-mail, date ou information médicale dans
  l'URL. Connaître l'URL ne suffit pas : il faut un **jeton Daily** délivré par le serveur.
- **Jetons Daily par rôle et limités dans le temps** :
  - patient : non propriétaire, nom affiché « Patient », valable jusqu'à 30 min après la fin ;
  - praticien : propriétaire, valable jusqu'à 120 min après la fin.
- **Contrôle d'accès côté serveur** (jamais seulement dans React) :
  - patient : uniquement avec le **lien personnel** (le même que « Gérer mon rendez-vous » : 32 octets aléatoires,
    seule l'empreinte SHA-256 est stockée), de 15 min avant à 30 min après le rendez-vous ;
  - praticien : session admin valide (cookie HttpOnly signé + contrôle d'origine), de 60 min avant à 120 min après ;
  - un identifiant de rendez-vous seul ne donne accès à rien.
- **Révocation** : la salle est supprimée chez Daily en cas d'annulation, de report, de passage à « terminé » /
  « absent » ou de suppression. Après un report, une nouvelle salle est créée à la première connexion, et le patient
  reçoit un nouveau lien (l'ancien ne fonctionne plus).
- **Résilience** : si Daily ne répond pas au moment de la réservation, la réservation est quand même enregistrée et
  la salle sera créée à la première connexion (aucune fausse réussite : en cas d'échec à la connexion, un message
  d'erreur clair s'affiche).
- **Secrets** : `DAILY_API_KEY` reste côté serveur. Le navigateur ne reçoit que l'URL de sa salle et son jeton
  temporaire, après contrôle.
- **Tarif figé** : le tarif affiché au moment de la réservation est enregistré sur le rendez-vous.
- **Service masqué** tant que la téléconsultation est désactivée dans l'admin **ou** que `DAILY_API_KEY` est vide
  (contrôle aussi côté serveur à la réservation).
- **E-mails** (fournisseur existant, Gmail) : confirmation et report avec bouton « Accéder à la téléconsultation »,
  annulation, rappel (sans lien : il explique comment recevoir un nouveau lien), notification au cabinet. Si l'envoi
  n'est pas configuré, rien n'est simulé : l'admin affiche une erreur (« Renvoyer le lien » → 503).

## 3. Fichiers

**Créés**

```
src/lib/video/provider.ts                      Interface fournisseur vidéo
src/lib/video/daily.ts                         Adaptateur API REST Daily (salles, jetons, suppression)
src/lib/video/index.ts                         Sélection du fournisseur selon l'environnement
src/lib/teleconsultation/service.ts            Règles d'accès, création/révocation de salle, signalements
src/lib/teleconsultation/settings.ts           Réglages (activation, durée, tarif) + validation serveur
src/lib/teleconsultation/kind.ts               Détection d'un rendez-vous de téléconsultation
src/lib/booking/tele-row.ts                    Lecture d'une ligne « teleconsultations »
src/app/api/teleconsultation/join/route.ts     POST : accès patient (jeton temporaire)
src/app/api/teleconsultation/state/route.ts    GET  : état de la salle (sans données personnelles)
src/app/api/teleconsultation/report/route.ts   POST : signalement d'un problème technique
src/app/api/admin/teleconsultations/route.ts               GET : liste (vues + filtres)
src/app/api/admin/teleconsultations/[id]/join/route.ts     POST : accès praticien
src/app/api/admin/teleconsultations/[id]/send-link/route.ts POST : nouveau lien envoyé au patient
src/app/api/admin/teleconsultations/settings/route.ts      GET/PUT : réglages
src/app/(site)/teleconsultation/page.tsx                   Page publique
src/app/(site)/teleconsultation/[token]/page.tsx           Page patient
src/app/admin/(panel)/teleconsultations/page.tsx           Admin : liste + réglages
src/app/admin/(panel)/teleconsultations/[id]/page.tsx      Admin : salle praticien
src/components/teleconsultation/TeleRoom.tsx               Salle vidéo (patient et praticien)
src/components/teleconsultation/DeviceCheck.tsx            Test caméra / micro
src/components/teleconsultation/PatientTele.tsx            États de la page patient
src/components/teleconsultation/daily-types.ts             Types minimaux de daily-js
src/components/admin/TeleconsultationsAdmin.tsx            Interface admin
tests/teleconsultation.test.ts (+ tests/daily_mock.ts, tests/hrana_mock.ts)
docs/TELECONSULTATION.md
```

**Modifiés**

```
package.json                     + @daily-co/daily-js, tsx (dev), script test:tele
.env.example, README.md          variables DAILY_*, mise en service
src/lib/booking/types.ts         types Teleconsultation, TeleSettings, notifications TELE_*
src/lib/booking/repository.ts    + getTeleconsultation, listTeleconsultations, saveTeleconsultation, getSetting, setSetting
src/lib/booking/memory-repository.ts, sqlite-repository.ts (migration v2), libsql-repository.ts
src/lib/booking/config.ts        service « teleconsultation » (mode vidéo)
src/lib/booking/service.ts       resolveService / bookableServices (durée et tarif depuis les réglages)
src/lib/email/templates.ts       e-mails adaptés à la téléconsultation
src/app/api/booking/route.ts, api/booking/manage/[token]/route.ts,
src/app/api/admin/appointments/route.ts, api/admin/appointments/[id]/route.ts   création / révocation de salle
src/components/booking/ServiceSelector.tsx, BookingFlow.tsx, BookingConfirmation.tsx
src/app/(site)/rendez-vous/page.tsx, rendez-vous/gestion/[token]/page.tsx
src/components/admin/AdminShell.tsx (menu), AdminDashboard.tsx (icônes de notification)
src/components/ui/Icon.tsx       icônes vidéo / micro / raccrocher / signal
src/data/navigation.ts, src/app/sitemap.ts, src/app/robots.ts, src/app/(site)/confidentialite/page.tsx
```

## 4. Base de données (migrations sans perte)

Deux tables **ajoutées** ; aucune table ni colonne existante n'est modifiée ou supprimée.

```sql
CREATE TABLE teleconsultations (
  appointment_id TEXT PRIMARY KEY REFERENCES appointments(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  room_name TEXT UNIQUE,          -- nom aléatoire, NULL quand la salle est révoquée
  room_url TEXT,                  -- jamais exposé sans contrôle d'accès
  price_cents INTEGER,            -- tarif figé à la réservation (NULL = non communiqué)
  patient_joined_at TEXT,
  practitioner_joined_at TEXT,
  issue_report TEXT,              -- signalement technique (500 caractères max)
  issue_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

- **SQLite** (serveur classique) : migration n° 2 (`PRAGMA user_version` 1 → 2), appliquée automatiquement au démarrage,
  dans une transaction.
- **Turso** (Vercel) : `CREATE TABLE IF NOT EXISTS` au démarrage.
- Les données de téléconsultation sont supprimées avec le rendez-vous (suppression manuelle ou purge automatique).

## 5. Variables d'environnement

| Variable | Obligatoire | Rôle |
| --- | --- | --- |
| `DAILY_API_KEY` | pour activer le service | Clé API Daily (secrète, serveur uniquement). Vide = téléconsultation non proposée. |
| `DAILY_GEO` | non | Région du serveur vidéo (ex. une région européenne — vérifier la liste dans la documentation Daily). |
| `DAILY_API_URL` | non | Autre URL d'API (tests). Laisser vide. |

Les variables existantes (`EMAIL_PROVIDER`, `GMAIL_*`, `ADMIN_EMAIL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `TURSO_*`,
`CRON_SECRET`…) sont réutilisées.

## 6. Mise en service (étapes manuelles)

1. **Daily** : créer un compte, choisir une offre adaptée à un usage de santé, récupérer la clé API.
   Dans le tableau de bord : vérifier que l'**enregistrement est désactivé** et, si possible, fixer une région européenne.
   Signer l'accord de traitement des données (DPA) proposé par Daily.
2. **Variables** : ajouter `DAILY_API_KEY` dans `.env.local` (local) ou dans Vercel > Settings > Environment Variables, puis redéployer.
3. **E-mails** : vérifier que l'envoi Gmail fonctionne (`/admin/parametres`), sinon aucun lien n'est envoyé.
4. **Réglages** : `/admin/teleconsultations` → activer, choisir la durée et le tarif.
5. **Essai à blanc** : réserver une téléconsultation test, l'ouvrir côté patient (téléphone) et côté praticien (ordinateur),
   vérifier son, image, coupure micro/caméra, sortie, annulation.
6. **Conformité** : traiter les points du § 8 avant toute séance réelle.

Commandes :

```bash
npm install          # installe aussi @daily-co/daily-js
npm run dev          # http://localhost:3000/teleconsultation
npm run test:tele    # tests de la téléconsultation (Node 22.5+, aucun appel réseau externe)
npm run typecheck && npm run lint && npm run build
```

## 7. Tests réalisés

- **Tests automatiques du module** (`npm run test:tele`) — 16 scénarios × 3 stockages (mémoire, SQLite, Turso simulé)
  = 48 tests : service masqué sans clé, validation des réglages, tarif figé, salle privée sans enregistrement, jetons par
  rôle et durée, fenêtres d'accès (trop tôt / ouvert / expiré), annulation et report (révocation), praticien,
  fournisseur en panne (réservation conservée, salle créée plus tard), salle supprimée côté fournisseur (recréée automatiquement), signalements, e-mails, suppression en cascade.
- **Tests de bout en bout dans un navigateur** (Playwright, fournisseur Daily simulé, faux périphériques) — 64 contrôles
  couvrant les 12 scénarios demandés :
  1. réservation d'une téléconsultation (lien direct, récapitulatif avec lieu et tarif, lien personnel) ;
  2. double réservation du même créneau → `201` + `409` ;
  3. confirmation : salle privée créée, aucune donnée patient dans l'URL ni envoyée au fournisseur ;
  4. un patient ne peut pas accéder à une autre salle (faux lien → 404, jeton propre à la salle, requête d'un autre site → 403) ;
  5. accès admin sans authentification → 401 / redirection vers la connexion ;
  6. ouverture par l'administrateur (jeton propriétaire), salle d'attente, commandes micro/caméra/quitter ;
  7. annulation → salle supprimée chez le fournisseur, accès refusé, page « annulé » ;
  8. lien expiré → refus serveur, page « expiré » (y compris pour le praticien) ;
  9. caméra/micro refusés ou absents → message clair au test et alerte dans la salle ;
  10. interruption réseau → bandeau, indicateur « faible », écran d'erreur puis « Rejoindre à nouveau » ;
  11. mobile (390 px) → pas de défilement horizontal, boutons ≥ 44 px ;
  12. fournisseur non configuré → service absent, réservation refusée côté serveur, message clair, `503` sans fausse réussite.
- Non-régression : 61 tests unitaires de réservation, 34 + 18 + 12 contrôles de bout en bout (réservation, admin, gestion
  de rendez-vous) — tous réussis.
- **Non testé ici** : un appel réel avec l'infrastructure Daily (impossible sans clé) → à faire à l'étape 5 du § 6.

## 8. Conformité — points à vérifier (non exhaustif)

Ces points relèvent du cabinet ; ils ne sont **pas** garantis par le code.

**Règles du télésoin pour les masseurs-kinésithérapeutes** (Assurance Maladie, page « Télésoin » consultée le
10 octobre 2026 : https://www.ameli.fr/masseur-kinesitherapeute/exercice-liberal/telesante/telesoin) :
- le bilan diagnostic kinésithérapique initial ne peut pas être réalisé en télésoin ;
- le praticien doit avoir réalisé au moins un acte ou bilan en présence du patient dans les 12 mois précédents
  (exception prévue en sortie d'hospitalisation) ;
- réalisation obligatoirement par vidéotransmission, en garantissant la confidentialité des échanges et la sécurisation des données ;
- plafond de 20 % de l'activité conventionnée annuelle ; patient du même territoire ; décision partagée avec le patient ;
  présence d'un adulte pour un mineur ; compte rendu ; facturation avec le code TMK.
La page publique rappelle les conditions visibles par le patient (premier bilan au cabinet, séance au cabinet dans les
12 derniers mois, mineurs). **Aucune information de remboursement n'est affichée** : à compléter par le cabinet s'il le
souhaite, après vérification. Voir aussi la FAQ télésoin de l'Ordre : https://www.ordremk.fr/je-suis-kinesitherapeute/exercice/faq-telesoin/

**Hébergement de données de santé (HDS)** :
- Le site ne stocke pas de dossier médical, mais un rendez-vous de kinésithérapie (identité + type de soin + horaire) peut
  être considéré comme une donnée de santé. Vérifier si l'hébergement (Vercel, Turso) doit être certifié HDS pour cet usage.
- **Daily (Daily.co, Inc., États-Unis)** : vérifier son statut au regard de la certification HDS et des transferts hors UE.
  Le flux vidéo transite par ses serveurs (non enregistré). Si une solution certifiée HDS est exigée, l'alternative est un
  **Jitsi auto-hébergé chez un hébergeur certifié HDS** (nouvel adaptateur `VideoProvider` à écrire) ou une solution de
  télésoin du marché référencée.

**RGPD** :
- tenir le registre des traitements (prise de rendez-vous, téléconsultation) ;
- signer les accords de sous-traitance (DPA) avec Vercel, Turso, Google (Gmail) et Daily ; documenter les transferts hors UE ;
- évaluer la nécessité d'une analyse d'impact (AIPD) ;
- la page « Confidentialité » a été complétée (rubrique « Téléconsultation ») : à relire et adapter ;
- durée de conservation : les données de téléconsultation suivent celles du rendez-vous (purge automatique).

**Sécurité / exploitation** :
- ne jamais publier `DAILY_API_KEY` ; en cas de fuite, la révoquer dans Daily et la remplacer ;
- vérifier régulièrement que l'enregistrement reste désactivé dans le tableau de bord Daily ;
- l'interface ne prétend à aucune certification : seules les mentions « salle privée », « échange chiffré »
  (WebRTC chiffre les flux en transit) et « sans enregistrement » sont affichées.
