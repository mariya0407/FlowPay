import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRequest } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const userSession = verifyRequest(req);

    if (!userSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { companyId: userSession.companyId },
    });

    return NextResponse.json({ data: categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userSession = verifyRequest(req);

    // Only Admin or Manager should ideally define categories, depending on business logic, but let's restrict to Admin
    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Admins can create categories.' }, { status: 403 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        companyId: userSession.companyId,
        name,
        description,
      },
    });

    return NextResponse.json({ message: 'Category created', data: category }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
