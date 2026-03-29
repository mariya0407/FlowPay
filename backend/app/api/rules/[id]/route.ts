import { NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { verifyRequest } from '@/backend/lib/auth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession || userSession.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized. Only Admins can modify rules.' }, { status: 403 });
    }

    const ruleId = parseInt(params.id, 10);
    const { name, isManagerApproval, minApprovalPercentage, specialApproverId, approvers } = await req.json();

    const existingRule = await prisma.approvalRule.findUnique({ where: { id: ruleId } });
    if (!existingRule || existingRule.companyId !== userSession.companyId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    // Process update in a transaction
    const updatedRule = await prisma.$transaction(async (tx) => {
      // 1. Update core fields mapping to the Logic Controls
      const rule = await tx.approvalRule.update({
        where: { id: ruleId },
        data: {
          name: name || existingRule.name,
          isManagerApproval: isManagerApproval !== undefined ? isManagerApproval : existingRule.isManagerApproval,
          minApprovalPercentage: minApprovalPercentage !== undefined ? minApprovalPercentage : existingRule.minApprovalPercentage,
          specialApproverId: specialApproverId !== undefined ? specialApproverId : existingRule.specialApproverId,
        },
      });

      // 2. If the sequential approvers array was provided, wipe the old sequence and apply the new one
      if (approvers && Array.isArray(approvers)) {
        await tx.ruleApprover.deleteMany({ where: { ruleId } });

        await Promise.all(
          approvers.map(async (approver) => {
            await tx.ruleApprover.create({
              data: {
                ruleId,
                approverId: approver.approverId,
                stepOrder: approver.stepOrder,
              },
            });
          })
        );
      }

      return rule;
    });

    return NextResponse.json({ message: 'Protocol updated successfully', data: updatedRule }, { status: 200 });
  } catch (error) {
    console.error('Update Rule Error:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const ruleId = parseInt(params.id, 10);

    // Ensure rule exists and belongs to company
    const rule = await prisma.approvalRule.findFirst({
      where: { id: ruleId, companyId: userSession.companyId }
    });

    if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

    await prisma.approvalRule.delete({ where: { id: ruleId } });

    return NextResponse.json({ message: 'Rule deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Delete Rule Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
