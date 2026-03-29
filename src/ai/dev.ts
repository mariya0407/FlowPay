import { config } from 'dotenv';
config();

import '@/ai/flows/receipt-ocr-extraction.ts';
import '@/ai/flows/expense-fraud-detection.ts';