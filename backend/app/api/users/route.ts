import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { verifyRequest } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const userSession = verifyRequest(req);

    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Admins can create users.' }, { status: 403 });
    }

    const { name, email, password, role, managerId } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Roles are now dynamically string-based, bypassing strict enum validation where the Admin dictates the string.

    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Manager validation if provided
    if (managerId) {
      const manager = await prisma.user.findFirst({
        where: { 
          id: managerId, 
          companyId: userSession.companyId 
        },
      });
      if (!manager) {
        return NextResponse.json({ error: 'Invalid manager assignment' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        companyId: userSession.companyId,
        name,
        email,
        passwordHash: hashedPassword,
        role,
        managerId: managerId || null,
      },
    });

    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json(
      { message: 'User created successfully', data: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userSession = verifyRequest(req);

    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get('role'); // ?role=Manager

    const users = await prisma.user.findMany({
      where: {
        companyId: userSession.companyId,
        ...(roleFilter ? { role: roleFilter as any } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ data: users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
