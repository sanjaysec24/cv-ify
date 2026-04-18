import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  setPersistence,
  browserLocalPersistence,
  type User,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getFirebaseAuth, getDb, googleProvider } from "@/lib/firebase";

type AuthCtx = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = getFirebaseAuth();
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function signInWithGoogle() {
    const auth = getFirebaseAuth();
    const result = await signInWithPopup(auth, googleProvider);
    const u = result.user;
    try {
      await setDoc(
        doc(getDb(), "users", u.uid),
        {
          uid: u.uid,
          name: u.displayName ?? "",
          email: u.email ?? "",
          photoURL: u.photoURL ?? "",
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("Failed to upsert user doc:", e);
    }
  }

  async function logout() {
    await signOut(getFirebaseAuth());
  }

  return (
    <Ctx.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
