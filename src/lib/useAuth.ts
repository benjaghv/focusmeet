"use client";

import { useEffect, useState } from 'react';
import { getClientAuth } from './firebaseClient';
import { onAuthStateChanged, User, getIdToken } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getClientAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function getToken(): Promise<string | null> {
    if (!user) return null;
    try {
      return await getIdToken(user, true);
    } catch {
      return null;
    }
  }

  return { user, loading, getToken };
}
