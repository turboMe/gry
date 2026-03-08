# Między Nami — Symulator Relacji

## Interaktywny komiks psychologiczny o komunikacji w relacjach

### Jak uruchomić
1. Otwórz `index.html` w przeglądarce (Chrome/Safari/Firefox)
2. Gra działa bez serwera — wystarczy podwójne kliknięcie na plik
3. Najlepsze wrażenia na telefonie (375px+)

### Struktura plików
```
miedzy-nami/
├── index.html              ← Silnik gry (wszystko w jednym pliku)
├── scenarios/
│   └── brudne_naczynia.json ← Przykładowy scenariusz (format referencyjny)
└── README.md
```

### Jak dodać nowy scenariusz
1. Stwórz plik JSON zgodny ze schematem (patrz `scenarios/brudne_naczynia.json`)
2. W konsoli przeglądarki wywołaj:
   ```js
   loadExternalScenario('sciezka/do/twojego_scenariusza.json')
   ```
3. Lub dodaj scenariusz do tablicy `EMBEDDED_SCENARIOS` w kodzie źródłowym

### Funkcjonalności silnika
- **Quiz profilowy** — 8 cech psychologicznych gracza (impulsywność, cierpliwość, defensywność, empatia, potrzeba kontroli, wrażliwość na wstyd, bezpośredniość, zdolność naprawy)
- **Ładowanie scenariuszy z JSON** — walidacja schematu + kompatybilności tagów
- **4 metryki w czasie rzeczywistym** — napięcie, zaufanie, otwartość, poczucie bycia słuchanym
- **System zakończeń** — red/yellow/green na podstawie sumy punktów
- **Feedback psychologiczny** — etykieta + wyjaśnienie + wskazówka po każdym wyborze
- **Reakcje NPC** — wyświetlane po każdym wyborze gracza
- **Save system** — localStorage z graceful degradation
- **Statystyki** — historia sesji, średni wynik, rozkład zakończeń
- **Efekty wizualne** — particles, screen shake, score popup, confetti
- **Canvas scene rendering** — dynamiczne tła z nastrojem sceny
- **Tag validator** — twarde blokady kompatybilności (parent+romance = REJECT)
- **Profil ewoluuje** — cechy gracza aktualizują się po każdej sesji
- **Touch-first** — 48px touch targets, responsive, portrait-first

### Schema JSON scenariusza
Pełna dokumentacja schematu znajduje się w komentarzach kodu źródłowego oraz w pliku GDD.
Kluczowe pola: `scenario_id`, `metadata`, `tags`, `characters`, `metrics_start`, `interactions[]`, `endings[]`, `post_game`.

### Stack
HTML5 + CSS3 + Vanilla JavaScript — zero zależności zewnętrznych (oprócz Google Fonts CDN).
