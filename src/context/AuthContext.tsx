import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from 'react';
import { supabase } from '../services/supabase';
import { Session, User } from '@supabase/supabase-js';

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  // añade más columnas si existen
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
};

type AuthContextType = AuthState & {
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setSession: (payload: { session: Session | null; profile: Profile | null }) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /* 🔄 Recuperar perfil */
  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (!error) setProfile(data as Profile);
  };

  /* ▶️  Al montar, chequea sesión */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSessionState(data.session);
      setUser(data.session?.user ?? null);
      if (data.session) fetchProfile(data.session.user.id);
      setLoading(false);
    });

    /* 🔔 Listener */
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, sess) => {
        setSessionState(sess);
        setUser(sess?.user ?? null);
        if (sess) fetchProfile(sess.user.id);
        else setProfile(null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  /* 🟢 registro */
  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error };
  };

  /* 🟢 login */
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error && data.session) {
      await fetchProfile(data.session.user.id);
    }
    return { error };
  };

  /* 🔌 logout */
  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  /* 🔄 refrescar perfil (opcional) */
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  /* Actualizar sesión y perfil */
  const setSession = (payload: { session: Session | null; profile: Profile | null }) => {
    setSessionState(payload.session);
    setUser(payload.session?.user ?? null);
    setProfile(payload.profile);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}