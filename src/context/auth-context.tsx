import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/types/database';

type AuthContextValue = {
  session: Session | null;
  /** Rol guardado en `profiles.role`; null mientras se consulta o si no hay sesión. */
  role: AppRole | null;
  /** true mientras se recupera la sesión guardada en el dispositivo. */
  loading: boolean;
  /** admin o agenda_manager: pueden ver el panel de administración. */
  isStaff: boolean;
  signOut: () => Promise<void>;
  /**
   * true si alguien inició sesión con una cuenta que NO es de administrador: la sesión se cerró
   * sola (la app solo tiene cuentas para el equipo). El login lo usa para mostrar el aviso.
   */
  accessDenied: boolean;
  clearAccessDenied: () => void;
};

/** Roles con acceso: solo el equipo de la asociación tiene cuenta en la app. */
const STAFF_ROLES: AppRole[] = ['admin', 'agenda_manager'];

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  // Guardamos a qué usuario pertenece el rol para no mostrar el rol de una sesión anterior.
  const [roleState, setRoleState] = useState<{ userId: string; role: AppRole | null } | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  // 1) Recupera la sesión guardada y escucha inicios/cierres de sesión.
  useEffect(() => {
    if (!supabase) return;
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) Alert.alert('No se pudo recuperar la sesión', error.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // 2) Cuando hay usuario, consulta su rol. Va en un efecto aparte porque Supabase
  //    recomienda no hacer consultas dentro de onAuthStateChange.
  const userId = session?.user.id;
  useEffect(() => {
    if (!supabase || !userId) return;
    let mounted = true;

    supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        const row = data as { role: AppRole } | null;
        const role = error ? null : row?.role ?? null;
        setRoleState({ userId, role });
        // Los usuarios usan la app sin cuenta; si entra una cuenta que no es del equipo, se cierra.
        if (!error && !(role && STAFF_ROLES.includes(role))) {
          setAccessDenied(true);
          supabase?.auth.signOut(); // cierra la sesión también en el servidor
        }
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  const role = userId && roleState?.userId === userId ? roleState.role : null;

  const value = useMemo<AuthContextValue>(() => ({
    session,
    role,
    loading,
    isStaff: Boolean(role && STAFF_ROLES.includes(role)),
    signOut: async () => {
      if (!supabase) return;
      const { error } = await supabase.auth.signOut();
      if (error) Alert.alert('No se pudo cerrar la sesión', error.message);
    },
    accessDenied,
    clearAccessDenied: () => setAccessDenied(false),
  }), [session, role, loading, accessDenied]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
