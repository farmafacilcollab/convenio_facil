"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  convenioSchema,
  type ConvenioFormData,
} from "@/lib/validations/convenio.schema";
import { maskCNPJ, unmaskCNPJ } from "@/lib/utils/cnpj";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ptBR } from "@/lib/i18n/pt-BR";

interface ConvenioFormProps {
  defaultValues?: { company_name: string; cnpj: string };
  onSubmit: (data: ConvenioFormData) => Promise<void>;
  isLoading: boolean;
}

export function ConvenioForm({
  defaultValues,
  onSubmit,
  isLoading,
}: ConvenioFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(convenioSchema),
    defaultValues: {
      company_name: defaultValues?.company_name ?? "",
      cnpj: defaultValues?.cnpj ?? "",
      active: true,
    },
  });

  const cnpjValue = watch("cnpj");

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = unmaskCNPJ(e.target.value);
    if (raw.length <= 14) {
      setValue("cnpj", raw, { shouldValidate: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="company_name">{ptBR.companyName}</Label>
        <Input
          id="company_name"
          {...register("company_name")}
          placeholder="Razão Social do Convênio"
        />
        {errors.company_name && (
          <p className="text-xs text-destructive">
            {errors.company_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">{ptBR.cnpj}</Label>
        <Input
          id="cnpj"
          value={maskCNPJ(cnpjValue)}
          onChange={handleCNPJChange}
          placeholder="00.000.000/0000-00"
          maxLength={18}
        />
        {errors.cnpj && (
          <p className="text-xs text-destructive">{errors.cnpj.message}</p>
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
