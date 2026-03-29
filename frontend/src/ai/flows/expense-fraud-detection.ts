'use server';
/**
 * @fileOverview An AI agent for detecting potential fraud in expense claims.
 *
 * - detectExpenseFraud - A function that handles the expense fraud detection process.
 * - ExpenseFraudDetectionInput - The input type for the detectExpenseFraud function.
 * - ExpenseFraudDetectionOutput - The return type for the detectExpenseFraud function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpenseFraudDetectionInputSchema = z.object({
  expenseDetails: z.object({
    amount: z.number().describe('The amount of the expense.'),
    category: z.string().describe('The category of the expense (e.g., travel, meals, office supplies).'),
    description: z.string().describe('A brief description of the expense.'),
    date: z.string().describe('The date of the expense in YYYY-MM-DD format.'),
    merchant: z.string().describe('The name of the merchant where the expense occurred.'),
  }).describe('Details of the expense claim.'),
  receiptDataUri: z
    .string()
    .describe(
      "A photo of the expense receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExpenseFraudDetectionInput = z.infer<typeof ExpenseFraudDetectionInputSchema>;

const ExpenseFraudDetectionOutputSchema = z.object({
  isFraudulent: z.boolean().describe('True if the expense is flagged as potentially fraudulent, false otherwise.'),
  fraudReason: z.string().describe('A detailed explanation if the expense is flagged as fraudulent.'),
  unusualPatterns: z.array(z.string()).describe('A list of any unusual patterns or discrepancies detected, even if not directly fraudulent.'),
});
export type ExpenseFraudDetectionOutput = z.infer<typeof ExpenseFraudDetectionOutputSchema>;

export async function detectExpenseFraud(input: ExpenseFraudDetectionInput): Promise<ExpenseFraudDetectionOutput> {
  return expenseFraudDetectionFlow(input);
}

const expenseFraudDetectionPrompt = ai.definePrompt({
  name: 'expenseFraudDetectionPrompt',
  input: {schema: ExpenseFraudDetectionInputSchema},
  output: {schema: ExpenseFraudDetectionOutputSchema},
  prompt: `You are an AI fraud detection expert. Your task is to analyze expense claims and their associated receipt images for any potential fraudulent activity or unusual patterns.

Carefully compare the provided expense details with the information visible in the receipt image. Look for discrepancies in amount, date, merchant name, item descriptions, and any signs of alteration or unusual activity.

Expense Details:
- Amount: {{{expenseDetails.amount}}}
- Category: {{{expenseDetails.category}}}
- Description: {{{expenseDetails.description}}}
- Date: {{{expenseDetails.date}}}
- Merchant: {{{expenseDetails.merchant}}}

Receipt Image: {{media url=receiptDataUri}}

Based on your analysis, determine if the claim is potentially fraudulent. Provide a concise reason if it is, and list any unusual patterns or discrepancies you observe, even if they don't immediately indicate fraud.`,
});

const expenseFraudDetectionFlow = ai.defineFlow(
  {
    name: 'expenseFraudDetectionFlow',
    inputSchema: ExpenseFraudDetectionInputSchema,
    outputSchema: ExpenseFraudDetectionOutputSchema,
  },
  async input => {
    const {output} = await expenseFraudDetectionPrompt(input);
    return output!;
  }
);
