'use server';
/**
 * @fileOverview An AI agent that extracts expense details from a receipt image.
 *
 * - extractReceiptDetails - A function that handles the receipt detail extraction process.
 * - ExtractReceiptDetailsInput - The input type for the extractReceiptDetails function.
 * - ExtractReceiptDetailsOutput - The return type for the extractReceiptDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractReceiptDetailsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractReceiptDetailsInput = z.infer<
  typeof ExtractReceiptDetailsInputSchema
>;

const ExtractReceiptDetailsOutputSchema = z.object({
  vendor: z.string().describe('The name of the vendor or merchant.'),
  amount: z.number().describe('The total amount of the expense, as a number.'),
  date: z
    .string()
    .describe(
      "The date of the transaction in 'YYYY-MM-DD' format, or an empty string if not found."
    ),
  category: z.string().describe('The category of the expense (e.g., Food, Travel, Office Supplies).'),
  description: z.string().optional().describe('A brief description of the expense, if available.'),
});
export type ExtractReceiptDetailsOutput = z.infer<
  typeof ExtractReceiptDetailsOutputSchema
>;

export async function extractReceiptDetails(
  input: ExtractReceiptDetailsInput
): Promise<ExtractReceiptDetailsOutput> {
  return extractReceiptDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractReceiptDetailsPrompt',
  input: {schema: ExtractReceiptDetailsInputSchema},
  output: {schema: ExtractReceiptDetailsOutputSchema},
  prompt: `You are an expert at extracting expense details from receipt images.
Your task is to accurately identify and extract the vendor name, total amount, transaction date, and a suitable category from the provided receipt image. If a description is available, extract that too.

For the date, prioritize the transaction date. Format the date as 'YYYY-MM-DD'. If no date is found, return an empty string.
For the category, choose from common expense categories like Food, Travel, Office Supplies, Utilities, Entertainment, etc. Infer the best category based on the receipt content.
For the amount, extract the total amount as a numerical value.

Receipt Image: {{media url=photoDataUri}}`,
});

const extractReceiptDetailsFlow = ai.defineFlow(
  {
    name: 'extractReceiptDetailsFlow',
    inputSchema: ExtractReceiptDetailsInputSchema,
    outputSchema: ExtractReceiptDetailsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
