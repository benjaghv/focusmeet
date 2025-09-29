import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let app: App | null = null;

export function getFirebaseApp(): App | null {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  if (!app) {
    // Algunas plataformas agregan comillas o no respetan los \n.
    // 1) Quitamos comillas envolventes si existen.
    // 2) Reemplazamos literal \\n por saltos reales \n.
    let privateKey = privateKeyRaw.trim();
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, '\n');
    const apps = getApps();
    if (apps.length) {
      app = apps[0]!;
    } else {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  }
  return app;
}

export function getDb() {
  const a = getFirebaseApp();
  if (!a) return null;
  return getFirestore(a);
}

export async function verifyRequestAndGetUid(request: Request): Promise<string | null> {
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    const authz = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authz || !authz.toLowerCase().startsWith('bearer ')) return null;
    const token = authz.split(' ')[1];
    const decoded = await getAuth(app).verifyIdToken(token);
    return decoded.uid || null;
  } catch (e) {
    console.warn('verifyRequestAndGetUid error:', e);
    return null;
  }
}
