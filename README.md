# Enquête — Sondages CNAO

Application Next.js pour créer des sondages médicaux, collecter des réponses sans compte et analyser les résultats (admin).

## Stack

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| Styles | Tailwind CSS v4 (look Georgia / encre-ocré) |
| Base de données | Vercel Postgres (Neon) |
| ORM | Prisma |
| Auth admin | Auth.js v5 (email + mot de passe) |
| i18n | next-intl (FR / EN) |
| Graphiques | Recharts (vue simple + vue graphique) |
| Exports | CSV, PDF, QR code |

## Fonctionnalités

- **Admin** (compte requis) : créer un sondage, partager lien + code + QR, voir résultats, exporter CSV/PDF
- **Répondants** (sans compte) : accès via `/fr/repondre/[CODE]` ou lien partagé
- **Template CNAO** : enquête coxarthrose pré-remplie (24 questions)

## Démarrage local

```bash
npm install
cp .env.example .env
# Renseignez DATABASE_URL et AUTH_SECRET dans .env
npx prisma db push
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) → redirection vers `/fr`.

Créez un compte admin sur `/fr/inscription`.

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL Postgres (Vercel Storage ou Neon) |
| `AUTH_SECRET` | Secret Auth.js (`openssl rand -base64 32`) |
| `AUTH_URL` | URL de l'app (ex. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | URL publique pour les liens de partage |

## Déploiement Vercel

1. Poussez le repo sur GitHub
2. Importez le projet dans [Vercel](https://vercel.com)
3. **Storage → Postgres** : créez une base et liez `DATABASE_URL`
4. Ajoutez `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL` (URL de production)
5. Deploy — la commande `build` exécute `prisma generate && next build`
6. Après le premier deploy : `npx prisma db push` en local avec la prod `DATABASE_URL`, ou via Vercel CLI

## Routes principales

| Route | Accès |
|-------|-------|
| `/fr` | Accueil |
| `/fr/connexion` | Login admin |
| `/fr/inscription` | Inscription admin |
| `/fr/creer` | Créer un sondage (admin) |
| `/fr/publie/[code]` | Partage lien / QR (admin) |
| `/fr/repondre/[code]` | Répondre (public) |
| `/fr/resultats/[code]` | Résultats (admin créateur) |
| `/api/export/csv/[code]` | Export CSV |
| `/api/export/pdf/[code]` | Export PDF |
| `/api/qr/[code]` | QR code PNG |

## Structure

```
app/[locale]/     Pages i18n
components/       UI (formulaires, graphiques, partage)
lib/actions/      Server Actions
lib/templates/    Template enquête CNAO
prisma/           Schéma Postgres
messages/         Traductions FR / EN
```
