import { getApps, getApp, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "teams-nexusforge";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

let cachedAuth: Auth | null = null;

export function getAdminAuth(): Auth | null {
  if (cachedAuth) return cachedAuth;
  if (!clientEmail || !privateKey) {
    return null;
  }

  try {
    let app: App;
    if (getApps().length === 0) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      app = getApp();
    }
    cachedAuth = getAuth(app);
    return cachedAuth;
  } catch (err) {
    console.warn("Firebase Admin SDK initialization skipped (no service account):", err);
    return null;
  }
}

// Fallback proxy to maintain backwards compatibility without throwing on import
export const adminAuth = new Proxy({} as Auth, {
  get(_target, prop) {
    const authInstance = getAdminAuth();
    if (!authInstance) {
      throw new Error(
        "Firebase Admin SDK service account credentials not configured in environment."
      );
    }
    return (authInstance as any)[prop];
  },
});

export default null;
