import { getApps, getApp, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "teams-nexusforge";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

let app: App;

if (getApps().length === 0) {
  if (privateKey && clientEmail) {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    app = initializeApp({
      projectId,
    });
  }
} else {
  app = getApp();
}

export const adminAuth: Auth = getAuth(app);
export default app;
