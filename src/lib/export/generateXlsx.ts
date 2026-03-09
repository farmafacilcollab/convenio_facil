"use client";

import * as XLSX from "xlsx";
import type { ExportData } from "./index";
import { formatBRL } from "@/lib/utils/currency";

export function generateXlsx(data: ExportData): Blob {
  const wb = XLSX.utils.book_new();

  // Header rows
  const headerRows = [
    ["FarmaFácil Convênios — Relatório de Vendas"],
    [],
    ["Convênio:", data.convenioName],
    ["CNPJ:", data.convenioCnpj],
    ["Período:", `${data.dateFrom} a ${data.dateTo}`],
    ["Total Vendas:", data.rows.length],
    ["Valor Total:", formatBRL(data.totalValue)],
    [],
  ];

  // Table headers
  const tableHeaders = [
    "Loja",
    "Conveniado",
    "CPF",
    "Data",
    "Valor",
    "Parcelas",
    "Status",
  ];

  // Data rows
  const tableRows = data.rows.map((row) => [
    row.storeName,
    row.conveniadoName,
    row.conveniadoCpf,
    row.saleDate,
    formatBRL(row.totalValue),
    row.installments,
    row.status,
  ]);

  // Summary row
  const summaryRow = [
    "",
    "",
    "",
    "TOTAL:",
    formatBRL(data.totalValue),
    "",
    "",
  ];

  const allRows = [
    ...headerRows,
    tableHeaders,
    ...tableRows,
    [],
    summaryRow,
  ];

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Column widths
  ws["!cols"] = [
    { wch: 20 }, // Loja
    { wch: 30 }, // Conveniado
    { wch: 15 }, // CPF
    { wch: 12 }, // Data
    { wch: 15 }, // Valor
    { wch: 10 }, // Parcelas
    { wch: 12 }, // Status
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Vendas");

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
