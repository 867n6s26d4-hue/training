# Garagepasset

Träningslogg och intervalltimer för hemmaträning (pass A/B/C, 3 dagar i veckan). Lokal-först PWA: all data ligger i telefonen (IndexedDB), med JSON-export som säkerhetskopia.

- Styrka: förifyllda vikter från förra passet, dubbel progression (+2,5 kg överkropp, +5 kg underkropp), vilotimer, skivräknare, deload.
- HIIT: EMOM, intervaller och AMRAP med beep och 3-2-1-nedräkning.
- Ljud: HTMLAudio-element med `navigator.audioSession = 'ambient'` så att beepen blandas med musik (verifierat i fas 0-tester på iPhone, Safari 26).

## Utveckling

```
npm install
npm run dev      # lokal server
npm test         # enhetstester (logik, timer, databas)
npm run build    # typkontroll + produktionsbygge i dist/
```

## Publicering (Cloudflare)

Build command: `npm run build`, output directory: `dist`. Koppla repot under Workers & Pages så publiceras varje push på samma adress.

## HIIT-banken

`src/data/metcons.ts` innehåller 22 pass i fem format: På tid, AMRAP, EMOM, E2MOM och intervaller.
Varje passdag får en pool (`hiitPool` i `program.ts`) där formaten varvas, och pass som krockar med
dagens baslyft (`avoid`) sorteras bort. Lägg till ett pass genom att lägga till en rad i `METCONS`;
testerna kontrollerar format, längd och att inga lyft över huvudet eller löpning smugit sig in.
