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

