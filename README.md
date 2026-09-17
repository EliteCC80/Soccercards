# Soccercards

Webapp om je voetbalkaarten-inventaris te beheren: kaarten vastleggen, prijsrange
en vraagprijs bijhouden, de listing-status volgen en de
Vinted_Listing_Tracker als CSV exporteren.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4
- Prisma + SQLite (`prisma/dev.db`)
- Vitest voor de domeinlogica

## Setup

```bash
npm install
cp .env.example .env        # DATABASE_URL="file:./dev.db"
npx prisma migrate deploy   # of: npm run db:migrate
npx prisma generate
node prisma/seed.mjs        # optioneel: twee voorbeeldkaarten
npm run dev                 # http://localhost:3000
```

## Scripts

| script | doet |
|---|---|
| `npm run dev` | dev-server |
| `npm run build` / `npm start` | productie build en server |
| `npm test` | Vitest |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | nieuwe migratie maken en toepassen |

## Gebruik

- **Overzicht** (`/`): filter op status en zoek op speler.
- **Kaart toevoegen** (`/cards/new`) en **bewerken** (`/cards/<id>`), met verwijderen.
- **CSV export** (`/api/export`): respecteert `?status=` en `?q=` en levert de
  kolommen van de Vinted_Listing_Tracker.

## Conventies

- Bedragen staan als **hele eurocenten (integer)** in de database — nooit floats
  voor geld. Gebruik `formatEuro` / `parseEuro` uit `src/lib/money.ts`.
- Statussen en condities staan in `src/lib/constants.ts`; gebruik `isStatus` /
  `isCondition` om invoer te valideren.
- Query- en mutatiehelpers staan in `src/lib/cards.ts`, zodat pagina's en de
  API-route dezelfde code delen.

## Nog niet in scope

Automatische marktwaardering, foto-upload en bundelprijzen: prijsvelden vul je nu
handmatig in.
