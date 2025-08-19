import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para as tabelas do Supabase
export interface Database {
  public: {
    Tables: {
      rondas: {
        Row: {
          id: string
          nome: string
          contrato: string
          data: string
          hora: string
          responsavel: string
          observacoes_gerais: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          contrato: string
          data: string
          hora: string
          responsavel: string
          observacoes_gerais: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          contrato?: string
          data?: string
          hora?: string
          responsavel?: string
          observacoes_gerais?: string
          created_at?: string
          updated_at?: string
        }
      }
      contratos: {
        Row: {
          id: string
          nome: string
          sindico: string
          endereco: string
          periodicidade: string
          observacoes: string
          data_criacao: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          sindico: string
          endereco: string
          periodicidade: string
          observacoes: string
          data_criacao: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          sindico?: string
          endereco?: string
          periodicidade?: string
          observacoes?: string
          data_criacao?: string
          created_at?: string
          updated_at?: string
        }
      }
      areas_tecnicas: {
        Row: {
          id: string
          nome: string
          status: string
          contrato: string
          endereco: string
          data: string
          hora: string
          foto: string | null
          observacoes: string
          ronda_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          status: string
          contrato: string
          endereco: string
          data: string
          hora: string
          foto?: string | null
          observacoes: string
          ronda_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          status?: string
          contrato?: string
          endereco?: string
          data?: string
          hora?: string
          foto?: string | null
          observacoes?: string
          ronda_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      fotos_ronda: {
        Row: {
          id: string
          ronda_id: string
          descricao: string
          responsavel: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ronda_id: string
          descricao: string
          responsavel: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ronda_id?: string
          descricao?: string
          responsavel?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
