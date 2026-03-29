import { NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { verifyRequest } from '@/backend/lib/auth';

export async function POST(req: Request) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Admins can create rules.' }, { status: 403 });
    }

    const { name, isManagerApproval, minApprovalPercentage, specialApproverId, approvers } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Rule name is required' }, { status: 400 });
    }

    // Wrap in transaction to ensure rule and sequence are cohesive
    const rule = await prisma.$transaction(async (tx) => {
      const newRule = await tx.approvalRule.create({
        data: {
          companyId: userSession.companyId,
          name,
          isManagerApproval: isManagerApproval || false,
          minApprovalPercentage: minApprovalPercentage || 100.00,
          specialApproverId: specialApproverId || null,
        },
      });

      // Insert strict sequence mapping if applicable
      if (approvers && Array.isArray(approvers)) {
        await Promise.all(
          approvers.map(async (approver) => {
            await tx.ruleApprover.create({
              data: {
                ruleId: newRule.id,
                approverId: approver.approverId,
                stepOrder: approver.stepOrder,
              },
            });
          })
        );
      }
      return newRule;
    });

    return NextResponse.json({ message: 'Rule created successfully', data: rule }, { status: 201 });
  } catch (error) {
    console.error('Create Rule Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const rules = await prisma.approvalRule.findMany({
      where: { companyId: userSession.companyId },
      include: {
        approvers: {
          include: { approver: { select: { name: true, role: true } } },
          orderBy: { stepOrder: 'asc' },
        },
        specialApprover: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({ data: rules }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
