# THE WHITE LIST - Outil Professionnel V21

Application de conciergerie de luxe destinée aux concierges de palaces et hôtels 5 étoiles.

## Concept

L'IA agit comme un **bras droit opérationnel** du concierge humain :
- Génère des programmes sur mesure basés sur les données CSV vérifiées
- Double vue : **Concierge** (opérationnel) et **Client** (PDF élégant)
- Système de double option pour chaque créneau (2 choix par activité)
- Notes concierge personnalisables
- Export PDF professionnel multilingue

## Nouveautés V21 - Navigation & Limitation Shopping

### 1. Réparation des liens de navigation (Auth)
- **Page Login** (`/login`) : Le lien "Pas encore de compte ? Créer un compte" redirige maintenant vers `/signup` avec `<Link to="/signup">`
- **Page SignUp** (`/signup`) : Le lien "Déjà un compte ? Se connecter" redirige maintenant vers `/login` avec `<Link to="/login">`
- Les liens utilisent désormais le composant `Link` de React Router au lieu de callbacks `onClick`

### 2. Comportement du Logo (SmartLogo)
- Le logo "THE WHITE LIST" agit comme un bouton d'accueil intelligent
- **Si NON connecté** : Redirige vers `/` (Landing Page)
- **Si connecté** : Redirige vers `/app` (Dashboard)
- Logique déjà correctement implémentée dans `SmartLogo.tsx`

### 3. Algorithme de génération : Limitation Shopping
- **Nouvelle règle** : Maximum 1 session de Shopping tous les 3 jours (même règle que les Spas)
- Si le séjour dure moins de 3 jours : 1 seule session Shopping maximum
- Variables ajoutées : `maxShopping`, `shoppingUsed`, `daysSinceLastShopping`
- La génération ne sera pas bloquée s'il n'y a pas assez d'activités, mais la répétition est filtrée

## Nouveautés V18 - Flux "Mot de Passe Oublié" avec Magic Code

### 1. Flux de réinitialisation repensé (Magic Code)
**Note importante** : InstantDB utilise des **Magic Codes** (codes numériques à 6 chiffres) et non des Magic Links.

**Flux en 3 étapes :**
1. **Étape 1** : Saisie de l'email → Vérification que le compte existe en DB → Envoi du Magic Code
2. **Étape 2** : Saisie du code à 6 chiffres reçu par email → Validation et authentification automatique
3. **Redirection** : Vers `/update-password` pour définir le nouveau mot de passe

### 2. Nouvelle page `/update-password` (Route protégée)
- Accessible uniquement après authentification via Magic Code
- Deux champs : "Nouveau mot de passe" et "Confirmer le mot de passe"
- Validation des critères de sécurité (8 caractères min, majuscule, minuscule, chiffre)
- Mise à jour du hash en base de données
- Redirection automatique vers `/dashboard` avec notification de succès

### 3. Navigation confirmée
- **Landing Page** : Bouton "Créer un compte gratuitement" → `/signup`
- **SmartLogo** : Si connecté → `/app`, sinon → `/` (Landing)
- **PaywallScreen** : Bouton "Activer mon abonnement" → API Stripe fonctionnelle

### 4. Routes mises à jour
- `/reset-password` - Saisie email + code Magic Code
- `/update-password` - Définition du nouveau mot de passe (route protégée)
- La route `/update-password` est accessible même avec `subscriptionStatus: 'unpaid'`

## Nouveautés V17 - Intégration Stripe API Live & Webhooks

### 1. Architecture Stripe Complète (Mode Live)
- **SDK Stripe installé** : `@stripe/stripe-js` (frontend) + `stripe` (backend)
- **Clé publique** : `pk_live_51Rg5TC...` (configurée dans le frontend)
- **Clé secrète** : Via `process.env.STRIPE_SECRET_KEY` (backend)
- **Webhook** : Route `/api/stripe/webhook` pour recevoir les événements Stripe

### 2. Nouveau Tarif (V15)
- **Prix** : 249,99€ / mois
- **Période d'essai** : 14 jours gratuits (configuré via `subscription_data.trial_period_days`)
- **Sans engagement** : Annulable à tout moment

### 3. Nouveau Schéma Utilisateur (InstantDB)
- **Champ `subscriptionStatus`** : `'unpaid'` | `'active'` | `'canceled'`
- **Champ `stripeCustomerId`** : ID client Stripe
- **Champ `stripeSessionId`** : ID de session de paiement

### 4. Flux d'Inscription avec Paiement
1. **Création du compte** : Utilisateur créé avec `subscriptionStatus: 'unpaid'`
2. **Appel API** : `/api/stripe/create-checkout-session` avec `metadata: { instant_db_user_id }`
3. **Redirection Stripe** : Checkout Session avec abonnement 249,99€/mois + 14 jours d'essai
4. **Retour** : `/payment-success?session_id=xxx`
5. **Activation** : Le frontend vérifie la session et passe le statut à `'active'`

### 4. Garde-fou Subscription (CRITIQUE)
- **Si `subscriptionStatus === 'unpaid'`** : L'utilisateur voit le **PaywallScreen**
- **Si `subscriptionStatus === 'active'`** : Accès complet au Dashboard
- **Si `subscriptionStatus === 'canceled'`** : Retour au PaywallScreen

### 5. Routes API Stripe
- `POST /api/stripe/create-checkout-session` - Crée une session Stripe Checkout
- `POST /api/stripe/webhook` - Reçoit les événements Stripe (checkout.session.completed)
- `GET /api/stripe/session/:sessionId` - Vérifie le statut d'une session

### 6. Configuration Requise
Ajouter dans `backend/.env` :
```
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
FRONTEND_URL=https://[votre-domaine]
```

### 7. Webhook Stripe (Dashboard Stripe)
Configurer le webhook sur `https://[votre-backend]/api/stripe/webhook` avec les événements :
- `checkout.session.completed`
- `customer.subscription.deleted`
- `invoice.payment_failed`

## Nouveautés V15 (précédentes)

### 1. Flux "Mot de passe oublié" CORRIGÉ (3 ÉTAPES)
- **IMPORTANT** : InstantDB n'a PAS de fonctionnalité native de réinitialisation par LIEN cliquable. Le système utilise des Magic Codes (codes à 6 chiffres).
- **Nouveau flux en 3 étapes strictes** :
  1. **Étape 1/3** : Saisie de l'e-mail → Vérification en DB que le compte existe → Envoi du code
  2. **Étape 2/3** : Saisie du code à 6 chiffres reçu par e-mail → Validation
  3. **Étape 3/3** : Saisie du nouveau mot de passe (2x) → Mise à jour en DB
- **Vérification en base AVANT envoi** : Si l'e-mail n'existe pas, message d'erreur rouge : "Aucun compte n'est associé à cette adresse e-mail."
- **Console.log de debug** intégrés pour tracer chaque étape
- Bouton "Renvoyer le code" disponible
- Bouton de désactivation si le code n'a pas 6 chiffres
- Messages d'erreur clairs avec accents français

### 2. Pages de retour Stripe
- **`/payment-success`** : Page de confirmation après paiement validé
  - Redirection automatique vers `/app` (dashboard) après 5 secondes
  - Message de bienvenue et confirmation d'activation Premium
- **`/payment-canceled`** : Page d'erreur après paiement échoué/annulé
  - Message d'erreur rouge clair : "Le paiement n'a pas pu être validé."
  - Boutons pour réessayer ou retourner à la connexion
  - Liste des raisons possibles de l'échec

### 3. Routes Stripe configurées
- Les URLs de retour Stripe doivent être configurées sur :
  - Success URL : `https://[votre-domaine]/payment-success`
  - Cancel URL : `https://[votre-domaine]/payment-canceled`
- Le lien Stripe (`https://buy.stripe.com/cNi3cveZm9Jybjwg6m67S0q`) reste INTACT

## Nouveautés V14 (précédentes)

### 1. Vérification unicité e-mail (CRITIQUE)
- **Règle : 1 E-mail = 1 Compte**
- Vérification dans InstantDB AVANT création de compte
- Message d'erreur clair : "Ce compte existe déjà. Veuillez vous connecter."
- Aucun doublon possible dans la base de données

### 2. Correction du lien Stripe exact
- Lien de paiement corrigé : `https://buy.stripe.com/cNi3cveZm9Jybjwg6m67S0q`
- Après inscription, l'utilisateur est déconnecté puis redirigé vers Stripe
- Si paiement réussi : retour au login pour se connecter
- Si paiement annulé : compte créé mais utilisateur doit payer pour accéder

## Nouveautés V13

### 1. Rebranding complet "THE WHITE LIST"
- Nouveau nom : "THE WHITE LIST" (anciennement ConciergeLuxe)
- Logo typographique ultra-premium avec police serif élégante
- Style haute couture / mode minimaliste
- Nouveau slogan : "L'hyper-personnalisation, sans effort."

### 2. Page dédiée /reset-password
- Flux "Mot de passe oublié" avec page dédiée
- Étape 1 : Saisie de l'email
- Étape 2 : Vérification du code reçu par email
- Étape 3 : Définition du nouveau mot de passe (8 caractères min)
- Étape finale : Message de succès avec bouton de connexion
- Pre-remplissage de l'email si passé en paramètre URL

### 3. Intégration Stripe
- Redirection automatique vers Stripe après inscription réussie
- URL Stripe : `https://buy.stripe.com/cNi3cveZm9Jybjwg6m`
- L'utilisateur reste connecté, le paiement s'effectue sur Stripe

## Nouveautés V12

### 1. Correction du bug 404 post-connexion
- Après la vérification 2FA, l'utilisateur est maintenant correctement redirigé vers `/app`
- Ajout de la route `/login` dans `ProtectedRoutes` pour rediriger vers `/app`

### 2. Flux "Mot de passe oublié" finalisé
- Le mot de passe est correctement sauvegardé et remplace l'ancien
- Messages d'erreur et de succès avec accents français corrects

### 3. Pièces jointes temporairement désactivées
- Le bouton d'upload de fichiers est grisé avec un badge "À venir"
- Aucune erreur générée au clic, fonctionnalité à venir

### 4. Refonte complète de la Landing Page (SEO/CRO)
- **Français parfait** : Tous les accents et la grammaire sont corrects
- **SEO optimisé** : H1, H2 sémantiques avec mots-clés hôteliers
- **Nouveau slogan** : "Le sur-mesure instantané"
- **Section ROI percutante** : 90% de temps gagné, 500+ établissements
- **CTAs optimisés** : "Créer un compte gratuitement", "Demander une démonstration"
- **Trust signals** : Sans engagement, Mise en place immédiate, Support dédié
- **Design Ultra Luxe** : Inspiré Linear, Vercel, palaces parisiens

### 5. Orthographe française corrigée partout
- Pages Login, SignUp, Notes avec tous les accents (é, è, à, ô, etc.)
- Aucune faute tolérée sur l'interface utilisateur

## Nouveautes V9

### 1. Authentification 2FA Reelle
- Verification mot de passe PUIS code magic InstantDB
- Etape 1/2 : Email + Mot de passe (verifie contre le hash stocke)
- Etape 2/2 : Code de securite envoye par email

### 2. Affichage du Nom de l'Hotel
- Le header affiche le nom de l'hotel du profil utilisateur (au lieu de l'email)
- Stocke dans userProfiles.hotelName dans InstantDB

### 3. Titres Editables avec Auto-Save
- Programme : Titre modifiable avec sauvegarde automatique (onBlur)
- Historique : Titres des sejours modifiables avec sauvegarde instantanee
- Format suggere : "Votre sejour au [Hotel] - Du X au Y [Mois]"

### 4. PDF avec Titre Personnalise
- Le PDF utilise le titre personnalise du programme
- Si non defini, utilise le format suggere base sur l'hotel et les dates

## Nouveautes V8

### 1. Authentification InstantDB
- Inscription avec : Prenom, Nom, Nom de l'hotel, Email, Mot de passe
- Connexion avec 2FA (mot de passe + code magic)
- Profils utilisateurs stockes dans InstantDB

### 2. Historique des Sejours
- Page `/history` listant tous les programmes sauvegardes
- Filtres par utilisateur (odukiogaUserId)
- Actions : Ouvrir, Telecharger PDF, Supprimer

### 3. Sauvegarde a la Demande
- Les sejours ne sont sauvegardes que lors de :
  - Clic sur "Enregistrer"
  - Clic sur "Generer le PDF"
- Pas de sauvegarde automatique en arriere-plan

## Nouveautes V7

### FIX CRITIQUE N°1 : Longs Sejours (+ de 4 jours)
**Probleme resolu** : Le planning se "vidait" apres le jour 4 car les venues etaient consommees.

**Solution implementee :**
- Nouveau systeme de tracking des venues avec reutilisation apres un delai
- Pour les sejours de 5+ jours, les venues peuvent etre reutilises :
  - Musees/Activites : apres 4 jours
  - Restaurants : apres 3 jours
- Garantie de 2 options par creneau meme sur les tres longs sejours
- Si aucun venue disponible, creation d'un creneau "Temps libre"
- L'intensite selectionnee s'applique TOUS LES JOURS sans exception

### FIX CRITIQUE N°2 : Persistance des Titres (UI & PDF)
**Probleme resolu** : Les titres modifies n'etaient pas affiches correctement.

**Solution implementee :**
- Vue concierge et vue client affichent maintenant le meme champ (themeClient)
- Les modifications sont instantanement visibles apres sauvegarde
- Le PDF exporte les titres personnalises (pas les titres par defaut)
- Coherence totale entre l'affichage et l'export

## Nouveautes V6

### Filtrage 100% Strict des Categories (CRITIQUE)
- **Regle absolue** : Les elements proposes correspondent STRICTEMENT aux categories selectionnees
- Exemple Restaurant : Si "Etoile" est selectionne, SEULS les restaurants etoiles sont proposes
- Mixite : Si plusieurs categories selectionnees, le resultat est un mix UNIQUEMENT de ces categories
- Application a TOUTES les bases (Restaurants, Musees, Activites, Shopping, Nightlife)
- Tout resultat hors categorie est considere comme une erreur fatale

### Logique du Rythme (Intensite) Revisee
Structure mathematique precise par creneau :
- **1 creneau d'activite = TOUJOURS 2 options proposees au choix**
- **Duree minimale par activite : 2 heures**
- Ces activites s'additionnent aux repas (Restaurants) et Nightlife (qui restent fixes)

**Rythme DETENDU :**
- Matin : Libre (pas d'activite)
- Apres-midi : 1 seul creneau d'activite (2 options au choix)

**Rythme MODERE :**
- Matin : 1 creneau d'activite (2 options)
- Apres-midi : 1 creneau d'activite (2 options)

**Rythme INTENSE :**
- Matin : 1 creneau d'activite (2 options)
- Apres-midi : 2 creneaux d'activites distincts (chacun avec 2 options)

### Activites ONE-SHOT Renforcees
Certaines activites ne sont proposees qu'UNE SEULE FOIS sur la totalite du sejour :
- Tours en bateau (croisiere)
- Tours en voiture (tour_voiture)
- Vols en helicoptere (helicoptere)
- Meme si le sejour est long et que la categorie est selectionnee, max 1 occurrence

### Coherence Chronologique Stricte
- Validation automatique du flux temporel de chaque journee
- Un creneau de l'apres-midi ne peut JAMAIS avoir un horaire anterieur au matin
- Ajout automatique d'un buffer de 30 min si conflit detecte

### Persistance des Titres pour PDF (Confirme)
- Les titres modifies (programme et journees) sont sauvegardes en base de donnees
- Le PDF exporte reprend les titres personnalises, pas les titres par defaut
- Bouton d'enregistrement pour confirmer les modifications

## Nouveautes V3

### Changement de Type d'Activite (NOUVEAU)
Le concierge peut maintenant changer completement le TYPE d'un creneau d'activite :
- Bouton "Changer type" sur chaque creneau (vue concierge)
- Categories disponibles : Spa, Musee, Shopping, Activite
- Genere automatiquement 2 nouvelles options du nouveau type
- Respecte les horaires d'ouverture et les exclusions

### Placement du Spa au Milieu du Sejour (AMELIORE)
- Le Spa n'est JAMAIS propose le premier jour
- Placement automatique au milieu du sejour :
  - 2-4 jours : Jour 2
  - 5-6 jours : Jour 3
  - 7 jours : Jour 4
- Respecte toujours la regle de cadence (max 1 spa tous les 3 jours)

### Persistance des Titres Modifies
- Les titres modifies (programme et journees) sont sauvegardes en base de donnees
- Modifications persistantes apres rechargement de page
- Titres personnalises exportes dans le PDF final

## Nouveautes V2

### Selecteur d'Intensite du Sejour (V6 Revu)
Nouvelle etape dans le questionnaire pour definir le rythme des journees :
- **Detendu** : 2 restaurants (midi + soir) + 1 activite apres-midi
- **Modere** : 2 restaurants + 1 activite matin + 1 activite apres-midi
- **Intense** : 2 restaurants + 1 activite matin + 2 activites apres-midi
- **Note** : Le Nightlife s'ajoute toujours en bonus (+1 si selectionne)
- **Note** : Chaque creneau propose 2 options au choix (duree min 2h)

### Respect Strict des Horaires
- Croisement automatique jours de la semaine / horaires d'ouverture
- Un lieu ferme le mardi ne sera jamais propose un mardi
- Affichage des dates completes (ex: "Mardi 15 janvier 2025")

### Regles Metier Ameliorees
- **Vue Tour Eiffel** : Minimum 1 restaurant avec vue par sejour, max 1 tous les 4 jours
- **Geants du Shopping** : Au moins 1 marque parmi Hermes, Dior, Chanel, Louis Vuitton obligatoire
- **Avertissement Hermes** : Note speciale sur le systeme de loterie pour les RDV
- **Aucun doublon** : Un meme lieu ne peut pas apparaitre 2 fois dans un sejour

### Export PDF Multilingue
Selecteur de langue avant export :
- Francais (par defaut)
- English
- Espanol
- Italiano
- Deutsch
- Portugues
- Chinese
- Arabic
- Russian

## Fonctionnalites Principales

### Questionnaire Personnalisation (9 etapes)

**1. Selection des dates :**
- Date d'arrivee et date de depart
- Option "heure d'arrivee connue" avec selection d'heure
- Option "heure de depart connue" avec selection d'heure
- Si heure d'arrivee connue - programme commence 4h apres
- Si heure de depart connue - programme ajuste en consequence

**2. Nombre de voyageurs :**
- Maximum 9 personnes
- Interface intuitive avec boutons +/- et selection rapide
- Labels contextuels (Solo, Couple, Petit groupe, Groupe)

**3. Intensite du sejour (V6 Revu) :**
- Detendu : Matin libre + 1 activite apres-midi + 2 restaurants
- Modere : 1 activite matin + 1 activite apres-midi + 2 restaurants
- Intense : 1 activite matin + 2 activites apres-midi + 2 restaurants
- Nightlife = bonus (ne compte pas dans le quota)
- Chaque creneau = 2 options au choix, duree min 2h

**4. Categories de restaurants :**
- Brasserie / Institution Parisienne
- Cuisine du Monde
- Trendy / Festif
- Etoile (gastronomie)
- Confidentiel
- Multi-selection possible
- **Regle** : au moins 1 restaurant avec vue Tour Eiffel garanti

**5. Categories de musees (multi-selection) :**
- Art contemporain / Classique (Orangerie, Jacquemart-Andre, Petit Palais)
- Patrimoine & Monuments (Galerie Dior, Rodin, Carnavalet)
- Art Moderne (Fondation LV, Picasso, Palais de Tokyo)
- Incontournables (Louvre, Orsay, Quai Branly)
- Aucun
- **Note** : "Aucun" est exclusif (desactive les autres options)

**6. Categories d'activites :**
- Enfant / Famille
- Culture / Visite guidee
- Activite creative
- Tour voiture prestige (ONE-SHOT)
- Croisiere sur la Seine (ONE-SHOT)
- Helicoptere (ONE-SHOT)
- Multi-selection possible
- **Regle ONE-SHOT** : Tour voiture, Croisiere et Helicoptere ne sont proposes qu'une seule fois par sejour

**7. Spa :**
- Oui / Non
- **Regle cadence** : maximum 1 spa tous les 3 jours

**8. Shopping :**
- Oui / Non
- Si oui : dropdown de 6 boutiques aleatoires
- Selection de maximum 4 boutiques
- **Regle Geants** : Au moins 1 parmi Hermes/Dior/Chanel/Louis Vuitton
- **Note Hermes** : Avertissement sur le systeme de loterie pour les RDV

**9. Nightlife (multi-selection) :**
- Palace, Lounge, Rooftops
- SpeakEasy, Bar a Vins
- Clubs, Restaurants Festifs
- Cabarets
- Aucun
- **Note** : "Aucun" est exclusif
- **Regle Bonus** : Nightlife s'ajoute aux activites (ne remplace pas)

**Transport :**
- Chabe Paris uniquement
- Telephone affiche : 01 41 20 95 10

### Affichage des Dates

- Dates reelles affichees avec jour de la semaine
- Format : "Mardi 15 janvier 2025"
- Calcul automatique base sur la date de debut du sejour
- PDF inclut les dates exactes

### Titres de Journee Dynamiques

Les titres de chaque journee sont generes automatiquement selon les activites :
- Art & Gastronomie (musees + restaurants)
- Detente & Bien-etre (spas)
- Paris by Night (clubs, bars, cabarets)
- Mode & Shopping (personal shoppers)
- Aventure en Famille (activites enfants)
- Paris au Fil de l'Eau (nautique)
- Privileges & Exclusivites (elite)
- Gastronomie d'Exception (top 25)

### Vue Concierge (interne)

- Deux options par creneau (selection unique)
- Numeros de telephone officiels
- Horaires reels d'ouverture
- Style/ambiance du lieu
- Description personnalisee expliquant la recommandation
- Badge "Vue Tour Eiffel" sur les restaurants concernes
- Badge "RDV requis" sur les boutiques necessitant reservation
- Notes d'avertissement (ex: loterie Hermes)
- Notes concierge editables (sauvegarde au clic sur "Enregistrer")
- Bouton "Exclure" pour ne plus proposer un lieu
- Badge de verification : Verifie / A confirmer / En attente
- **Option Voiturier/Transferts** : Arrivee et depart (aeroport, gare, hotel)
- **Contacts internes shopping** : Contact prive pour les boutiques (non visible client)

### Vue Client (PDF)

- Affiche uniquement les options selectionnees
- Texte elegant et fluide
- Notes concierge incluses
- Ton palace, raffine
- Pret a envoyer au client
- **Multilingue** : 9 langues disponibles

### Export PDF

- Bouton "Exporter PDF" toujours visible
- **Selecteur de langue** a cote du bouton (9 langues)
- Telechargement direct (pas de previsualisation dans un nouvel onglet)
- Generation sans erreur, meme avant validation
- Contient uniquement les elements selectionnes
- Inclut les notes du concierge
- Affiche les dates reelles du sejour
- Ne bloque jamais l'interface

## Villes Disponibles

- **Paris** : Active, generation complete
- Autres villes : "A venir - cette destination sera bientot disponible"

## Routes

- `/` - Landing Page THE WHITE LIST
- `/login` - Connexion (email + password + 2FA)
- `/reset-password` - Réinitialisation du mot de passe (flux simplifié V15)
- `/payment-success` - Page de retour Stripe (paiement validé)
- `/payment-canceled` - Page de retour Stripe (paiement échoué)
- `/app` - Sélection de destination (protégé)
- `/questionnaire/:cityId` - Questionnaire personnalisation
- `/program/:id` - Programme avec toggle Vue Concierge / Vue Client
- `/history` - Historique des séjours

## Base de Donnees CSV

L'application utilise exclusivement les donnees des fichiers CSV :

| Categorie | Fichier | Contenu |
|-----------|---------|---------|
| Restaurants | restaurants.csv | Brasseries, Cuisine du monde, Trendy, Etoiles, Confidentiel |
| Musees | mus--es.csv | Art contemporain/Classique, Patrimoine, Art moderne, Incontournables |
| Activites | activit--s.csv | Enfants, Culture, Creatif, Tour voiture, Croisiere, Helicoptere |
| Spas | spas.csv | Top 15 spas de luxe parisiens |
| Shopping | shopping.csv | Boutiques Avenue Montaigne (avec champ RDV) |
| Nightlife | nightlife.csv | Palace/Lounge/Rooftops, SpeakEasy, Clubs Festifs, Cabarets |
| Transports | transports.csv | CHABE PARIS (leader), services VIP |

### Categories CSV Detaillees

**Musees (colonne "Categories"):**
- "Art Contemporain/Classique" - Orangerie, Jacquemart-Andre, Petit Palais
- "Patrimoine et Monument" - Galerie Dior, Rodin, Carnavalet, Hotel de la Marine
- "Art Moderne" - Fondation LV, Picasso, Palais de Tokyo, Bourse de Commerce
- "Incontournable" - Louvre, Orsay, Quai Branly

**Nightlife (colonne "Categorie"):**
- "Palace, Lounge, Rooftops" - Bar Hemingway, Ritz Bar, Bristol, etc.
- "SpeakEasy, Bar a Vins" - Danico, Serpent a Plume, Castor Club, etc.
- "Clubs, Restaurants Festifs" - Matignon, etc.
- "Cabaret" - Moulin Rouge, Lido, Crazy Horse, etc.

**Restaurants (colonne "Experience"):**
- "Vue Tour Eiffel" - Restaurants avec vue sur la Tour Eiffel

**Shopping (colonne "Rendez-vous necessaire"):**
- "oui" / "recommande" - Reservation requise
- "non" - Sans reservation

**Regle absolue :** Aucune recommandation hors base de donnees.

## API Backend

### Routes API V3

- `PUT /api/programs/:id/activities/:activityId/switch-type` - Changer le type d'activite d'un creneau

### Programmes

- `POST /api/programs/generate` - Genere un nouveau programme
- `GET /api/programs` - Liste des programmes
- `GET /api/programs/:id` - Detail d'un programme
- `PUT /api/programs/:id/activities/:activityId/select` - Selectionner une option
- `PUT /api/programs/:id/activities/:activityId/notes` - Mettre a jour les notes
- `PUT /api/programs/:id/validate` - Valider le programme
- `POST /api/programs/:id/exclude` - Exclure un lieu
- `GET /api/programs/:id/pdf?lang=xx` - Generer le PDF (lang: fr, en, es, it, de, pt, zh, ar, ru)

### Abonnement (prepare pour plus tard)

- `POST /api/subscription/start-trial` - Demarrer essai gratuit
- `GET /api/subscription/status` - Statut abonnement
- `POST /api/subscription/activate` - Activer abonnement

## Design

- **Palette** : Charbon profond (#0a0a0f) + Or champagne (amber-500)
- **Typo** : Cormorant Garamond (titres) + Outfit (corps)
- **Style** : Luxe discret, inspire Aman/Four Seasons/Hermes

## Stack Technique

### Frontend (webapp/)
- React 18 + TypeScript
- Vite
- React Router v6
- TanStack Query
- Tailwind CSS + shadcn/ui
- Framer Motion
- Lucide Icons

### Backend (backend/)
- Bun + Hono
- Prisma (SQLite)
- Better Auth (prepare, desactive)
- @react-pdf/renderer
- Zod validation

## Prochaines Étapes

- [x] Multi-langue PDF (EN, ES, IT, DE, PT, ZH, AR, RU)
- [x] Sélecteur d'intensité du séjour
- [x] Respect strict des horaires/jours d'ouverture
- [x] Règle Vue Tour Eiffel améliorée
- [x] Règle Géants Shopping
- [x] Changement de type d'activité (V3)
- [x] Placement Spa au milieu du séjour (V3)
- [x] Persistance des titres modifiés (V3)
- [x] Filtrage 100% strict des catégories (V6)
- [x] Logique intensité révisée : Détendu/Modéré/Intense (V6)
- [x] ONE-SHOT renforcé pour bateau/voiture/hélicoptère (V6)
- [x] Cohérence chronologique stricte (V6)
- [x] Longs séjours (5+ jours) : réutilisation des venues après délai (V7)
- [x] Persistance des titres corrigée : affichage et PDF cohérents (V7)
- [x] Landing Page B2B professionnelle (V11)
- [x] Temps Libre JAMAIS auto-généré (V11)
- [x] Shopping switch : 4 options (V11)
- [x] PDF sans numéros de téléphone (V11)
- [x] Fix 404 post-connexion 2FA (V12)
- [x] Landing Page SEO/CRO optimisée avec français parfait (V12)
- [x] Pièces jointes désactivées avec badge "À venir" (V12)
- [x] Rebranding "THE WHITE LIST" (V13)
- [x] Page dédiée /reset-password (V13)
- [x] Intégration Stripe après inscription (V13)
- [x] Vérification unicité e-mail avant création de compte (V14)
- [x] Lien Stripe corrigé avec logique de déconnexion (V14)
- [x] Validation e-mail existant avant reset password (V14)
- [x] Pages de retour Stripe /payment-success et /payment-canceled (V15)
- [x] Flux reset password simplifié sans code visible dans l'URL (V15)
- [ ] Nouvelles destinations (Londres, Milan, Dubaï...)
- [ ] Intégration API Google Places pour vérification temps réel
