import { NextResponse } from 'next/server';
import { prisma } from '@/backend/lib/prisma';
import { verifyRequest } from '@/backend/lib/auth';
import { logAudit } from '@/backend/lib/audit';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expenseId = parseInt(params.id, 10);
    const { action, comments } = await req.json();

    if (!['Approve', 'Reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be Approve or Reject' }, { status: 400 });
    }

    const pendingStep = await prisma.expenseApproval.findFirst({
      where: {
        expenseId,
        approverId: userSession.userId,
        status: 'Pending',
      },
      orderBy: { stepOrder: 'asc' },
    });

    if (!pendingStep) {
      return NextResponse.json({ error: 'You do not have a pending approval step for this expense' }, { status: 403 });
    }

    const earlierPendingSteps = await prisma.expenseApproval.count({
      where: {
        expenseId,
        stepOrder: { lt: pendingStep.stepOrder },
        status: 'Pending',
      },
    });

    if (earlierPendingSteps > 0 && action === 'Approve') {
      if (userSession.role !== 'Admin') {
        return NextResponse.json({ error: 'Awaiting earlier approvers in the sequence' }, { status: 403 });
      }
    }

    const actedStatus = action === 'Approve' ? 'Approved' : 'Rejected';

    const updatedStep = await prisma.expenseApproval.update({
      where: { id: pendingStep.id },
      data: {
        status: actedStatus,
        comments,
        actedAt: new Date(),
      },
    });

    // 🌟 Record Audit Log for the Step Action
    await logAudit({
      companyId: userSession.companyId,
      userId: userSession.userId,
      action: action === 'Approve' ? 'APPROVE' : 'REJECT',
      entityType: 'ExpenseApproval',
      entityId: pendingStep.id,
      oldData: { status: 'Pending' },
      newData: { status: actedStatus, comments },
    });

    if (action === 'Reject') {
      const oldExpense = await prisma.expense.findUnique({ where: { id: expenseId } });
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: { status: 'Rejected' },
      });
      // 🌟 Audit Log for Expense Rejection
      await logAudit({
        companyId: userSession.companyId,
        userId: userSession.userId,
        action: 'UPDATE', // Or REJECT
        entityType: 'Expense',
        entityId: expenseId,
        oldData: { status: oldExpense?.status },
        newData: { status: 'Rejected' },
      });
    } else {
      const remainingPending = await prisma.expenseApproval.count({
        where: { expenseId, status: 'Pending' },
      });

      const totalApprovers = await prisma.expenseApproval.count({ where: { expenseId } });
      const approvedCount = await prisma.expenseApproval.count({ where: { expenseId, status: 'Approved' } });
      const approvalPercentage = (approvedCount / totalApprovers) * 100;

      const expenseEntity = await prisma.expense.findUnique({
        where: { id: expenseId },
        include: { rule: true }
      });

      const oldExpense = expenseEntity;

      const minPercentage = expenseEntity?.rule?.minApprovalPercentage
        ? Number(expenseEntity.rule.minApprovalPercentage)
        : 100;

      let nextStatus: any = 'InProgress';

      // 🌟 PDF Guidelines: specific approver rule (e.g., If CFO approves -> Expense auto-approved)
      if (expenseEntity?.rule?.specialApproverId === userSession.userId && action === 'Approve') {
        nextStatus = 'Approved';
      }
      // 🌟 PDF Guidelines: Percentage rule (e.g., If 60% approve -> Expense approved)
      else if (approvalPercentage >= minPercentage) {
        nextStatus = 'Approved';
      }
      else if (remainingPending === 0) {
        nextStatus = 'Approved';
      }

      await prisma.expense.update({
        where: { id: expenseId },
        data: { status: nextStatus },
      });

      if (oldExpense && oldExpense.status !== nextStatus) {
        await logAudit({
          companyId: userSession.companyId,
          userId: userSession.userId,
          action: 'UPDATE',
          entityType: 'Expense',
          entityId: expenseId,
          oldData: { status: oldExpense.status },
          newData: { status: nextStatus },
        });
      }
    }

    return NextResponse.json({ message: `Successfully ${actedStatus} the expense` }, { status: 200 });
  } catch (error) {
    console.error('Approval Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
