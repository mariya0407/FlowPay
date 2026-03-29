import { prisma } from './lib/prisma';

async function test() {
  try {
    console.log('Testing Prisma connection...');
    const count = await prisma.user.count();
    console.log('User count:', count);
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

test();
