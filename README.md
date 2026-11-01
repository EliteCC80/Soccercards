# Soccercards

Voetbal-kansinschattingen met een openbaar, controleerbaar trackrecord.

## Starten
```
npm install
npm run seed     # DEMODATA (verzonnen wedstrijden) naar .data/pg
npm run dev      # http://localhost:3000/trackrecord
npm test
```

## Fase 0–1 (klaar)
- Postgres-schema (PGlite voor dev/test; zelfde SQL voor een echte Postgres): `predictions` (append-only via trigger), `results`, `odds_closing`, `plans`, `users`, `credit_ledger`.
- Hashketen: `hash = SHA-256(prev_hash + "|" + JSON([matchId, competitie, thuis, uit, aftrap, kansen in basispunten, modelversie, createdAt]))`. Voorspellingen na de aftrap worden geweigerd (ook in de database via CHECK).
- `/trackrecord`: alle voorspellingen, kalibratiegrafiek (Wilson 95%), Brier en log loss tegenover slotkoersen zonder marge, ketencontrole, filter per competitie.
- `/verify/[hash]`: controle en uitleg om zelf na te rekenen. `/api/export?format=csv|json`.

## Nog open
- Echte voorspelbron en slotkoersen (nu alleen `scripts/seed.ts`).
- Productie-Postgres en een job die voorspellingen vóór de aftrap wegschrijft.
