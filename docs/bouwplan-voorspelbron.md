# Bouwplan: echte voorspellingen in het trackrecord

Doel: de demodata vervangen door echte, vóór de aftrap vastgelegde kansen en een eerlijke vergelijking met de slotkoers.
Uitgangspunt: eerst simpel en uitlegbaar (Dixon-Coles op uitslagen), geen xG.

## Beslissingen die jij moet nemen (blokkerend)
| # | Keuze | Advies | Nodig voor |
|---|-------|--------|-----------|
| 1 | Competities | Eredivisie + Premier League + Bundesliga (3 stuks, uitbreiden later) | Stap 1 |
| 2 | Odds-bron voor slotkoersen | Eerst gratis tier testen (The Odds API / OddsPapi); Pinnacle-dekking en prijs eerst bij de aanbieder bevestigen | Stap 4 |
| 3 | Hosting | Web: Vercel/Fly; model + jobs: kleine VM of container met Postgres | Stap 5 |
| 4 | Licenties | Voorwaarden football-data.org en gekozen odds-bron lezen vóór commercieel gebruik | Stap 1, 4 |

## Architectuur
```
football-data.org ──► ingest (TS) ──► Postgres ◄── Next.js (bestaand)
odds-bron ─────────► odds-job (TS) ──►    ▲
                                          │ POST /internal/predictions (geheime sleutel)
historische CSV ──► model-service (Python, Dixon-Coles) 
```
- Model-service is apart (Python, penaltyblog); de keten blijft in TypeScript (`appendPrediction`), zodat er één plek is die hashes maakt.
- Alle jobs zijn idempotent (unieke `match_id`).

## Stappen
### Stap 1: Wedstrijden en uitslagen inlezen (2–3 dagen)
- Tabel `matches` (match_id, competitie, seizoen, thuis, uit, aftrap, status, uitslag).
- Job `ingest:fixtures` (elk uur) en `ingest:results` (elke 15 min rond wedstrijden) met football-data.org; rate limit 10/min respecteren, retries met backoff.
- `recordResult` vult `results` automatisch; correcties (herziene uitslagen) loggen, nooit stil overschrijven.
- Tests: opgenomen API-antwoorden als fixtures; geen live calls in CI.

### Stap 2: Model offline bouwen en toetsen (1 week)
- Historische data: football-data.co.uk CSV (voorwaarden eerst controleren) of eigen opgebouwde database.
- Dixon-Coles met tijdsverval, per competitie getraind; uitvoer = kansen H/D/A, afgerond naar basispunten (som 10000).
- Backtest met rollend venster: nooit trainen op data ná de te voorspellen wedstrijd.
- Rapport: Brier, log loss, kalibratie, en de markt als referentie. Als het model aantoonbaar slechter is dan een simpele Elo-basislijn, eerst verbeteren vóór livegang.
- Modelversie krijgt een naam (`dc-1`), want die zit in de hash.

### Stap 3: Voorspel-job (3 dagen)
- Elke 30 min: wedstrijden die over 2–24 uur beginnen en nog geen voorspelling hebben → model-service → `appendPrediction`.
- Harde regel: niets vastleggen binnen 60 min voor de aftrap (bestaande check weigert ná de aftrap al).
- Serialiseren: één schrijver tegelijk (de keten is lineair); lock via Postgres advisory lock.
- Als het model niet antwoordt: wedstrijd overslaan en zichtbaar loggen, nooit achteraf invullen. Op de pagina tonen: "X wedstrijden niet voorspeld" om selectief weglaten uit te sluiten.

### Stap 4: Slotkoersen vastleggen (3 dagen)
- Job die 5–15 min voor de aftrap de koersen ophaalt en bewaart met tijdstempel en bron (`odds_closing` bestaat al; kolom `captured_at` toevoegen).
- Eén bron, één bookmaker, vooraf vastgelegd in de methodepagina. Geen achteraf kiezen van de gunstigste vergelijking.
- Ontbrekende koersen: wedstrijd telt niet mee in de vergelijking (staat al zo in `summarize`), aantal blijft zichtbaar.

### Stap 5: Productie en bewijsvoering (3 dagen)
- Echte Postgres met `pg` in plaats van PGlite; migraties.
- Dagelijks de laatste hash extern publiceren (bijv. GitHub-gist of RSS) en op `/trackrecord` tonen. Dit maakt achteraf aanpassen door de beheerder aantoonbaar.
- Aparte databasegebruiker voor de app zonder rechten om de trigger te verwijderen.
- Monitoring: job-fouten, ontbrekende uitslagen, keten-check bij elke deploy.

### Stap 6: Methodepagina en eerlijke presentatie (2 dagen)
- `/methode`: welk model, welke data, hoe kansen worden berekend, wat Brier en log loss betekenen, beperkingen.
- Demodata verwijderen of duidelijk als "demo" scheiden; echte pagina toont pas cijfers vanaf N afgeronde wedstrijden (voorstel: 100), daarvoor een melding "te weinig data".
- Tekst blijft "kansinschatting", geen winstclaims.

## Volgorde en planning
Stap 1 → 2 (parallel met 4) → 3 → 5 → 6. Totaal ±3 weken. Pas na stap 3 loopt het echte trackrecord; houd rekening met enkele weken opbouw voordat de cijfers iets zeggen.

## Risico's
- Odds-bron is duur of mist Pinnacle → vergelijk met de beste beschikbare bron en zeg dat open op de methodepagina.
- Model scoort slechter dan de markt → publiceren zoals het is; dat is de bedoeling van het trackrecord.
- Uitval van een job rond aftrap → wedstrijd blijft zonder voorspelling, zichtbaar geteld.
- Gebruiksvoorwaarden van databronnen → vóór livegang controleren.

## Definition of done
- Nieuwe wedstrijden krijgen automatisch een voorspelling vóór de aftrap, uitslag en slotkoers volgen vanzelf.
- Ketencontrole groen in CI en na elke deploy; dagelijkse hash staat extern.
- Methodepagina live; geen demodata meer op de productiesite.
