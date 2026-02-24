import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client (bypasses RLS) — for server-side operations
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

// Create a per-request client that uses the user's JWT (respects RLS)
export function createUserClient(accessToken: string): SupabaseClient {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
    });
}
