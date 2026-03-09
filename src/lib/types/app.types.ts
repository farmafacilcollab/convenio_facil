import type { Database } from "./database.types";

// Row type shortcuts
export type Store = Database["public"]["Tables"]["stores"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Convenio = Database["public"]["Tables"]["convenios"]["Row"];
export type Conveniado = Database["public"]["Tables"]["conveniados"]["Row"];
export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleImage = Database["public"]["Tables"]["sale_images"]["Row"];
export type ExportLog = Database["public"]["Tables"]["export_logs"]["Row"];

// Relations
export type SaleWithRelations = Sale & {
  store: Pick<Store, "name" | "slug">;
  convenio: Pick<Convenio, "company_name" | "cnpj">;
  conveniado: Pick<Conveniado, "full_name" | "cpf">;
  sale_images: SaleImage[];
};

export type ConveniadoWithConvenio = Conveniado & {
  convenio: Pick<Convenio, "company_name">;
};

// Form types
export type SaleFormData = {
  convenio_id: string;
  conveniado_id: string;
  requisition_number: string;
  sale_date: string;
  total_value: number;
  is_installment: boolean;
  installment_count: number | null;
  images: CompressedImage[];
};

export type CompressedImage = {
  file: File;
  preview: string;
  installment_number: number | null;
  originalSize: number;
  compressedSize: number;
};

// Auth
export type UserRole = "admin" | "store";
export type SaleStatus = "pending" | "exported" | "closed";
export type ExportType = "pdf" | "xlsx" | "images";
