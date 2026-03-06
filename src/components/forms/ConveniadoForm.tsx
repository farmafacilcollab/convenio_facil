"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  conveniadoSchema,
  type ConveniadoFormData,
} from "@/lib/validations/conveniado.schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ptBR } from "@/lib/i18n/pt-BR";
import type { Convenio } from "@/lib/types/app.types";

interface ConveniadoFormProps {
  convenios: Pick<Convenio, "id" | "company_name">[];
  defaultValues?: { full_name: string; cpf: string; convenio_id: string };
  onSubmit: (data: ConveniadoFormData) => Promise<void>;
  isLoading: boolean;
}

export function ConveniadoForm({
  convenios,
  defaultValues,
  onSubmit,
  isLoading,
}: ConveniadoFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(conveniadoSchema),
    defaultValues: {
      full_name: defaultValues?.full_name ?? "",
      cpf: defaultValues?.cpf ?? "",
      convenio_id: defaultValues?.convenio_id ?? "",
      active: true,
    },
  });

  const cpfValue = watch("cpf");

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) {
      // Apply mask
      let masked = raw;
      if (raw.length > 9) {
        masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
      } else if (raw.length > 6) {
        masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
      } else if (raw.length > 3) {
        masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
      }
      setValue("cpf", raw, { shouldValidate: true });
    }
  };

  const formatCPFDisplay = (cpf: string) => {
    const raw = cpf.replace(/\D/g, "");
    if (raw.length <= 3) return raw;
    if (raw.length <= 6) return `${raw.slice(0, 3)}.${raw.slice(3)}`;
    if (raw.length <= 9)
      return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">{ptBR.fullName}</Label>
        <Input
          id="full_name"
          {...register("full_name")}
          placeholder="Nome completo do conveniado"
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">
            {errors.full_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">{ptBR.cpf}</Label>
        <Input
          id="cpf"
          value={formatCPFDisplay(cpfValue)}
          onChange={handleCPFChange}
          placeholder="000.000.000-00"
          maxLength={14}
        />
        {errors.cpf && (
          <p className="text-xs text-destructive">{errors.cpf.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="convenio_id">{ptBR.convenio}</Label>
        <Select
          value={watch("convenio_id")}
          onValueChange={(val) =>
            setValue("convenio_id", val, { shouldValidate: true })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o convênio" />
          </SelectTrigger>
          <SelectContent>
            {convenios.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.convenio_id && (
          <p className="text-xs text-destructive">
            {errors.convenio_id.message}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? ptBR.loading : ptBR.save}
        </Button>
      </div>
    </form>
  );
}
