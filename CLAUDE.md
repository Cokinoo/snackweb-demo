# demo-resto — Plateforme SaaS Restaurateurs Réunionnais

## Contexte projet
Démo fonctionnelle pré-lancement — Next.js 14 App Router.
Objectif : valider le produit terrain et recruter des beta testeurs.
Ce projet évoluera vers le vrai produit SaaS — l'architecture doit le permettre.
Documents de référence disponibles dans /docs :
- DEMO_Reference_v10.md → périmètre complet de la démo
- PRD_v3.md → vision produit complète

## Mode actuel : DEMO
L'état est géré en mémoire (store/state.ts).
Pas de base de données, pas d'auth réelle, pas de Stripe, pas de Meta API.
Ne jamais installer ou suggérer PostgreSQL, Prisma, NextAuth ou Stripe
sauf si explicitement demandé.

## Priorité absolue — Mobile First
Toutes les pages lisibles entre 320px et 400px de large.
Pas de tableaux HTML — cards empilées uniquement.
Boutons minimum 44px de hauteur.
Texte minimum 14px.

---

## Stack technique

### Frameworks & libs
- Next.js 14 App Router — TypeScript strict
- Tailwind CSS — utilitaires uniquement, pas de CSS custom sauf exception justifiée
- shadcn/ui — UNIQUEMENT pour le dashboard (/dashboard)
- qrcode.js — génération QR code côté client

### Règles par page
- /dashboard → shadcn/ui + Tailwind
- /[type] (vitrines) → Tailwind pur, design custom par vitrine, pas de shadcn
- /whatsapp → HTML/CSS pur, reproduction fidèle interface WhatsApp mobile
- /ticket → CSS pur, format thermique 80mm, police monospace
- /menu/[type] → Tailwind pur, pas de shadcn

### Ce qu'on n'utilise PAS
- Pas de Redux, Zustand ou autre state manager externe
- Pas de React Query ou SWR
- Pas de CSS modules
- Pas d'animations complexes (Framer Motion etc.)

---

## Architecture des URLs

### Pages publiques (client)
- /snack           → vitrine Chez Tatie Monique
- /restaurant      → vitrine Le Quotidien Péi
- /pizzeria        → vitrine Pizza Lé Bon
- /foodtruck       → vitrine Dodo on the Road
- /menu/snack      → menu + commande snack
- /menu/restaurant → menu + commande restaurant
- /menu/pizzeria   → menu + commande pizzeria
- /menu/foodtruck  → menu + commande food truck

### Pages back-office (restaurateur)
- /dashboard  → dashboard principal (bottom menu + onglets commandes)
- /whatsapp   → simulation interface WhatsApp
- /ticket     → simulation ticket thermique

### API Routes
- GET  /api/state                    → état global complet
- POST /api/commandes                → nouvelle commande
- POST /api/commandes/[id]/statut    → changer statut commande
- POST /api/pause                    → toggle pause commandes
- POST /api/retard                   → +10 min sur créneaux actifs
- POST /api/message-du-jour          → publier/supprimer message du jour
- POST /api/menu/[type]              → ajouter/modifier/désactiver un plat
- GET  /api/creneaux/[type]          → créneaux disponibles

---

## État partagé (store/state.ts)

Objet singleton en mémoire Node.js — partagé entre toutes les API Routes.
Le polling côté client toutes les 2 secondes appelle GET /api/state.

### Structure TypeScript

```typescript
interface State {
  commandes: Commande[]
  pause: boolean
  messageJour: { texte: string; photo?: string; expireA: string } | null
  retardMinutes: number
  vitrines: {
    [type: string]: {
      plats: Plat[]
      creneaux: Creneaux
      parametres: Parametres
    }
  }
}

interface Commande {
  id: string
  numero: string          // ex: "#047"
  vitrine: string         // snack | restaurant | pizzeria | foodtruck
  plats: LigneCommande[]
  montant: number
  creneau: string         // ex: "12h30"
  statut: 'nouvelle' | 'en_cours' | 'prete' | 'recuperee'
  createdAt: string
  whatsappPhone: string
}

interface LigneCommande {
  platId: string
  nom: string
  quantite: number
  prix: number
}

interface Plat {
  id: string
  nom: string
  description: string
  prix: number
  categorie: string
  photo?: string
  disponible: boolean
  affichageSiRupture: 'griser' | 'masquer'
}

interface Creneaux {
  intervalle: number      // minutes — défaut 10
  dureeService: number    // minutes — ex: 30
  capaciteParLot: number  // ex: 10 commandes
}

interface Parametres {
  conserverPlats: boolean
  horaires: Horaire[]
}

interface Horaire {
  jour: string            // 'lun' | 'mar' | 'mer' | 'jeu' | 'ven' | 'sam' | 'dim'
  ouverture: string       // ex: "11h30"
  fermeture: string       // ex: "14h00"
  service: 'midi' | 'soir'
}
```

---

## Règles métier — À respecter impérativement

### Créneaux
- Calculés dynamiquement selon : intervalle + duréeService + capacitéParLot
- Si créneau plein → proposer automatiquement le suivant
- Bouton +10 min : décale UNIQUEMENT les commandes statut 'nouvelle' et 'en_cours'
- Jamais décaler les commandes 'prete' ou 'recuperee'

### Pause commandes
- Quand pause = true : menu reste visible, bouton Commander désactivé
- Message affiché côté client : "Les commandes en ligne ne sont pas disponibles
  pour le moment, veuillez venir passer votre commande au comptoir"
- Bandeau rouge visible en permanence dans le dashboard quand pause = true

### Rupture de stock
- 2 modes par plat, mémorisés : 'griser' ou 'masquer'
- griser → plat visible, grisé et barré, non commandable
- masquer → plat invisible dans le menu client
- Remettre disponible → restaure le mode mémorisé sans le changer

### Message du jour
- Expire automatiquement à minuit (vérification côté serveur à chaque appel /api/state)
- Affiché en bandeau coloré sous le header de la vitrine
- Contient texte + photo optionnelle

### Conservation des plats
- conserverPlats = false → les plats sont vidés à minuit
- conserverPlats = true → les plats persistent indéfiniment

### Statuts commande et WhatsApp simulé
- nouvelle → en_cours : pas de message WhatsApp
- en_cours → prete : ajouter message simulé dans /whatsapp :
  "Votre commande [numero] est prête ! Venez la récupérer."
- Retard (+10 min) : ajouter message simulé dans /whatsapp pour chaque
  commande concernée :
  "Commande [numero] : léger retard, nouveau créneau [heure]. Merci !"

---

## Conventions de code

### Fichiers et dossiers
- Composants : PascalCase → CommandeCard.tsx
- Utilitaires : camelCase → formatCreneau.ts
- Pages : page.tsx (convention Next.js App Router)
- Types : centralisés dans src/types/index.ts

### Composants
- Un composant = un fichier
- Props typées avec interface, jamais de 'any'
- Pas de logique métier dans les composants UI
- La logique va dans des hooks custom (hooks/useCommandes.ts etc.)

### API Routes
- Toujours retourner { success: boolean, data?: any, error?: string }
- Toujours valider les inputs
- Toujours gérer les erreurs avec try/catch

### Polling
- Hook custom usePolling(url, interval) — réutilisé sur toutes les pages
- Interval : 2000ms fixe
- Cleanup propre au unmount (clearInterval dans useEffect return)

### Tailwind
- Classes utilitaires uniquement
- Pas de valeurs arbitraires sauf [380px] pour largeur démo
- Toujours mobile first (pas de classes sans préfixe avant les classes sm:)

---

## Structure des fichiers

```
src/
├── app/
│   ├── snack/page.tsx
│   ├── restaurant/page.tsx
│   ├── pizzeria/page.tsx
│   ├── foodtruck/page.tsx
│   ├── menu/
│   │   ├── snack/page.tsx
│   │   ├── restaurant/page.tsx
│   │   ├── pizzeria/page.tsx
│   │   └── foodtruck/page.tsx
│   ├── dashboard/page.tsx
│   ├── whatsapp/page.tsx
│   ├── ticket/page.tsx
│   └── api/
│       ├── state/route.ts
│       ├── commandes/route.ts
│       ├── commandes/[id]/statut/route.ts
│       ├── pause/route.ts
│       ├── retard/route.ts
│       ├── message-du-jour/route.ts
│       ├── menu/[type]/route.ts
│       └── creneaux/[type]/route.ts
├── components/
│   ├── dashboard/
│   ├── vitrine/
│   ├── menu/
│   ├── whatsapp/
│   └── ticket/
├── hooks/
│   ├── usePolling.ts
│   ├── useCommandes.ts
│   └── useCreneaux.ts
├── store/
│   └── state.ts
├── data/
│   ├── catalogue.json
│   ├── snack.json
│   ├── restaurant.json
│   ├── pizzeria.json
│   └── foodtruck.json
├── lib/
│   ├── creneaux.ts
│   ├── whatsapp.ts
│   └── utils.ts
└── types/
    └── index.ts

docs/
├── DEMO_Reference_v10.md
└── PRD_v3.md
```

---

## Instructions pour Claude Code

### Avant de coder
1. Lire ce fichier en entier avant de commencer
2. Si la tâche touche à la logique métier → relire la section "Règles métier"
3. Si ambiguïté → poser UNE question précise avant de coder
4. Toujours confirmer ce qu'on va faire avant de le faire

### Pendant le développement
- Une feature à la fois — ne pas anticiper les suivantes
- Vérifier que chaque composant est lisible à 380px
- Vérifier les imports après chaque fichier créé
- Préférer la lisibilité à la performance pour la démo

### Ce qu'on ne fait PAS
- Pas d'optimisation prématurée
- Pas d'installation de nouvelles libs sans demande explicite
- Pas de commentaires évidents dans le code
- Pas de console.log laissés dans le code final
- Pas de 'any' TypeScript
- Pas de BDD, pas d'auth, pas de Stripe en mode DEMO

### Workflow Git
- Commits atomiques — une feature = un commit
- Format : "feat: [description courte en français]"
- Vérifier que le build passe avant de committer
