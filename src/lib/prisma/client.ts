import { PrismaClient, Prisma } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'

// Augment the NodeJS global type
declare global {
  var prisma: PrismaClient | undefined
}

function createPrismaClient() {
  console.log("Creating new Prisma client");
  console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
  
  // Create Prisma client
  const client = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
      }
    }
  });

  // Add middleware to handle auth headers
  client.$use(async (params: Prisma.MiddlewareParams, next) => {
    try {
      // Get auth token from request context
      const headers = (params.args as any)?.headers || {};
      const authHeader = headers.Authorization;
      
      if (authHeader) {
        // Pass through existing auth header
        params.args = {
          ...params.args,
          headers: {
            ...headers
          }
        };
      }
      
    } catch (error) {
      console.error("Error getting auth session:", error);
    }

    return next(params);
  });

  // Log connection details
  console.log("Database connection details:");
  console.log("- POSTGRES_PRISMA_URL present:", !!process.env.POSTGRES_PRISMA_URL);
  console.log("- DATABASE_URL present:", !!process.env.DATABASE_URL);
  console.log("- Using URL:", process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL);

  // Test the connection with retry logic and better error handling
  const maxRetries = 3;
  let currentTry = 0;

  async function tryConnect() {
    console.log(`Connection attempt ${currentTry + 1} of ${maxRetries}`);
    try {
      console.log("Attempting database connection...");
      await client.$connect();
      
      // Test the connection with a simple query
      const result = await client.$queryRaw`SELECT 1`;
      console.log("Test query result:", result);
      
      console.log("Successfully connected to database");
      return true;
    } catch (error: any) {
      console.error(`Connection attempt ${currentTry + 1} failed:`, error);
      console.error("Error name:", error.name);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Stack trace:", error.stack);
      
      if (currentTry < maxRetries - 1) {
        currentTry++;
        const delay = currentTry * 2000;
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return tryConnect();
      }
      
      console.error("All connection attempts failed");
      console.error("Last error:", error);
      return false;
    }
  }

  tryConnect().catch(console.error);
  return client;
}

// Initialize Prisma Client
const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
