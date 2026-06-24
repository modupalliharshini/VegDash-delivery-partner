import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Handle env parameters safely for both process (node/expo) and import.meta (vite)
const supabaseUrl = (typeof process !== 'undefined' && process.env ? process.env.EXPO_PUBLIC_SUPABASE_URL : '') || 
                    (import.meta && import.meta.env ? import.meta.env.VITE_SUPABASE_URL : '') || 
                    'https://bwdvvplizodfqaadzkoi.supabase.co';

const supabaseAnonKey = (typeof process !== 'undefined' && process.env ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY : '') || 
                       (import.meta && import.meta.env ? import.meta.env.VITE_SUPABASE_ANON_KEY : '') || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3ZHZ2cGxpem9kZnFhYWR6a29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTY3MjEsImV4cCI6MjA5NzA3MjcyMX0.i0exihijo72rvMtEB6lMa2BzGw1uYCc8QnZznIOvrhM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
