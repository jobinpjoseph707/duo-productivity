import { supabaseAdmin } from './src/services/supabaseClient';

async function testInsert() {
    console.log("Testing insert into notifications table...");
    // Just fetch any user id to test with
    const { data: users } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (!users || users.length === 0) {
        console.error("No users found to test with.");
        return;
    }
    const userId = users[0].id;

    const { data, error } = await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        type: 'test_routine',
        title: 'Test Notification from Backend',
        message: 'This is a test notification.',
        external_id: 'test-backend-insert-1'
    }).select();

    if (error) {
        console.error("Insert failed:", error.message, error.details, error.hint);
    } else {
        console.log("Insert success! Data:", data);
    }
}
testInsert();
