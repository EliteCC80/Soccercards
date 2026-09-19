# LoganGroeit

Persoonlijke app om na elke voetbalwedstrijd van Logan in twee taps vast te leggen
hoe leuk hij het vond. Geen account, geen server, geen statistiekgedoe.

## Wat het is

Een offline-first PWA (gewoon HTML/CSS/JS). Alle wedstrijden staan lokaal op het
toestel in `localStorage` — er gaat niets naar een server.

## Schermen

- **Hoofdscherm** — knop "Nieuwe wedstrijd" + de laatste 3 ratings
- **Rating-scherm** — datum (standaard vandaag), tegenstander (optioneel),
  emoji-schaal 1–5, kort notitieveld (optioneel)
- **Tijdlijn** — alle wedstrijden chronologisch (nieuwste eerst), met gemiddelde

Kernreis: hoofdscherm → "Nieuwe wedstrijd" → emoji tikken (tap 1) → opslaan (tap 2)
→ terug naar hoofdscherm met bevestiging. Een item in de tijdlijn aantikken opent
het opnieuw om te bewerken of te verwijderen.

## Datamodel

Eén platte lijst `wedstrijden`, per record:

| Veld | Type | Verplicht | Default |
|---|---|---|---|
| `id` | UUID | ja | auto |
| `datum` | `YYYY-MM-DD` | ja | vandaag |
| `tegenstander` | string (max 60) | nee | leeg |
| `fun_rating` | integer 1–5 | ja | — |
| `notitie` | string (max 280) | nee | leeg |
| `aangemaakt_op` | ISO-timestamp | ja | auto |

Validatie: `fun_rating` moet 1–5 zijn, `datum` mag niet in de toekomst liggen.
Corrupte of geblokkeerde opslag levert een lege lijst op in plaats van een crash.

## Lokaal draaien

```sh
python3 -m http.server 8000 --directory app
# open http://localhost:8000
```

## Op je telefoon zetten

De app is een PWA; er is geen app store nodig.

1. Zet de map `app/` op een https-adres (bijv. GitHub Pages: repo → Settings →
   Pages → branch + map `/app`).
2. Open die URL op je telefoon.
3. iPhone: deel-knop → "Zet op beginscherm". Android: menu → "App installeren".

Daarna start hij als los app-icoon en werkt hij ook zonder netwerk.
Let op: de gegevens staan in de browseropslag van dat toestel — data wissen van
de site wist ook de wedstrijden.

## Tests

```sh
node test/store.test.js
```

Dekt: wegschrijven/uitlezen, sortering, bewerken, verwijderen, validatie
(rating 1–5, datum niet in de toekomst) en corrupte opslag.
