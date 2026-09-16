# Soccercards

## LoganGroeit — MVP v1

`index.html` is een self-contained webapp (HTML + CSS + vanilla JS, geen dependencies,
geen backend) om na elke wedstrijd in een paar seconden vast te leggen of het een
leuke wedstrijd was.

- openen: dubbelklik `index.html`, of zet 'm op een statische host
- data staat in `localStorage` van de browser (key `logangroeit.matches.v1`) —
  geen login, geen server, niets verlaat het toestel
- mobiel-first (max 420px), bedoeld om op je telefoon aan je beginscherm toe te voegen

Schermen: invoer (datum + optionele tegenstander + 3 emoji-knoppen) → optionele
notitie → overzicht → detail/bewerken, met daarin de optionele uitgebreide observatie.
