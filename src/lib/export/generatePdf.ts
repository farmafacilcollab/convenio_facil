"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ExportData } from "./index";
import { formatBRL } from "@/lib/utils/currency";

export function generatePdf(data: ExportData): Blob {
  const doc = new jsPDF({ orientation: "landscape" });

  // Header
  doc.setFontSize(16);
  doc.text("FarmaFácil Convênios — Relatório de Vendas", 14, 15);

  doc.setFontSize(10);
  doc.text(`Convênio: ${data.convenioName}`, 14, 24);
  doc.text(`CNPJ: ${data.convenioCnpj}`, 14, 30);
  doc.text(`Período: ${data.dateFrom} a ${data.dateTo}`, 14, 36);
  doc.text(`Total de Vendas: ${data.rows.length}`, 14, 42);
  doc.text(`Valor Total: ${formatBRL(data.totalValue)}`, 14, 48);

  // Table
  autoTable(doc, {
    startY: 54,
    head: [
      [
        "Loja",
        "Conveniado",
        "CPF",
        "Data",
        "Valor",
        "Parcelas",
        "Status",
      ],
    ],
    body: data.rows.map((row) => [
      row.storeName,
      row.conveniadoName,
      row.conveniadoCpf,
      row.saleDate,
      formatBRL(row.totalValue),
      row.installments,
      row.status,
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [0, 113, 227] },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} — Página ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  return doc.output("blob");
}
