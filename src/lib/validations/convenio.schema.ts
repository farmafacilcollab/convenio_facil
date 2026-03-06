import { z } from "zod";
import { validateCNPJ } from "@/lib/utils/cnpj";

export const convenioSchema = z.object({
  company_name: z
    .string()
    .min(2, "Nome da empresa é obrigatório")
    .transform((v) => v.trim()),
  cnpj: z
    .string()
    .min(1, "CNPJ é obrigatório")
    .refine((val) => validateCNPJ(val), {
      message: "CNPJ inválido",
    }),
  active: z.boolean().default(true),
});

export type ConvenioFormData = z.infer<typeof convenioSchema>;

// CSV import row schema
export const convenioImportRowSchema = z.object({
  company_name: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: z.string().refine((val) => validateCNPJ(val.replace(/\D/g, "")), {
    message: "CNPJ inválido",
  }),
});
