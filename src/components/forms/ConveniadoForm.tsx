"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
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
  defaultValues?: { full_name: string; cpf?: string; cnpj?: string; convenio_id: string };
  onSubmit: (data: ConveniadoFormData) => Promise<void>;
  isLoading: boolean;
}

export function ConveniadoForm({
  convenios,
  defaultValues,
  onSubmit,
  isLoading,
}: ConveniadoFormProps) {
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">(
    defaultValues?.cpf ? "cpf" : "cnpj"
  );

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
      cnpj: defaultValues?.cnpj ?? "",
      convenio_id: defaultValues?.convenio_id ?? "",
      active: true,
    },
  });

  const cpfValue = watch("cpf");
  const cnpjValue = watch("cnpj");

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 11) {
      setValue("cpf", raw, { shouldValidate: true });
      // Clear CNPJ field when CPF is being edited
      if (raw.length > 0) setValue("cnpj", "");
    }
  };

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 14) {
      setValue("cnpj", raw, { shouldValidate: true });
      // Clear CPF field when CNPJ is being edited
      if (raw.length > 0) setValue("cpf", "");
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

  const formatCNPJDisplay = (cnpj: string) => {
    const raw = cnpj.replace(/\D/g, "");
    if (raw.length <= 2) return raw;
    if (raw.length <= 5)
      return `${raw.slice(0, 2)}.${raw.slice(2)}`;
    if (raw.length <= 8)
      return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5)}`;
    if (raw.length <= 12)
      return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8)}`;
    return `${raw.slice(0, 2)}.${raw.slice(2, 5)}.${raw.slice(5, 8)}/${raw.slice(8, 12)}-${raw.slice(12)}`;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
        <Label>Tipo de Documento</Label>
        <Select value={documentType} onValueChange={(val) => {
          setDocumentType(val as "cpf" | "cnpj");
          if (val === "cpf") {
            setValue("cnpj", "");
          } else {
            setValue("cpf", "");
          }
        }}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {documentType === "cpf" && (
        <div className="space-y-2">
          <Label htmlFor="cpf">{ptBR.cpf}</Label>
          <Input
            id="cpf"
            value={formatCPFDisplay(cpfValue || "")}
            onChange={handleCPFChange}
            placeholder="000.000.000-00"
            maxLength={14}
          />
          {errors.cpf && (
            <p className="text-xs text-destructive">{errors.cpf.message}</p>
          )}
        </div>
      )}

      {documentType === "cnpj" && (
        <div className="space-y-2">
          <Label htmlFor="cnpj">{ptBR.cnpj}</Label>
          <Input
            id="cnpj"
            value={formatCNPJDisplay(cnpjValue || "")}
            onChange={handleCNPJChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
          />
          {errors.cnpj && (
            <p className="text-xs text-destructive">{errors.cnpj.message}</p>
          )}
        </div>
      )}

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

      {errors.root && (
        <p className="text-xs text-destructive">{errors.root.message}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? ptBR.loading : ptBR.save}
        </Button>
      </div>
    </form>
  );
}
