import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('--- SIGNUP REQUEST RECEIVED ---');
    console.log('Payload:', JSON.stringify(body, null, 2));

    const { companyName, userName, email, password, baseCurrency } = body;

    if (!companyName || !userName || !email || !password) {
      console.warn('Signup failed: Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if user exists globally
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Using transaction to create both Company and User atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create Company First
      const company = await tx.company.create({
        data: {
          name: companyName,
          baseCurrency: baseCurrency || 'USD',
        },
      });

      // Then create Admin User and link to Company
      const adminUser = await tx.user.create({
        data: {
          companyId: company.id,
          name: userName,
          email,
          passwordHash: hashedPassword,
          role: 'Admin',
        },
      });

      // Remove sensitive data before returning
      const { passwordHash, ...userWithoutPassword } = adminUser;

      return { company, user: userWithoutPassword };
    });

    return NextResponse.json(
      { message: 'Company and Admin created successfully', data: result },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
