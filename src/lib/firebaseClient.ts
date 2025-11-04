import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Using Next public envs for client
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export function getFirebaseClientApp() {
  if (!getApps().length) {
    return initializeApp(config);
  }
  return getApp();
}

export function getClientAuth() {
  const app = getFirebaseClientApp();
  return getAuth(app);
}

export function getGoogleProvider() {
  const provider = new GoogleAuthProvider();
  // Forzar selección de cuenta cada vez
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  return provider;
}
