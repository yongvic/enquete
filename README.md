<div align="center">

<img src="./public/logo-header.png" alt="Sondage" width="280" />

# Sondage

**Plateforme de collecte & analyse de données pour enquêtes académiques et terrain.**

Créez des sondages, partagez un lien ou un code, visualisez les résultats en direct et exportez vos rapports — sans friction pour les répondants.

<br />

[![Live Demo](https://img.shields.io/badge/Démo-enquete--pi.vercel.app-1e2a38?style=for-the-badge&logo=vercel&logoColor=white)](https://enquete-pi.vercel.app)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Privé-c9971c?style=for-the-badge)](#)

<br />

[Français](#fonctionnalités) · [English](#english) · [Déploiement](#déploiement-vercel) · [Variables](#variables-denvironnement)

</div>

---

<table>
<tr>
<td width="68%" valign="top">

## Aperçu

| Rôle | Ce qu'il peut faire |
|------|---------------------|
| **Créateur** | Compte, wizard pas à pas, brouillons, publication, résultats sécurisés |
| **Répondant** | Répond via code ou lien — **aucun compte** requis |
| **Superadmin** | Statistiques plateforme, feedbacks utilisateurs, gestion globale |

> Démo en ligne : **[enquete-pi.vercel.app](https://enquete-pi.vercel.app)**

### Fonctionnalités

- **Assistant de création** — sondage vierge, questions variées (choix, note, texte…), champs obligatoires
- **Tableau de bord** — sondages publiés, brouillons, accès rapide aux résultats
- **Partage** — code court, lien direct, QR code
- **Analyse** — graphiques Recharts, exports CSV · Excel · PDF
- **Rapport IA** — synthèse rédigée via Google Gemini (fallback multi-modèles)
- **Feedback** — widget intégré, consultable par le superadmin
- **i18n** — interface FR / EN (`next-intl`)
- **Mobile-first** — navbar adaptive, menu bottom sheet, responsive complet

### Routes principales

| Route | Accès |
|-------|-------|
| `/fr` | Accueil |
| `/fr/inscription` · `/fr/connexion` | Compte créateur |
| `/fr/dashboard` | Espace utilisateur |
| `/fr/creer` | Wizard de création |
| `/fr/publie/[code]` | Partage (propriétaire) |
| `/fr/repondre/[code]` | Réponse (public) |
| `/fr/resultats/[code]` | Résultats (propriétaire) |
| `/fr/admin` | Superadmin |

### Démarrage local

```bash
git clone https://github.com/yongvic/enquete.git
cd enquete
npm install
cp .env.example .env
# Renseignez DATABASE_URL et AUTH_SECRET
npx prisma db push
npm run dev
```

→ [http://localhost:3000](http://localhost:3000) redirige vers `/fr`.

### Structure

```
app/[locale]/       Pages & routes i18n
components/         UI (wizard, graphiques, navbar, feedback…)
lib/actions/        Server Actions
lib/                Auth, exports, IA, stats
prisma/             Schéma Postgres & migrations SQL
messages/           Traductions FR / EN
public/             Logos & assets
```

</td>
<td width="32%" valign="top" align="center">

<br />

### Stack technique

<p align="center">
  <a href="https://nextjs.org"><img src="https://skillicons.dev/icons?i=nextjs" width="44" alt="Next.js" /></a>
  <a href="https://react.dev"><img src="https://skillicons.dev/icons?i=react" width="44" alt="React" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://skillicons.dev/icons?i=ts" width="44" alt="TypeScript" /></a>
</p>
<p align="center">
  <a href="https://tailwindcss.com"><img src="https://skillicons.dev/icons?i=tailwind" width="44" alt="Tailwind" /></a>
  <a href="https://www.prisma.io"><img src="https://skillicons.dev/icons?i=prisma" width="44" alt="Prisma" /></a>
  <a href="https://www.postgresql.org"><img src="https://skillicons.dev/icons?i=postgres" width="44" alt="Postgres" /></a>
</p>
<p align="center">
  <a href="https://vercel.com"><img src="https://skillicons.dev/icons?i=vercel" width="44" alt="Vercel" /></a>
  <a href="https://eslint.org"><img src="https://skillicons.dev/icons?i=eslint" width="44" alt="ESLint" /></a>
</p>

<br />

| Couche | Outil |
|:--|:--|
| Framework | Next.js 15 App Router |
| UI | React 19 · Tailwind v4 |
| Data | Prisma · Neon Postgres |
| Auth | Auth.js v5 |
| Charts | Recharts |
| Exports | ExcelJS · jsPDF |
| IA | Google Gemini |
| Analytics | Vercel Analytics |

<br />

### Architecture

```mermaid
flowchart LR
  A[Répondant] -->|code / lien| B[Next.js]
  C[Créateur] -->|dashboard| B
  B --> D[(Postgres)]
  B --> E[Gemini API]
  B --> F[Exports PDF/XLSX]
```

<br />

**Design** — typographie Georgia, palette encre & ocre, composants sobres.

</td>
</tr>
</table>

---

## Variables d'environnement

| Variable | Requis | Description |
|----------|:------:|-------------|
| `DATABASE_URL` | ✓ | URL Postgres (Neon / Vercel) |
| `AUTH_SECRET` | ✓ | Secret session Auth.js |
| `AUTH_URL` | ✓ | URL de l'application |
| `NEXT_PUBLIC_APP_URL` | ✓ | URL publique pour les liens de partage |
| `SUPERADMIN_EMAIL` | | Email du superadmin |
| `TEMPLATE_ACCESS_EMAIL` | | Accès template enquête réservé |
| `GEMINI_API_KEY` | | Clé API pour rapports IA |
| `GEMINI_MODELS` | | Liste de modèles (fallback) |
| `NEXT_PUBLIC_*` | | Liens footer & auteur |

Voir [`.env.example`](./.env.example) pour le modèle complet.

---

## SEO & référencement

- Metadata Open Graph / Twitter par page (`lib/seo.ts`)
- `sitemap.xml` et `robots.txt` générés automatiquement
- Manifest PWA (`/manifest.webmanifest`)
- Données structurées JSON-LD (Organization + WebApplication)
- Pages privées (dashboard, admin, résultats) en `noindex`
- Image de partage : `/promo/promo-linkedin.png`

Conseil : définissez `NEXT_PUBLIC_APP_URL` / `AUTH_URL` sur l’URL de production pour des canonicals corrects.

## Déploiement Vercel

1. Importez le dépôt sur [Vercel](https://vercel.com)
2. Créez une base **Postgres** (Neon) et liez `DATABASE_URL`
3. Ajoutez les variables d'environnement
4. Deploy — `prisma generate` s'exécute au build
5. Appliquez les migrations SQL si besoin (`prisma/migrate-*.sql`) via la console Neon

---

## English

**Sondage** is a Next.js survey platform for academic and field research: create surveys, share via link or code, analyze live results, export reports (CSV / Excel / PDF), and generate AI summaries. Respondents never need an account.

---

<div align="center">

<br />

**Conçu par [Young Vic](https://github.com/yongvic)**

[![GitHub](https://img.shields.io/badge/GitHub-yongvic/enquete-1e2a38?style=flat-square&logo=github)](https://github.com/yongvic/enquete)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Edo_Yawo_Sokpa-0A66C2?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/edo-yawo-sokpa-06617b333)

<br />

<sub>Enquêtes académiques · Collecte de terrain · Open source</sub>

</div>
