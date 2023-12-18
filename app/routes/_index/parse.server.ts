import p from "papaparse";
import {
  unstable_composeUploadHandlers,
  unstable_createFileUploadHandler,
} from "@remix-run/node";
import fs from "node:fs/promises";

const allowedMimeTypes = {
  csv: "text/csv",
};

type UploadedFile = {
  filepath: string;
  type: string;
};

export interface UberEatsOrder {
  Territory: string;
  "Restaurant ID": string;
  "Order ID": string;
  "Order Time": string;
  "Order Status": string;
  "Item Name": string;
  Customizations: string;
  "Special Instructions": string;
  "Item Price": string;
  "Order Price": string;
  Currency: string;
}

export function isUploadedFile(file: unknown): file is UploadedFile {
  return (file as UploadedFile) != null;
}

export async function convertCsvToJson(
  csvPath: string
): Promise<UberEatsOrder[]> {
  const csvFilePath = await fs.readFile(csvPath);
  const csvData = csvFilePath.toString();
  return new Promise((resolve) => {
    p.parse(csvData, {
      header: true,
      complete: (results) => {
        console.log(`Parsed ${results.data.length} records successfully.`);
        resolve(results.data as UberEatsOrder[]);
      },
    });
  });
}

export async function removeTempFile(path: string) {
  try {
    await fs.rm(path);
  } catch (error) {
    console.error(`Error removing temp file: ${error}`);
  }
}

export const uploadHandler = unstable_composeUploadHandlers(
  unstable_createFileUploadHandler({
    maxPartSize: 5_000_000,
    file: ({ filename }) => `tmp/${filename}`,
    filter: ({ contentType }) =>
      Object.values(allowedMimeTypes).includes(contentType),
  })
);
