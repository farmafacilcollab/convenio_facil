"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Convenio } from "@/lib/types/app.types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConvenioForm } from "@/components/forms/ConvenioForm";
import type { ConvenioFormData } from "@/lib/validations/convenio.schema";
import {
  createConvenio,
  updateConvenio,
  toggleConvenioActive,
} from "./actions";
import { formatCNPJ } from "@/lib/utils/cnpj";
import { ptBR } from "@/lib/i18n/pt-BR";
import { toast } from "sonner";
import Link from "next/link";

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Convenio | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabaseRef = useRef(createClient());

  const fetchConvenios = useCallback(async () => {
    let query = supabaseRef.current
      .from("convenios")
      .select("*")
      .order("company_name", { ascending: true });

    if (!showInactive) {
      query = query.eq("active", true);
    }

    const { data } = await query;
    setConvenios(data ?? []);
  }, [showInactive]);

  useEffect(() => {
    fetchConvenios();
  }, [fetchConvenios]);

  const filtered = convenios.filter(
    (c) =>
      c.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.cnpj ?? "").includes(search.replace(/\D/g, ""))
  );

  const handleCreate = async (data: ConvenioFormData) => {
    setIsLoading(true);
    const result = await createConvenio({
      company_name: data.company_name,
      cnpj: data.cnpj,
    });
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Convênio criado com sucesso!");
    setCreateOpen(false);
    fetchConvenios();
  };

  const handleUpdate = async (data: ConvenioFormData) => {
    if (!editItem) return;
    setIsLoading(true);
    const result = await updateConvenio(editItem.id, {
      company_name: data.company_name,
      cnpj: data.cnpj,
    });
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Convênio atualizado com sucesso!");
    setEditItem(null);
    fetchConvenios();
  };

  const handleToggle = async (id: string, active: boolean) => {
    const result = await toggleConvenioActive(id, !active);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success(active ? "Convênio desativado" : "Convênio ativado");
    fetchConvenios();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{ptBR.convenios}</h2>
        <div className="flex gap-2">
          <Link href="/admin/convenios/import">
            <Button variant="outline" size="sm">
              {ptBR.importConvenios}
            </Button>
          </Link>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">{ptBR.createConvenio}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ptBR.createConvenio}</DialogTitle>
              </DialogHeader>
              <ConvenioForm onSubmit={handleCreate} isLoading={isLoading} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder={ptBR.searchConvenio}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
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
            <Card key={c.id} className="shadow-subtle">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">{c.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.cnpj ? formatCNPJ(c.cnpj) : "CNPJ não informado"}
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
            <DialogTitle>{ptBR.editConvenio}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <ConvenioForm
              defaultValues={{
                company_name: editItem.company_name,
                cnpj: editItem.cnpj ?? "",
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
