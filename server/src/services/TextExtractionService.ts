import path from "node:path";
import * as fs from "node:fs/promises";
import { createWorker } from "tesseract.js";
import { pdf } from "pdf-to-img";

export interface TextExtractionResult {
  fullText: string;
  filePath: string;
  wordCount: number;
  pageCount: number;
}

export interface TextExtractionOptions {
  scale?: number;
  saveToFile?: boolean;
  outputDir?: string;
}

/**
 * Service for extracting text from PDF files using OCR (Optical Character Recognition).
 * This service processes PDF files, extracts text from each page, and optionally saves the full text to a file.
 */
export class TextExtractionService {
  /**
   * Default options for text extraction.
   * - `scale`: Scaling factor for rendering PDF pages as images (default: 3).
   * - `wordLimit`: Maximum number of words to include in the preview text (default: 1000).
   * - `saveToFile`: Whether to save the full extracted text to a file (default: true).
   * - `outputDir`: Directory where the extracted text file will be saved (default: "./tmp").
   */
  private readonly defaultOptions: Required<TextExtractionOptions> = {
    scale: 3,
    saveToFile: true,
    outputDir: "./tmp",
  };

  /**
   * Extracts text from a PDF file.
   *
   * @param pdfPath - The path to the PDF file to process.
   * @param options - Optional configuration for text extraction.
   * @returns A promise that resolves to a `TextExtractionResult` containing the extracted text and metadata.
   *
   * @throws An error if the text extraction process fails.
   */
  async extractTextFromPdf(
    pdfPath: string,
    options: TextExtractionOptions = {}
  ): Promise<TextExtractionResult> {
    const config = { ...this.defaultOptions, ...options };

    try {
      const doc = await pdf(pdfPath, { scale: config.scale });
      const worker = await createWorker("eng");

      const fullChunks: string[] = [];
      let pageCount = 0;

      // Iterate ALL pages (async iterator yields every page)
      for await (const pngBuffer of doc as AsyncIterable<Buffer>) {
        pageCount++;
        const { data } = await worker.recognize(pngBuffer);
        const text = (data.text || "").trim();

        // Accumulate full text (no limit)
        fullChunks.push(text);

        console.log(`Processed page ${pageCount}...`);
      }

      await worker.terminate();

      const fullText = fullChunks.join("\n\n").trim();

      let filePath = "";

      // Save full text to file if requested
      if (config.saveToFile) {
        filePath = await this.saveTextToFile(fullText, config.outputDir);
      }

      return {
        fullText,
        filePath,
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
        pageCount,
      };
    } catch (error) {
      console.error("Text extraction error:", error);
      throw new Error(
        `Failed to extract text from PDF: ${(error as Error).message}`
      );
    }
  }

  /**
   * Saves the extracted text to a file.
   *
   * @param text - The text to save.
   * @param outputDir - The directory where the file will be saved.
   * @returns A promise that resolves to the path of the saved file.
   *
   * @throws An error if the file cannot be saved.
   */
  private async saveTextToFile(
    text: string,
    outputDir: string
  ): Promise<string> {
    try {
      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `extracted_text_${timestamp}.txt`;
      const filepath = path.resolve(outputDir, filename);

      await fs.writeFile(filepath, text || "(no text recognized)", "utf-8");
      console.log(`Full text saved to: ${filepath}`);

      return filepath;
    } catch (error) {
      console.error("Failed to save text file:", error);
      throw new Error(`Failed to save text file: ${(error as Error).message}`);
    }
  }

  /**
   * Cleans up a file by deleting it from the filesystem.
   *
   * @param filePath - The path to the file to delete.
   * @returns A promise that resolves when the file is deleted.
   *
   * @remarks This method ignores errors if the file cannot be deleted.
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore cleanup errors
      console.warn(`Failed to cleanup file ${filePath}:`, error);
    }
  }
}
