import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser 
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let googleProvider: GoogleAuthProvider | null = null;

export function initializeFirebase(): { app: FirebaseApp; auth: Auth; googleProvider: GoogleAuthProvider } {
  if (app && auth && googleProvider) {
    return { app, auth, googleProvider };
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  
  googleProvider.addScope("email");
  googleProvider.addScope("profile");

  return { app, auth, googleProvider };
}

export async function signInWithGoogle(): Promise<{ user: FirebaseUser; idToken: string }> {
  const { auth, googleProvider } = initializeFirebase();
  
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  
  return { user: result.user, idToken };
}

export async function signOutUser(): Promise<void> {
  const { auth } = initializeFirebase();
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const { auth } = initializeFirebase();
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
}

export { type FirebaseUser };
