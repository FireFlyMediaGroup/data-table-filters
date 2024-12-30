import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env file
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseAdminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAdminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseAdminUrl || !supabaseAdminKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const adminClient = createClient(supabaseAdminUrl, supabaseAdminKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupRLS() {
  try {
    // Read the SQL file
    const sqlPath = resolve(process.cwd(), 'scripts', 'setup-rls.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    // Split the SQL content into chunks that won't exceed Supabase's limit
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each chunk
    for (const sql of sqlStatements) {
      await adminClient.rpc('execute_sql', {
        sql: sql + ';'
      });
    }

    console.log('Successfully set up RLS policies');
  } catch (error) {
    console.error('Error setting up RLS:', error);
    process.exit(1);
  }
}

setupRLS();
