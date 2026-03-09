"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ptBR } from "@/lib/i18n/pt-BR";
import { maskCurrency, parseBRL } from "@/lib/utils/currency";
import { useState, useEffect } from "react";

interface Props {
  saleDate: string;
  onDateChange: (date: string) => void;
  totalValue: number;
  onValueChange: (value: number) => void;
  isInstallment: boolean;
  onInstallmentChange: (value: boolean) => void;
  installmentCount: number | null;
  onInstallmentCountChange: (count: number) => void;
}

const INSTALLMENT_OPTIONS = [2, 3, 4, 5];

export function StepDetails({
  saleDate,
  onDateChange,
  totalValue,
  onValueChange,
  isInstallment,
  onInstallmentChange,
  installmentCount,
  onInstallmentCountChange,
}: Props) {
  const [rawCurrency, setRawCurrency] = useState(() => {
    if (totalValue > 0) {
      return (totalValue * 100).toFixed(0);
    }
    return "";
  });

  useEffect(() => {
    if (totalValue > 0) {
      setRawCurrency((totalValue * 100).toFixed(0));
    } else {
      setRawCurrency("");
    }
  }, [totalValue]);

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setRawCurrency(raw);
    const masked = maskCurrency(raw);
    const parsed = parseBRL(masked);
    onValueChange(parsed);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Date */}
      <div className="space-y-2">
        <Label>{ptBR.saleDate}</Label>
        <Input
          type="date"
          value={saleDate}
          max={today}
          onChange={(e) => onDateChange(e.target.value)}
          className="h-12"
        />
      </div>

      {/* Total value */}
      <div className="space-y-2">
        <Label>{ptBR.totalValue}</Label>
        <Input
          type="text"
          inputMode="numeric"
          value={rawCurrency ? maskCurrency(rawCurrency) : ""}
          onChange={handleCurrencyChange}
          placeholder="R$ 0,00"
          className="h-12 text-lg font-semibold"
        />
      </div>

      {/* Installment toggle */}
      <div className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
        <Label htmlFor="installment" className="text-sm font-medium">
          {ptBR.isInstallment}
        </Label>
        <Switch
          id="installment"
          checked={isInstallment}
          onCheckedChange={onInstallmentChange}
        />
      </div>

      {/* Installment count */}
      {isInstallment && (
        <div className="space-y-2">
          <Label>{ptBR.installmentCount}</Label>
          <div className="grid grid-cols-4 gap-2">
            {INSTALLMENT_OPTIONS.map((count) => (
              <Button
                key={count}
                type="button"
                variant={installmentCount === count ? "default" : "outline"}
                size="lg"
                className="h-14 rounded-xl text-lg font-semibold"
                onClick={() => onInstallmentCountChange(count)}
              >
                {count}x
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Summary card */}
      {totalValue > 0 && (
        <Card>
          <CardContent className="space-y-2 py-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{ptBR.totalValue}</span>
              <span className="font-semibold">
                {maskCurrency(rawCurrency)}
              </span>
            </div>
            {isInstallment && installmentCount && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {installmentCount}x de
                </span>
                <span className="font-semibold">
                  {maskCurrency(
                    Math.round((totalValue / installmentCount) * 100).toString()
                  )}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
