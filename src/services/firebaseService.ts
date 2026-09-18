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
import firebaseConfig from "../../firebase-applet-config.json";

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
  const apiKey = customApiKey || firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || "";
  const projectId = customProjectId || firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || "";

  if (!apiKey || !projectId) {
    return { db: null, auth: null };
  }

  try {
    const mergedConfig = {
      ...firebaseConfig,
      apiKey,
      projectId,
      authDomain: `${projectId}.firebaseapp.com`
    };

    const app = getApps().length ? getApp() : initializeApp(mergedConfig);
    const db = (mergedConfig as any).firestoreDatabaseId
      ? getFirestore(app, (mergedConfig as any).firestoreDatabaseId)
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
