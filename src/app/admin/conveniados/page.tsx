"use client";

import { useState, useEffect, useCallback } from "react";
import type { Conveniado, Convenio } from "@/lib/types/app.types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConveniadoForm } from "@/components/forms/ConveniadoForm";
import type { ConveniadoFormData } from "@/lib/validations/conveniado.schema";
import {
  fetchConveniadosAdmin,
  fetchConveniosList,
  createConveniado,
  updateConveniado,
  toggleConveniadoActive,
} from "./actions";
import { maskCPFDisplay } from "@/lib/utils/cpf";
import { ptBR } from "@/lib/i18n/pt-BR";
import { toast } from "sonner";
import Link from "next/link";

export default function ConveniadosPage() {
  const [conveniados, setConveniados] = useState<
    (Conveniado & { convenio: Pick<Convenio, "company_name"> | null })[]
  >([]);
  const [convenios, setConvenios] = useState<
    Pick<Convenio, "id" | "company_name">[]
  >([]);
  const [search, setSearch] = useState("");
  const [filterConvenio, setFilterConvenio] = useState("all");
  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Conveniado | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchConvenios = useCallback(async () => {
    const data = await fetchConveniosList();
    setConvenios(data);
  }, []);

  const fetchConveniados = useCallback(async () => {
    const data = await fetchConveniadosAdmin({ showInactive, filterConvenio });
    setConveniados(data);
  }, [showInactive, filterConvenio]);

  useEffect(() => {
    fetchConvenios();
  }, [fetchConvenios]);

  useEffect(() => {
    fetchConveniados();
  }, [fetchConveniados]);

  const filtered = conveniados.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search.replace(/\D/g, ""))
  );

  const handleCreate = async (data: ConveniadoFormData) => {
    setIsLoading(true);
    const result = await createConveniado({
      full_name: data.full_name,
      cpf: data.cpf,
      convenio_id: data.convenio_id,
    });
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Conveniado criado com sucesso!");
    setCreateOpen(false);
    fetchConveniados();
  };

  const handleUpdate = async (data: ConveniadoFormData) => {
    if (!editItem) return;
    setIsLoading(true);
    const result = await updateConveniado(editItem.id, {
      full_name: data.full_name,
      cpf: data.cpf,
      convenio_id: data.convenio_id,
    });
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Conveniado atualizado com sucesso!");
    setEditItem(null);
    fetchConveniados();
  };

  const handleToggle = async (id: string, active: boolean) => {
    const result = await toggleConveniadoActive(id, !active);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(active ? "Conveniado desativado" : "Conveniado ativado");
    fetchConveniados();
  };

  return (
    <div className="animate-ios-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[28px] font-bold tracking-tight">{ptBR.conveniados}</h2>
        <div className="flex gap-2">
          <Link href="/admin/conveniados/import">
            <Button variant="outline" size="sm">
              {ptBR.importConveniados}
            </Button>
          </Link>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{ptBR.createConveniado}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ptBR.createConveniado}</DialogTitle>
              </DialogHeader>
              <ConveniadoForm
                convenios={convenios}
                onSubmit={handleCreate}
                isLoading={isLoading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterConvenio} onValueChange={setFilterConvenio}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Convênio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Convênios</SelectItem>
            {convenios.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.company_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={showInactive ? "default" : "outline"}
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? "Todos" : "Somente Ativos"}
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {ptBR.noResults}
          </p>
        ) : (
          filtered.map((c) => (
            <Card key={c.id} className="press-scale shadow-[var(--shadow-card)]">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{c.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {maskCPFDisplay(c.cpf)}
                    {c.convenio && (
                      <span> • {c.convenio.company_name}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={c.active ? "default" : "secondary"}>
                    {c.active ? ptBR.active : ptBR.inactive}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditItem(c)}
                  >
                    {ptBR.edit}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggle(c.id, c.active)}
                  >
                    {c.active ? "Desativar" : "Ativar"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ptBR.editConveniado}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ConveniadoForm
              convenios={convenios}
              defaultValues={{
                full_name: editItem.full_name,
                cpf: editItem.cpf,
                convenio_id: editItem.convenio_id,
              }}
              onSubmit={handleUpdate}
              isLoading={isLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
