import type { ExportType } from "@/lib/types/app.types";

export interface ExportData {
  convenioName: string;
  convenioCnpj: string;
  dateFrom: string;
  dateTo: string;
  rows: ExportRow[];
  totalValue: number;
}

export interface ExportRow {
  saleId: string;
  storeName: string;
  conveniadoName: string;
  conveniadoCpf: string;
  saleDate: string;
  totalValue: number;
  installments: string;
  status: string;
}

export interface ExportImageData extends ExportData {
  images: {
    saleId: string;
    conveniadoName: string;
    saleDate: string;
    storagePath: string;
    signedUrl: string;
    installmentNumber: number | null;
  }[];
}

export type { ExportType };
