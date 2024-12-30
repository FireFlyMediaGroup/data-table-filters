import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateAdminPassword() {
  try {
    // First, get the user's ID from Supabase Auth
    const { data: userData, error: userError } = await supabase
      .auth.admin.listUsers();

    if (userError) {
      throw userError;
    }

    const adminUser = userData.users.find(user => user.email === 'chris.odom@skyspecs.com');
    
    if (!adminUser || !adminUser.email) {
      throw new Error('Admin user not found in Supabase Auth');
    }

    console.log('Found admin user:', {
      id: adminUser.id,
      email: adminUser.email
    });

    // Update the user's password
    const newPassword = 'Admin@123'; // You should change this after first login
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      { password: newPassword }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('Successfully updated password. Please use these credentials to log in:');
    console.log('Email:', adminUser.email);
    console.log('Password:', newPassword);
    console.log('\nIMPORTANT: Please change your password after logging in for the first time.');

  } catch (error) {
    console.error('Error updating admin password:', error);
    process.exit(1);
  }
}

updateAdminPassword();
