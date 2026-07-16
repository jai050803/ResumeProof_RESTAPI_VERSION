const pdfParse = require('pdf-parse');
import { AppError } from '../errors/AppError';

export const extractTextFromPdfBuffer = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF Parse Error:', error);
    throw new AppError('pdf_text_extraction_failed', 400);
  }
};
