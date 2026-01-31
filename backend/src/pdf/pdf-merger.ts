import { PDFDocument } from "pdf-lib";

/**
 * Merge multiple PDF buffers into a single PDF
 * @param pdfBuffers - Array of PDF buffers to merge
 * @returns A single merged PDF buffer
 */
export async function mergePdfs(pdfBuffers: Buffer[]): Promise<Buffer> {
  // Create a new PDF document for the merged result
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    try {
      // Load each PDF
      const pdf = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true
      });

      // Copy all pages from this PDF to the merged document
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    } catch (error) {
      console.error("Error loading PDF for merge:", error);
      // Skip this PDF if it can't be loaded
      continue;
    }
  }

  // Save the merged PDF and return as buffer
  const mergedBytes = await mergedPdf.save();
  return Buffer.from(mergedBytes);
}

/**
 * Fetch a PDF from a URL and return as buffer
 * @param url - URL to fetch the PDF from
 * @returns PDF buffer or null if failed
 */
export async function fetchPdfFromUrl(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch PDF from ${url}: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error fetching PDF from ${url}:`, error);
    return null;
  }
}
