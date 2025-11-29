import { supabase } from "@/integrations/supabase/client";

export const signUp = async (email: string, password: string, displayName?: string) => {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        display_name: displayName || email.split('@')[0]
      }
    }
  });
  
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const checkUserRole = async (userId: string, role: 'admin' | 'super_admin') => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', role)
    .maybeSingle();
  
  return { hasRole: !!data, error };
};

export const getUserRoles = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  return { roles: data?.map(r => r.role) || [], error };
};
