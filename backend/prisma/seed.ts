import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting explicit seed... 🌱');

  // Hardcode passwords
  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const employeePassword = await bcrypt.hash('employee123', 10);

  // 1. Create a Company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      baseCurrency: 'USD',
    },
  });

  console.log(`Created Company: ${company.name}`);

  // 2. Create the Roles hierarchy
  const adminUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Alice (Admin)',
      email: 'admin@acme.com',
      passwordHash: adminPassword,
      role: 'Admin',
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Bob (Manager)',
      email: 'manager@acme.com',
      passwordHash: managerPassword,
      role: 'Manager',
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      companyId: company.id,
      name: 'Charlie (Employee)',
      email: 'employee@acme.com',
      passwordHash: employeePassword,
      role: 'Employee',
      managerId: managerUser.id, // Direct Reports to Bob
    },
  });

  console.log('Generated Alice (Admin), Bob (Manager), and Charlie (Employee).');

  // 3. Create Basic Categories
  const categoryTravel = await prisma.category.create({
    data: {
      companyId: company.id,
      name: 'Travel & Transportation',
      description: 'Flights, Hotels, and Uber',
    },
  });

  const categoryMeals = await prisma.category.create({
    data: {
      companyId: company.id,
      name: 'Client Meals',
      description: 'Dinner with potential contractors',
    },
  });

  console.log('Categories inserted.');

  // 4. Create an Approval Rule Flow (Standard Multi-Level)
  const standardRule = await prisma.approvalRule.create({
    data: {
      companyId: company.id,
      name: 'Standard Expense Policy',
      isManagerApproval: true, // Auto step 1: manager assigned
      minApprovalPercentage: 100, // Explicitly 100
      specialApproverId: adminUser.id, // CFO/Admin will always approve last in complicated chains
    },
  });

  // Example: If a finance guy exists, we add him as step 2. We don't have a finance guy, so just the rule exists as Manager -> Admin.
  
  console.log('Standard Approval Rule constructed successfully.');

  console.log('\n--- 🎉 Seeding complete! ---');
  console.log('You can now log in using these credentials to test the API locally:');
  console.log('📧 admin@acme.com | 🔑 admin123');
  console.log('📧 manager@acme.com | 🔑 manager123');
  console.log('📧 employee@acme.com | 🔑 employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
