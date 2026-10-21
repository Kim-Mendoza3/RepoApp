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
      };
    };
  };
};
