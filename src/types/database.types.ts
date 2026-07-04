export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'SUPER_ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER'
          created_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_url: string | null
          banner_url: string | null
          address: string | null
          whatsapp: string | null
          instagram: string | null
          operational_hours: Json | null
          description: string | null
          status: 'ACTIVE' | 'SUSPENDED'
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          logo_url?: string | null
          banner_url?: string | null
          address?: string | null
          whatsapp?: string | null
          instagram?: string | null
          operational_hours?: Json | null
          description?: string | null
          status?: 'ACTIVE' | 'SUSPENDED'
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          banner_url?: string | null
          address?: string | null
          whatsapp?: string | null
          instagram?: string | null
          operational_hours?: Json | null
          description?: string | null
          status?: 'ACTIVE' | 'SUSPENDED'
          created_at?: string
        }
      }
      // Add other tables as needed based on the SQL schema...
    }
  }
}
