import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

function createPrismaClient() {
  console.log("Creating new Prisma client");
  console.log("Database URL:", process.env.DATABASE_URL ? "Set" : "Not set");
  
  const client = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL
      }
    }
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

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  if (!global.prisma) {
    console.log("Initializing development Prisma client");
    global.prisma = createPrismaClient();
  } else {
    console.log("Reusing existing Prisma client");
  }
  prisma = global.prisma;
}

export default prisma;
