import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

const ALLOWED = (import.meta.env.VITE_ALLOWED_EMAILS as string)
  .split(',')
  .map((e: string) => e.trim().toLowerCase());

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        const email = u.email?.toLowerCase() ?? '';
        if (ALLOWED.includes(email)) {
          setUser(u);
          setDenied(false);
        } else {
          // Sign them back out immediately
          signOut(auth);
          setUser(null);
          setDenied(true);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    setDenied(false);
    await signInWithPopup(auth, googleProvider);
  };

  const signOutUser = () => {
    setDenied(false);
    signOut(auth);
  };

  return { user, loading, denied, signIn, signOut: signOutUser };
}
