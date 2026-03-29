import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRequest } from '@/lib/auth';
import { processExpenseApprovalChain } from '@/lib/approvalEngine';

export async function POST(req: Request) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, merchant, categoryId, amount, currency, description, expenseDate, ocrData } = await req.json();

    if (!name || !categoryId || !amount || !currency || !expenseDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get Company Base Currency
    const company = await prisma.company.findUnique({
      where: { id: userSession.companyId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    let convertedAmount = amount;
    const baseCurrency = company.baseCurrency;

    // Fetch exchange rate if employee submits in a different currency
    if (currency !== baseCurrency) {
      try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
        const data = await res.json();

        const rate = data.rates[currency];
        if (rate) {
          // Converted Amount corresponds to the value of the expense in the COMPANY'S Base Currency.
          // Since rate is Base -> Currency, base equivalent is Amount / rate
          convertedAmount = amount / rate;
        }
      } catch (err) {
        console.error('Exchange rate fetch failed, falling back to 1:1', err);
        return NextResponse.json({ error: 'Currency conversion service unavailable' }, { status: 503 });
      }
    }

    const expense = await prisma.$transaction(async (tx) => {
      // 1. Create the Expense
      const newExpense = await tx.expense.create({
        data: {
          userId: userSession.userId,
          companyId: userSession.companyId,
          categoryId: parseInt(categoryId, 10),
          ruleId: null, // Will be linked properly in Phase 4 (Rule Engine)
          name,
          merchant,
          amount,
          currency,
          convertedAmount,
          description,
          expenseDate: new Date(expenseDate),
          status: 'Pending',
        },
      });

      // 2. Attach Receipt if OCR / files were provided
      if (ocrData) {
        await tx.receipt.create({
          data: {
            expenseId: newExpense.id,
            fileUrl: ocrData.fileUrl || '', // Mock URL, typically S3
            ocrData: ocrData.rawJson,
          },
        });
      }

      return newExpense;
    });

    // 🌟 Trigger the Approval Engine to construct the live expenseApproval chain
    await processExpenseApprovalChain(expense.id, userSession.companyId, userSession.userId);

    return NextResponse.json({ message: 'Expense submitted successfully', data: expense }, { status: 201 });
  } catch (error) {
    console.error('Expense Submission Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const userSession = verifyRequest(req);
    if (!userSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const expenses = await prisma.expense.findMany({
      where: {
        userId: userSession.userId,
        companyId: userSession.companyId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        receipt: true,
      }
    });

    return NextResponse.json({ data: expenses }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
