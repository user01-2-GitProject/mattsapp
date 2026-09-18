import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDocFromServer,
  Firestore
} from "firebase/firestore";
import {
  getAuth,
  Auth,
  User,
  UserInfo
} from "firebase/auth";

export const getFirebaseConfig = () => ({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "(default)"
});

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType | string,
  path?: string | null,
  authRef?: Auth | { currentUser?: User | null } | null
) {
  const currentUser = authRef && 'currentUser' in authRef ? authRef.currentUser : null;
  // SECURITY: Omit sensitive PII (user email addresses) from error logs to prevent log leakage.
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path: path || null,
    authInfo: {
      userId: currentUser?.uid || null,
      emailVerified: currentUser?.emailVerified || null,
      isAnonymous: currentUser?.isAnonymous || null,
      tenantId: currentUser?.tenantId || null,
      providerInfo: currentUser?.providerData?.map((p: UserInfo) => ({
        providerId: p.providerId
      })) || []
    }
  };
  console.error("Firestore Error:", JSON.stringify(errInfo));
  return errInfo;
}

export function initFirebaseService(customApiKey?: string, customProjectId?: string): {
  db: Firestore | null;
  auth: Auth | null;
} {
  const envConfig = getFirebaseConfig();
  const apiKey = customApiKey || envConfig.apiKey;
  const projectId = customProjectId || envConfig.projectId;

  if (!apiKey || !projectId) {
    return { db: null, auth: null };
  }

  try {
    const mergedConfig = {
      ...envConfig,
      apiKey,
      projectId,
      authDomain: envConfig.authDomain || `${projectId}.firebaseapp.com`
    };

    const app = getApps().length ? getApp() : initializeApp(mergedConfig);
    const db = mergedConfig.firestoreDatabaseId && mergedConfig.firestoreDatabaseId !== "(default)"
      ? getFirestore(app, mergedConfig.firestoreDatabaseId)
      : getFirestore(app);
    const auth = getAuth(app);

    getDocFromServer(doc(db, "test", "connection")).catch((err) => {
      if (err instanceof Error && err.message.includes("the client is offline")) {
        console.warn("Firestore offline check:", err.message);
      }
    });

    return { db, auth };
  } catch (err) {
    console.error("Firebase init error:", err);
    return { db: null, auth: null };
  }
}
