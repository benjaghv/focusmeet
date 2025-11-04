"use client";

import { useCallback, useEffect, useState } from 'react';
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

  const getToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await getIdToken(user);
    } catch {
      return null;
    }
  }, [user]);

  return { user, loading, getToken };
}
