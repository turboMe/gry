// ═══════════════════════════════════════════════════════════
//  FIREBASE ADMIN SDK — Server-side initialization
//  Used in API routes for auth verification and Firestore.
// ═══════════════════════════════════════════════════════════

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

let app: App;
let adminAuth: Auth;
let adminDb: Firestore;

function initAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
  } else {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    // Priority 1: GOOGLE_APPLICATION_CREDENTIALS env var (standard Firebase way)
    // Priority 2: Service account JSON file at project root
    // Priority 3: Inline JSON from env var
    // Priority 4: Auto-detect (Firebase Hosting / Cloud Run)

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Standard Firebase env var — Admin SDK picks it up automatically
      app = initializeApp({ projectId });
    } else {
      // Try loading from service-account.json file
      try {
        const saPath = join(process.cwd(), 'service-account.json');
        const saContent = readFileSync(saPath, 'utf-8');
        const serviceAccount = JSON.parse(saContent);
        app = initializeApp({ credential: cert(serviceAccount), projectId });
        console.log('✅ Firebase Admin initialized with service-account.json');
      } catch {
        // Try inline JSON from env var
        if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
          app = initializeApp({ credential: cert(serviceAccount), projectId });
          console.log('✅ Firebase Admin initialized with env var');
        } else {
          // Auto-detect (works in Firebase Hosting, Cloud Run)
          app = initializeApp({ projectId });
          console.log('⚠️ Firebase Admin initialized without credentials (auto-detect)');
        }
      }
    }
  }

  adminAuth = getAuth(app);
  adminDb = getFirestore(app);
}

// Initialize on first import
initAdmin();

export { adminAuth, adminDb };
