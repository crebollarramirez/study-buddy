import { Request, Response, Router } from "express";
import multer from "multer";
import path from "node:path";
import { TextExtractionService } from "../services/TextExtractionService";

const upload = multer({ dest: "uploads/" });
const textExtractionService = new TextExtractionService();

export const createBookRouter = () => {
  const router = Router();

  router.post(
    "/upload",
    upload.single("book"),
    async (req: Request, res: Response) => {
      if (!req.file) return res.status(400).send("No file uploaded.");
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).send("File must be a PDF.");
      }

      const pdfPath = path.resolve(req.file.path);

      try {
        // Use the TextExtractionService to process the PDF
        const result = await textExtractionService.extractTextFromPdf(pdfPath, {
          scale: 3,
          saveToFile: true,
          outputDir: "./tmp",
        });

        console.log(
          `Processed ${result.pageCount} pages, extracted ${result.wordCount} words`
        );

        res.json({ status: "success", message: "pdf processed correctly" });
      } catch (err) {
        console.error(err);
        res
          .status(500)
          .json({ error: "OCR failed", details: (err as Error).message });
      } finally {
        // Clean up the uploaded file
        await textExtractionService.cleanupFile(pdfPath);
      }
    }
  );

  return { router };
};
