export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      stores: {
        Row: {
          id: string;
          name: string;
          cnpj: string;
          email: string;
          slug: string;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          cnpj: string;
          email: string;
          slug: string;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          cnpj?: string;
          email?: string;
          slug?: string;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          role: "admin" | "store";
          store_id: string | null;
          permissions: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role: "admin" | "store";
          store_id?: string | null;
          permissions?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: "admin" | "store";
          store_id?: string | null;
          permissions?: string[];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          }
        ];
      };
      convenios: {
        Row: {
          id: string;
          company_name: string;
          cnpj: string | null;
          active: boolean;
          metadata: Json;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          cnpj?: string | null;
          active?: boolean;
          metadata?: Json;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          cnpj?: string | null;
          active?: boolean;
          metadata?: Json;
          created_at?: string;
          created_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "convenios_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      conveniados: {
        Row: {
          id: string;
          full_name: string;
          cpf: string;
          convenio_id: string;
          active: boolean;
          metadata: Json;
          created_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          cpf: string;
          convenio_id: string;
          active?: boolean;
          metadata?: Json;
          created_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          cpf?: string;
          convenio_id?: string;
          active?: boolean;
          metadata?: Json;
          created_at?: string;
          created_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conveniados_convenio_id_fkey";
            columns: ["convenio_id"];
            isOneToOne: false;
            referencedRelation: "convenios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conveniados_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sales: {
        Row: {
          id: string;
          store_id: string;
          convenio_id: string;
          conveniado_id: string;
          sale_date: string;
          total_value: number;
          is_installment: boolean;
          installment_count: number | null;
          requisition_number: string;
          status: "pending" | "exported" | "closed";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          store_id: string;
          convenio_id: string;
          conveniado_id: string;
          sale_date: string;
          total_value: number;
          is_installment?: boolean;
          installment_count?: number | null;
          requisition_number: string;
          status?: "pending" | "exported" | "closed";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          store_id?: string;
          convenio_id?: string;
          conveniado_id?: string;
          sale_date?: string;
          total_value?: number;
          is_installment?: boolean;
          installment_count?: number | null;
          requisition_number?: string;
          status?: "pending" | "exported" | "closed";
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey";
            columns: ["store_id"];
            isOneToOne: false;
            referencedRelation: "stores";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_convenio_id_fkey";
            columns: ["convenio_id"];
            isOneToOne: false;
            referencedRelation: "convenios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_conveniado_id_fkey";
            columns: ["conveniado_id"];
            isOneToOne: false;
            referencedRelation: "conveniados";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      sale_images: {
        Row: {
          id: string;
          sale_id: string;
          installment_number: number | null;
          storage_path: string;
          file_size_kb: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sale_id: string;
          installment_number?: number | null;
          storage_path: string;
          file_size_kb: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sale_id?: string;
          installment_number?: number | null;
          storage_path?: string;
          file_size_kb?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sale_images_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          }
        ];
      };
      export_logs: {
        Row: {
          id: string;
          exported_by: string;
          convenio_id: string;
          date_from: string;
          date_to: string;
          total_sales: number;
          export_type: "pdf" | "xlsx" | "images";
          created_at: string;
        };
        Insert: {
          id?: string;
          exported_by: string;
          convenio_id: string;
          date_from: string;
          date_to: string;
          total_sales: number;
          export_type: "pdf" | "xlsx" | "images";
          created_at?: string;
        };
        Update: {
          id?: string;
          exported_by?: string;
          convenio_id?: string;
          date_from?: string;
          date_to?: string;
          total_sales?: number;
          export_type?: "pdf" | "xlsx" | "images";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "export_logs_exported_by_fkey";
            columns: ["exported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "export_logs_convenio_id_fkey";
            columns: ["convenio_id"];
            isOneToOne: false;
            referencedRelation: "convenios";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          body?: string;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_user_role: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_user_store_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
