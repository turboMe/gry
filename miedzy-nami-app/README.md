<p align="center">
  <img src="public/icons/icon-192.png" alt="Między Nami logo" width="100" />
</p>

<h1 align="center">🎭 Między Nami</h1>

<p align="center">
  <strong>Interaktywna gra komunikacyjna inspirowana psychologią relacji</strong>
</p>

<p align="center">
  <a href="https://nextjs.org"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" /></a>
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19" /></a>
  <a href="https://firebase.google.com"><img src="https://img.shields.io/badge/Firebase-Firestore%20%2B%20Auth-ffca28?logo=firebase" alt="Firebase" /></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript" alt="TypeScript" /></a>
</p>

---

## 🌐 Graj online

> **Link do aplikacji.**
>
🔗 **[https://miedzy-nami.vercel.app](https://miedzy-nami.vercel.app)**

---

## 📖 Czym jest Między Nami?

**Między Nami** to mobilna gra / symulator komunikacji, w której wcielasz się w jedną z postaci i podejmujesz decyzje wpływające na przebieg rozmowy oraz relację z drugą osobą. Każdy wybór ma konsekwencje — gra dynamicznie dobiera warianty scen na podstawie Twoich dotychczasowych odpowiedzi, a na końcu otrzymujesz spersonalizowaną diagnozę psychologiczną i wskazówki rozwojowe.

Gra czerpie inspirację z uznanych modeli komunikacji:
- 🧠 **Model von Thuna** — cztery płaszczyzny komunikatu
- 💚 **Porozumienie bez Przemocy (NVC)** — empatyczna komunikacja Marshalla Rosenberga
- 🔄 **Analiza Transakcyjna** — dynamika relacji Rodzic–Dorosły–Dziecko

### ✨ Główne funkcje

| Funkcja | Opis |
|---|---|
| 🎬 **Dynamiczne warianty scen** | Od drugiej interakcji sceny rozgałęziają się na wersje *low* i *high* w zależności od zdobytych punktów |
| 📊 **System metryk relacji** | Zaufanie, szacunek, bliskość — Twoje metryki zmieniają się z każdym wyborem |
| 🏆 **Spersonalizowane zakończenia** | 3–4 zakończenia z unikalną diagnozą i wskazówkami post-game |
| 📱 **PWA — zainstaluj jak apkę** | Pełna obsługa offline, instalacja na ekranie głównym (iOS i Android) |
| 🔐 **Logowanie lub tryb gość** | Firebase Auth — możesz zalogować się lub grać anonimowo |
| 🛡️ **Panel administracyjny** | Zarządzanie scenariuszami, statystyki i monitoring platformy |

### 🎮 Przykładowe scenariusze

- *„Brudne naczynia"* — granice w obowiązkach domowych
- *„Kiedy milczenie kosztuje więcej niż wiadomość"* — emocjonalna wrażliwość vs defensywność
- *„Nigdy nie dzwonisz"* — konflikt rodzic–dziecko o kontakt i autonomię
- *„Sekret, który wyszedł poza was"* — złamane zaufanie między przyjaciółmi
- *„Szef krytykuje"* — radzenie sobie z krytyką w środowisku zawodowym

---


## 🧑‍💻 Informacja o projekcie

> **Między Nami** jest projektem hobbystycznym, rozwijanym w wolnych chwilach — z pasji do psychologii komunikacji i tworzenia gier. Tempo rozwoju zależy od dostępnego czasu, ale projekt jest stale rozwijany i ulepszany. 🚧

---

## 🤝 Współpraca i Open Source

**Kod źródłowy jest otwarty** — zezwalam na rozwijanie, modyfikowanie i eksperymentowanie z projektem **bez mojej wiedzy i zgody**. Możesz swobodnie:

- 🍴 **Forkować** repozytorium i rozwijać własną wersję
- 🐛 **Zgłaszać błędy** przez Issues
- 💡 **Proponować zmiany** przez Pull Requesty
- 🧪 **Eksperymentować** z mechaniką gry i scenariuszami

### 📬 Kontakt

Jeśli chciałbyś **współpracować nad rozwojem aplikacji**, skontaktuj się ze mną:

📧 **karczespatryk@gmail.com**

Chętnie porozmawiam o pomysłach, ulepszeniach i kierunku rozwoju projektu!

---

<p align="center">
  Zrobione z ❤️ i odrobiną psychologii
</p>


## 🛠️ Stos technologiczny

| Warstwa | Technologia |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + CSS |
| Język | [TypeScript 5](https://www.typescriptlang.org) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Walidacja | [Zod](https://zod.dev) |
| Backend/DB | [Firebase](https://firebase.google.com) (Firestore + Auth + Admin SDK) |
| PWA | Service Worker + Web App Manifest |
| Hosting | [Vercel](https://vercel.com) |

---

## 🚀 Uruchomienie lokalne

Repozytorium **nie zawiera** plików wrażliwych (klucze, tokeny, konfiguracja środowiskowa) — są one wymienione w `.gitignore`. Poniżej znajdziesz instrukcję, jak postawić projekt u siebie od zera.

### Wymagania

- **Node.js** 18+ ([pobierz](https://nodejs.org))
- **npm** (dostarczany z Node.js)
- Konto **Firebase** z projektem ([console.firebase.google.com](https://console.firebase.google.com))

### 1. Sklonuj repozytorium

```bash
git clone https://github.com/turboMe/miedzy-nami-app.git
cd miedzy-nami-app
```

### 2. Zainstaluj zależności

```bash
npm install
```

### 3. Skonfiguruj zmienne środowiskowe

Skopiuj przykładowy plik konfiguracji i uzupełnij go swoimi danymi z Firebase Console:

```bash
cp .env.example .env.local
```

Otwórz `.env.local` i uzupełnij wartości:

```env
# Firebase — znajdziesz w Firebase Console > Ustawienia projektu > Ogólne
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=twoj-projekt.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=twoj-projekt
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=twoj-projekt.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# URL aplikacji
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Adresy e-mail administratorów (oddzielone przecinkami)
ADMIN_EMAILS=twoj@email.com
```

### 4. Skonfiguruj Firebase Service Account *(opcjonalne — do funkcji admina)*

Jeśli chcesz korzystać z panelu administracyjnego i seedowania Firestore:

1. Przejdź do **Firebase Console → Ustawienia projektu → Konta usługi**
2. Kliknij **„Wygeneruj nowy klucz prywatny"**
3. Zapisz pobrany plik jako `service-account.json` w katalogu głównym projektu

> ⚠️ **Nigdy nie commituj tego pliku** — jest on domyślnie dodany do `.gitignore`.

### 5. Włącz wymagane usługi Firebase

W [Firebase Console](https://console.firebase.google.com) upewnij się, że masz włączone:

- **Authentication** — z dostawcą *Email/Password* i/lub *Anonymous*
- **Cloud Firestore** — baza danych w trybie produkcyjnym

### 6. Uruchom serwer deweloperski

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem **[http://localhost:3000](http://localhost:3000)** 🎉

### Przydatne komendy

| Komenda | Opis |
|---|---|
| `npm run dev` | Serwer deweloperski (hot-reload) |
| `npm run build` | Budowanie wersji produkcyjnej |
| `npm run start` | Uruchomienie zbudowanej wersji |
| `npm run lint` | Sprawdzenie kodu ESLint |

---

## 🗂️ Struktura projektu

```
miedzy-nami-app/
├── public/              # Zasoby statyczne (manifest, ikony, scenariusze JSON)
├── scripts/             # Skrypty pomocnicze (seedowanie bazy)
├── src/
│   ├── app/
│   │   ├── (auth)/      # Strony logowania i rejestracji
│   │   ├── (game)/      # Główna mechanika gry (menu, rozgrywka)
│   │   ├── (admin)/     # Panel administracyjny
│   │   └── api/         # API Routes (Next.js)
│   ├── components/      # Komponenty React
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Biblioteki (Firebase, walidatory, silnik gry)
│   └── store/           # Zustand — globalny stan aplikacji
├── .env.example         # Szablon zmiennych środowiskowych
├── firestore.rules      # Reguły bezpieczeństwa Firestore
├── next.config.ts       # Konfiguracja Next.js
├── package.json         # Zależności i skrypty
└── tsconfig.json        # Konfiguracja TypeScript
```

---

<p align="center">
  Zrobione z ❤️ i odrobiną psychologii
</p>
