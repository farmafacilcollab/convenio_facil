import { z } from "zod";
import { validateCPF } from "@/lib/utils/cpf";

export const conveniadoSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nome completo é obrigatório")
    .transform((v) => v.trim()),
  cpf: z
    .string()
    .min(1, "CPF é obrigatório")
    .refine((val) => validateCPF(val), {
      message: "CPF inválido",
    }),
  convenio_id: z.string().uuid("Selecione um convênio"),
  active: z.boolean().default(true),
});

export type ConveniadoFormData = z.infer<typeof conveniadoSchema>;

// CSV import row schema
export const conveniadoImportRowSchema = z.object({
  full_name: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().refine((val) => validateCPF(val.replace(/\D/g, "")), {
    message: "CPF inválido",
  }),
  convenio_cnpj: z.string().optional(),
  convenio_name: z.string().optional(),
});

// XLSX import row schema
export const xlsxImportRowSchema = z.object({
  convenio_name: z.string().min(1, "Nome do convênio é obrigatório"),
  full_name: z.string().min(2, "Nome completo é obrigatório"),
  cpf: z.string().refine((val) => validateCPF(val.replace(/\D/g, "")), {
    message: "CPF inválido",
  }),
});

export type XlsxImportRow = z.infer<typeof xlsxImportRowSchema>;
