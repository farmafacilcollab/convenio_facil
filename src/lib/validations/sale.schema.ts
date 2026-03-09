import { z } from "zod";

export const saleSchema = z.object({
  convenio_id: z.string().uuid("Selecione um convênio"),
  conveniado_id: z.string().uuid("Selecione um conveniado"),
  requisition_number: z
    .string()
    .min(1, "Número da requisição é obrigatório")
    .regex(/^\d+$/, "Apenas números"),
  sale_date: z
    .string()
    .min(1, "Data da venda é obrigatória")
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return date <= today;
      },
      { message: "A data da venda não pode ser futura" }
    ),
  total_value: z
    .number()
    .positive("O valor deve ser maior que zero")
    .max(9999999.99, "Valor máximo excedido"),
  is_installment: z.boolean().default(false),
  installment_count: z
    .number()
    .int()
    .min(2, "Mínimo de 2 parcelas")
    .max(5, "Máximo de 5 parcelas")
    .nullable()
    .default(null),
}).refine(
  (data) => {
    if (data.is_installment && !data.installment_count) {
      return false;
    }
    return true;
  },
  {
    message: "Selecione o número de parcelas",
    path: ["installment_count"],
  }
);

export type SaleFormData = z.infer<typeof saleSchema>;
