import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
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

const prisma = new PrismaClient();

async function addAdminUser() {
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

    // Add the user to the User table using Prisma
    const user = await prisma.user.create({
      data: {
        id: adminUser.id,
        email: adminUser.email,
        role: 'admin',
        name: adminUser.user_metadata?.name || 'Chris Odom'
      }
    });

    console.log('Successfully added admin user to User table:', user);

    // Update user metadata with role
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: { role: 'admin' }
      }
    );

    if (updateError) {
      throw updateError;
    }

    console.log('Successfully updated user metadata with admin role');

  } catch (error) {
    console.error('Error adding admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addAdminUser();
