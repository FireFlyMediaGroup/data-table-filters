import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.local') });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase URL or service role key');
    process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});
async function seedUsers() {
    const users = [
        { email: 'wearefireflymedia@gmail.com', password: 'R0yalflu5h!', role: 'admin' },
        // Add more users as needed
    ];
    for (const user of users) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { role: user.role },
        });
        if (error) {
            console.error(`Error creating user ${user.email}:`, error.message);
        }
        else {
            console.log(`User created: ${user.email} with role: ${user.role}`);
            // Set custom claims for role-based access control
            const { error: claimsError } = await supabase.rpc('set_claim', {
                uid: data.user.id,
                claim: 'role',
                value: user.role,
            });
            if (claimsError) {
                console.error(`Error setting role for ${user.email}:`, claimsError.message);
            }
            else {
                console.log(`Role set for ${user.email}: ${user.role}`);
            }
        }
    }
}
seedUsers()
    .catch(console.error)
    .finally(() => process.exit(0));
