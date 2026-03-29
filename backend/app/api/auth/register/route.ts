import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    // Parse the request body — frontend sends { companyName, baseCurrency, user: { name, email, password } }
    const body = await req.json();
    const { companyName, baseCurrency } = body;
    const { name, email, password } = body.user || {};

    // Validate required fields
    if (!companyName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a user with the given email already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use a transaction to create both the Company and the User atomically
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the Company first
      const company = await tx.company.create({
        data: {
          name: companyName,
          baseCurrency: baseCurrency || 'USD',
        },
      });

      // Create the Admin User and link it to the Company
      const adminUser = await tx.user.create({
        data: {
          name: name || email, // Fall back to email if no name provided
          email,
          passwordHash: hashedPassword,
          companyId: company.id,
        },
      });

      return { company, adminUser };
    });

    // Return the created company and user as the response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // Log the error for debugging
    console.error('Error in /auth/register:', error);

    // Return a generic error response
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}