import admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

export function initializeFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log("🔥 Firebase Admin SDK initialized successfully");
    return firebaseApp;
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

export async function verifyFirebaseToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  const app = getFirebaseAdmin();
  return app.auth().verifyIdToken(idToken);
}

export async function getFirebaseUser(uid: string): Promise<admin.auth.UserRecord> {
  const app = getFirebaseAdmin();
  return app.auth().getUser(uid);
}
