import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function run() {
    console.log("Checking work_logs table...");
    try {
        const { data: user } = await supabaseAdmin.from('user_profiles').select('id').limit(1).single();
        if (!user) {
            console.log("No users found.");
            return;
        }

        const { data: routine } = await supabaseAdmin.from('routines').select('id').eq('user_id', user.id).limit(1).single();
        if (!routine) {
            console.log("No routines found for user.");
            return;
        }

        console.log(`Attempting to insert work log for user ${user.id} against routine ${routine.id}`);
        const { error: insertError } = await supabaseAdmin.from('work_logs').insert({
            user_id: user.id,
            routine_id: routine.id,
            duration_minutes: 30,
            log_text: 'Test log from diagnostic script',
            xp_awarded: 50
        });

        if (insertError) {
            console.log("Insert Error:", insertError);
        } else {
            console.log("Insert Success!");
            // cleanup
            await supabaseAdmin.from('work_logs').delete().eq('log_text', 'Test log from diagnostic script');
        }
    } catch (err) {
        console.error("Crash:", err);
    }
}

run();
