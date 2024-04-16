import { NextRequest, NextResponse } from "next/server"; // To handle the request and response
import { promises as fs } from "fs"; // To save the file temporarily
import { v4 as uuidv4 } from "uuid"; // To generate a unique filename
import PDFParser from "pdf2json"; // To parse the pdf

export async function POST(req: NextRequest) {
  const formData: FormData = await req.formData();
  // console.log("🚀 ~ POST ~ formData:", formData);
  const uploadedFiles = formData.getAll("title");
  console.log("🚀 ~ POST ~ uploadedFiles:", uploadedFiles);

  if (uploadedFiles && uploadedFiles.length > 0) {
    const uploadedFile = uploadedFiles[1];

    // Check if uploadedFile is of type File
    if (typeof uploadedFile !== "string") {
      // Generate a unique filename
      const fileName = uuidv4();

      // Convert the uploaded file into a temporary file
      const tempFilePath = `/tmp/${fileName}.pdf`;

      // Convert ArrayBuffer to Buffer
      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());

      // Save the buffer as a file
      await fs.writeFile(tempFilePath, fileBuffer);

      const parsedText = await new Promise((resolve, reject) => {
        const pdfParser = new (PDFParser as any)(null, 1);
        pdfParser.on("pdfParser_dataError", (errData: any) =>
          reject(errData.parserError)
        );
        pdfParser.on("pdfParser_dataReady", () => {
          // console.log((pdfParser as any).getRawTextContent());
          const text = (pdfParser as any).getRawTextContent();
          resolve(text);
        });

        pdfParser.loadPDF(tempFilePath);
      });

      return NextResponse.json(
        {
          message: "Customer list retrieved successfully",
          status: 200,
          data: parsedText,
        },

        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      );

      // See pdf2json docs for more info on how the below works.
    }
  }
}
