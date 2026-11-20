export type AppRole = 'tutor' | 'admin' | 'agenda_manager';
export type ContentStatus = 'draft' | 'published' | 'cancelled' | 'archived';
export type SessionStatus = 'scheduled' | 'cancelled' | 'completed';
export type RegistrationStatus = 'confirmed' | 'waitlisted' | 'cancelled' | 'attended';
export type EventType = 'public_event' | 'cinema' | 'astronomy_night' | 'community_activity' | 'talk';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          role: AppRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          role?: AppRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      children_profiles: {
        Row: {
          id: string;
          guardian_id: string;
          alias: string;
          age_range: string | null;
          avatar_key: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['children_profiles']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['children_profiles']['Insert']>;
        Relationships: [];
      };
      workshops: {
        Row: {
          id: string;
          title: string;
          eyebrow: string | null;
          category: string | null;
          description: string;
          hook: string | null;
          activities: string[];
          takeaways: string[];
          audience: string | null;
          duration: string | null;
          capacity_description: string | null;
          safety_note: string | null;
          accent: string | null;
          status: ContentStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workshops']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workshops']['Insert']>;
        Relationships: [];
      };
      workshop_images: {
        Row: {
          id: string;
          workshop_id: string;
          storage_path: string;
          image_type: 'cover' | 'gallery';
          sort_order: number;
          alt_text: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workshop_images']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['workshop_images']['Insert']>;
        Relationships: [];
      };
      institutional_activities: {
        Row: {
          id: string;
          code: string;
          client_name: string | null;
          contact_phone: string | null;
          notes: string | null;
          workshop_keys: string[];
          location: string;
          starts_at: string;
          ends_at: string | null;
          student_count: number | null;
          school_grade: string | null;
          status: SessionStatus;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code?: string;
          client_name?: string | null;
          contact_phone?: string | null;
          notes?: string | null;
          workshop_keys: string[];
          location: string;
          starts_at: string;
          ends_at?: string | null;
          student_count?: number | null;
          school_grade?: string | null;
          status?: SessionStatus;
          created_by?: string;
        };
        Update: Partial<Database['public']['Tables']['institutional_activities']['Insert']>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      /** Calendario público: solo el día y los talleres (sin datos privados). */
      agenda_public: {
        Args: { p_from: string; p_to: string };
        Returns: { day: string; workshop_keys: string[] }[];
      };
      /** Datos completos de UN taller agendado, buscándolo por su código. */
      agenda_by_code: {
        Args: { p_code: string };
        Returns: {
          code: string;
          starts_at: string;
          ends_at: string | null;
          location: string;
          client_name: string | null;
          workshop_keys: string[];
          student_count: number | null;
          school_grade: string | null;
          status: SessionStatus;
        }[];
      };
    };
    Enums: {
      app_role: AppRole;
      content_status: ContentStatus;
      session_status: SessionStatus;
      registration_status: RegistrationStatus;
      event_type: EventType;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
