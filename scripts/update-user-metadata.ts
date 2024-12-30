import { createClient, User as SupabaseUser } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAdminUrl || !supabaseAdminKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase admin client for auth operations
const adminAuthClient = createClient(supabaseAdminUrl, supabaseAdminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}).auth.admin;

// Create Prisma client
const dbClient = new PrismaClient();

async function updateUserMetadata() {
  try {
    // Get all users from the database using Prisma
    const users = await dbClient.user.findMany({
      select: {
        id: true,
        role: true,
        email: true
      }
    });

    console.log(`Found ${users.length} users to update`);

    // Update each user's metadata with their role
    for (const user of users) {
      console.log(`Updating user ${user.id} with role ${user.role}`);
      
      try {
        // Try to get the user by email first
        const { data: { users: existingUsers }, error: listError } = await adminAuthClient.listUsers();
        const matchingUsers = existingUsers.filter((u: SupabaseUser) => u.email === user.email);

        if (listError) {
          console.error(`Error listing users for ${user.email}:`, listError);
          continue;
        }

        if (matchingUsers.length === 0) {
          // User doesn't exist, create them
          const { data: createData, error: createError } = await adminAuthClient.createUser({
            email: user.email || `user-${user.id}@example.com`,
            password: Math.random().toString(36).slice(-8), // Random password
            email_confirm: true,
            user_metadata: { role: user.role }
          });

          if (createError) {
            console.error(`Error creating user ${user.id}:`, createError);
            continue;
          }

          console.log(`Successfully created user ${user.id}`);
        } else {
          // User exists, update their metadata
          const existingUser = existingUsers[0];
          const { error: updateError } = await adminAuthClient.updateUserById(
            existingUser.id,
            { user_metadata: { role: user.role } }
          );

          if (updateError) {
            console.error(`Error updating user ${user.id}:`, updateError);
            continue;
          }

          console.log(`Successfully updated user ${user.id}`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
        continue;
      }
    }

    console.log('Successfully updated user metadata');
  } catch (error) {
    console.error('Error updating user metadata:', error);
    process.exit(1);
  } finally {
    await dbClient.$disconnect();
  }
}

updateUserMetadata();
