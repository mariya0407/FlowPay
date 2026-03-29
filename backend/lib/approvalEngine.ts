import { prisma } from '@/lib/prisma';

export async function processExpenseApprovalChain(expenseId: number, companyId: number, submitterId: number, ruleIdToApply?: number) {
  try {
    // Determine which rule to use. Pick the one passed, or fallback to the first company rule
    let activeRule;
    if (ruleIdToApply) {
      activeRule = await prisma.approvalRule.findFirst({
        where: { id: ruleIdToApply, companyId },
        include: { approvers: { orderBy: { stepOrder: 'asc' } } }
      });
    } else {
      activeRule = await prisma.approvalRule.findFirst({
        where: { companyId },
        include: { approvers: { orderBy: { stepOrder: 'asc' } } }
      });
    }

    // If no rules exist, maybe auto-approve or leave pending for admin
    if (!activeRule) {
      console.log(`No rules found for Company ${companyId}. Marking pending.`);
      return;
    }

    // Link the rule to the Expense
    await prisma.expense.update({
      where: { id: expenseId },
      data: { ruleId: activeRule.id }
    });

    let currentStepOffset = 1;

    // 1. Is Manager Approval enabled? (Dynamically resolved at submission)
    if (activeRule.isManagerApproval) {
      const submitter = await prisma.user.findUnique({ where: { id: submitterId } });
      if (submitter?.managerId) {
        await prisma.expenseApproval.create({
          data: {
            expenseId,
            approverId: submitter.managerId,
            stepOrder: currentStepOffset,
            status: 'Pending'
          }
        });
        currentStepOffset++;
      }
    }

    // 2. Linear Step Sequence
    for (const ruleApprover of activeRule.approvers) {
      await prisma.expenseApproval.create({
        data: {
          expenseId,
          approverId: ruleApprover.approverId,
          stepOrder: currentStepOffset,
          status: 'Pending'
        }
      });
      currentStepOffset++;
    }

    // 3. Conditional / Special Approver Bypass could also be handled here
    // Example: If amount > certain budget, add special approver as the final step
    // In our simplified version, if specialApproverId exists, add them at the end.
    if (activeRule.specialApproverId) {
      // Ideally we check condition against expense.convertedAmount here 
      // For simple demonstration, let's treat it as the final override layer.
      await prisma.expenseApproval.create({
        data: {
          expenseId,
          approverId: activeRule.specialApproverId,
          stepOrder: currentStepOffset,
          status: 'Pending'
        }
      });
    }

    return activeRule;
  } catch (err) {
    console.error('Error generating approval chain:', err);
    throw err;
  }
}
