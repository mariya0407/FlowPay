import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRequest } from '@/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Admins can modify users.' }, { status: 403 });
    }

    const targetUserId = parseInt(params.id, 10);
    const { role, managerId } = await req.json();

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, companyId: userSession.companyId }
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Validate if manager exists and belongs to the company
    if (managerId) {
      const manager = await prisma.user.findFirst({
        where: { id: managerId, companyId: userSession.companyId }
      });
      if (!manager) {
        return NextResponse.json({ error: 'Invalid manager' }, { status: 400 });
      }
      
      // Prevent assigning self as manager
      if (managerId === targetUserId) {
         return NextResponse.json({ error: 'User cannot be their own manager' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        role: role || undefined,
        managerId: managerId !== undefined ? managerId : undefined // null removes the manager
      }
    });

    // Strip password hashes
    const { passwordHash, ...safeUser } = updatedUser;

    return NextResponse.json({ message: 'User updated successfully', data: safeUser }, { status: 200 });
  } catch (error) {
    console.error('Update User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Admins can delete users.' }, { status: 403 });
    }

    const targetUserId = parseInt(params.id, 10);

    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, companyId: userSession.companyId }
    });

    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.user.delete({ where: { id: targetUserId } });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete User Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
