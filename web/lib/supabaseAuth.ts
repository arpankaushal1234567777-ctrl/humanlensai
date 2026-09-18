import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';
import { getSupabaseCredentials } from './supabaseClient';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseAuthClient(): SupabaseClient {
  if (supabaseClientInstance) return supabaseClientInstance;

  const { supabaseUrl, supabaseAnonKey } = getSupabaseCredentials();

  // Fallback defaults for build or uninitialized states
  const url = supabaseUrl || 'https://oybxycvcaqtdjckrkxfa.supabase.co';
  const key = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95Ynh5Y3ZjYXF0ZGpja3JreGZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjY4NjAsImV4cCI6MjEwNTI0Mjg2MH0.hWNTSjwn-aUoE7zCyyQLaSocfuSQrvnzzuyHfgCPiig';

  supabaseClientInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClientInstance;
}

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName || email.split('@')[0]
      }
    }
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabaseAuthClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
}

export async function signOutUser() {
  const supabase = getSupabaseAuthClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseAuthClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}
