import { z } from "zod";
import { validateCPF } from "@/lib/utils/cpf";
import { validateCNPJ } from "@/lib/utils/cnpj";

export const conveniadoSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nome completo é obrigatório")
    .transform((v) => v.trim()),
  cpf: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, "") || ""),
  cnpj: z
    .string()
    .optional()
    .transform((val) => val?.replace(/\D/g, "") || ""),
  convenio_id: z.string().uuid("Selecione um convênio"),
  active: z.boolean().default(true),
}).refine(
  (data) => {
    // Pelo menos um dos dois deve ser fornecido
    const hasCPF = data.cpf && data.cpf.length > 0;
    const hasCNPJ = data.cnpj && data.cnpj.length > 0;
    return hasCPF || hasCNPJ;
  },
  {
    message: "CPF ou CNPJ é obrigatório",
    path: ["cpf"],
  }
).refine(
  (data) => {
    if (data.cpf && data.cpf.length > 0) {
      return validateCPF(data.cpf);
    }
    return true;
  },
  {
    message: "CPF inválido",
    path: ["cpf"],
  }
).refine(
  (data) => {
    if (data.cnpj && data.cnpj.length > 0) {
      return validateCNPJ(data.cnpj);
    }
    return true;
  },
  {
    message: "CNPJ inválido",
    path: ["cnpj"],
  }
).refine(
  (data) => {
    // Não pode ter ambos preenchidos
    const hasCPF = data.cpf && data.cpf.length > 0;
    const hasCNPJ = data.cnpj && data.cnpj.length > 0;
    return !(hasCPF && hasCNPJ);
  },
  {
    message: "Preencha apenas CPF ou CNPJ, não ambos",
    path: ["cpf"],
  }
);

export type ConveniadoFormData = z.infer<typeof conveniadoSchema>;

// CSV import row schema
export const conveniadoImportRowSchema = z.object({
  full_name: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  convenio_cnpj: z.string().optional(),
  convenio_name: z.string().optional(),
}).refine(
  (data) => {
    const cpfNum = data.cpf?.replace(/\D/g, "") || "";
    const cnpjNum = data.cnpj?.replace(/\D/g, "") || "";
    const hasCPF = cpfNum.length > 0;
    const hasCNPJ = cnpjNum.length > 0;
    return hasCPF || hasCNPJ;
  },
  { message: "CPF ou CNPJ é obrigatório" }
).refine(
  (data) => {
    const cpfNum = data.cpf?.replace(/\D/g, "") || "";
    if (cpfNum.length > 0) {
      return validateCPF(cpfNum);
    }
    return true;
  },
  { message: "CPF inválido" }
).refine(
  (data) => {
    const cnpjNum = data.cnpj?.replace(/\D/g, "") || "";
    if (cnpjNum.length > 0) {
      return validateCNPJ(cnpjNum);
    }
    return true;
  },
  { message: "CNPJ inválido" }
);

// XLSX import row schema
export const xlsxImportRowSchema = z.object({
  convenio_name: z.string().min(1, "Nome do convênio é obrigatório"),
  full_name: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
}).refine(
  (data) => {
    const cpfNum = data.cpf?.replace(/\D/g, "") || "";
    const cnpjNum = data.cnpj?.replace(/\D/g, "") || "";
    const hasCPF = cpfNum.length > 0;
    const hasCNPJ = cnpjNum.length > 0;
    return hasCPF || hasCNPJ;
  },
  { message: "CPF ou CNPJ é obrigatório" }
).refine(
  (data) => {
    const cpfNum = data.cpf?.replace(/\D/g, "") || "";
    if (cpfNum.length > 0) {
      return validateCPF(cpfNum);
    }
    return true;
  },
  { message: "CPF inválido" }
).refine(
  (data) => {
    const cnpjNum = data.cnpj?.replace(/\D/g, "") || "";
    if (cnpjNum.length > 0) {
      return validateCNPJ(cnpjNum);
    }
    return true;
  },
  { message: "CNPJ inválido" }
);

export type XlsxImportRow = z.infer<typeof xlsxImportRowSchema>;
