import { supabaseAdmin } from './src/services/supabaseClient';

async function check() {
    console.log("Checking notifications table...");
    const { data, error } = await supabaseAdmin.from('notifications').select('*').limit(1);
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Table exists! Row count:", data?.length);
    }
}
check();
