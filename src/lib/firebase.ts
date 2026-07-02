import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  linkWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { UserProfile } from "../types";
let firebaseConfig: any = {};

try {
  // Try to load local config if it exists
  // @ts-ignore
  firebaseConfig = await import("../../firebase-applet-config.json").then(m => m.default || m);
} catch (e) {
  // Fallback to environment variables for hosting platforms like Vercel
  firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  };
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Workspace scopes
export const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/chat.spaces.readonly");
provider.addScope("https://www.googleapis.com/auth/chat.messages.create");
provider.addScope("https://www.googleapis.com/auth/tasks");
provider.addScope("https://www.googleapis.com/auth/tasks.readonly");

// Token Caching & Auth Handling
let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    let result;
    if (auth.currentUser) {
      try {
        console.log("Linking current user with Google provider...");
        result = await linkWithPopup(auth.currentUser, provider);
      } catch (linkError: any) {
        if (linkError.code === "auth/credential-already-in-use" || String(linkError).includes("already-in-use")) {
          console.warn("Google account already linked to another user. Signing in directly...");
          result = await signInWithPopup(auth, provider);
        } else {
          throw linkError;
        }
      }
    } else {
      result = await signInWithPopup(auth, provider);
    }
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Firebase Auth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    const isPopupError = error?.code === "auth/popup-closed-by-user" || 
                         error?.code === "auth/cancelled-popup-request" ||
                         String(error).includes("popup-closed-by-user") ||
                         String(error).includes("cancelled-popup-request");
    if (isPopupError) {
      console.warn("Google popup closed or blocked:", error);
    } else {
      console.error("Sign in error:", error);
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const emailPasswordSignIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes("invalid-credential") || errMsg.includes("user-not-found") || errMsg.includes("wrong-password")) {
      console.warn("Email sign in warning (user credential error):", errMsg);
    } else {
      console.error("Email sign in error:", error);
    }
    throw error;
  }
};

export const emailPasswordSignUp = async (email: string, password: string, displayName: string): Promise<User | null> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential.user;
  } catch (error: any) {
    const errMsg = error?.message || String(error);
    if (errMsg.includes("email-already-in-use") || errMsg.includes("weak-password")) {
      console.warn("Email sign up warning (user form error):", errMsg);
    } else {
      console.error("Email sign up error:", error);
    }
    throw error;
  }
};

export const sendFirebasePasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Firebase reset password error:", error);
    throw error;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Standard Firestore Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  const errCode = (error as any)?.code;
  
  const isPermission = 
    errCode === "permission-denied" || 
    errMessage.toLowerCase().includes("permission") ||
    errMessage.toLowerCase().includes("denied") ||
    errMessage.toLowerCase().includes("insufficient");

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isPermission) {
    console.error("Firestore Error Detailed info: ", JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    console.warn("[Firestore System Warning] Non-permission error encountered:", errMessage, { operationType, path });
    throw new Error(errMessage);
  }
}

// User Profile Database Helpers
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, "users", uid);
  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as UserProfile;
      try {
        localStorage.setItem(`aahar_user_profile_${uid}`, JSON.stringify(data));
      } catch (e) {
        console.warn("localStorage write failed:", e);
      }
      return data;
    }
    // Check local storage fallback
    const cached = localStorage.getItem(`aahar_user_profile_${uid}`);
    if (cached) {
      try {
        return JSON.parse(cached) as UserProfile;
      } catch (e) {
        return null;
      }
    }
    return null;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    } catch (e) {
      console.warn("Supressed Firestore throw to prevent application crash during offline/network failure.");
    }
    // Fallback to localStorage
    const cached = localStorage.getItem(`aahar_user_profile_${uid}`);
    if (cached) {
      try {
        return JSON.parse(cached) as UserProfile;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

export async function saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
  const userRef = doc(db, "users", uid);
  try {
    try {
      localStorage.setItem(`aahar_user_profile_${uid}`, JSON.stringify(profile));
    } catch (e) {
      console.warn("localStorage write failed:", e);
    }
    await setDoc(userRef, profile);
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    } catch (e) {
      console.warn("Supressed Firestore throw to prevent application crash during offline/network failure.");
    }
  }
}
