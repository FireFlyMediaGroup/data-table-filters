import { PrismaClient, DocumentStatus } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  // First get or create a test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin'
    },
  });

  // Create some test documents
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        title: 'POWRA Test Document',
        content: 'This is a POWRA test document content',
        status: 'PENDING',
        userId: user.id
      }
    }),
    prisma.document.create({
      data: {
        title: 'FPL Mission Report',
        content: 'This is a FPL_MISSION test document content',
        status: 'APPROVED',
        userId: user.id
      }
    }),
    prisma.document.create({
      data: {
        title: 'Tailboard Meeting Notes',
        content: 'This is a TAILBOARD test document content',
        status: 'DRAFT',
        userId: user.id
      }
    })
  ]);

  console.log('Seeded test documents:', documents);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
