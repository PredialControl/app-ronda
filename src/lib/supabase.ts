import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase conectando ao Neon PostgreSQL
const supabaseUrl = 'https://tvuwrrovxzakxrhsplvd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2dXdycm92eHpha3hyaHNwbHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NDUzOTYsImV4cCI6MjA3MTIyMTM5Nn0.SNrfj5xVp2olmyZT8IgFpHxciUTKmLYfykaLtbwT3Do';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Testar conexão
supabase.from('contratos').select('count').limit(1).then(({ data, error }) => {
  if (error) {
    console.error('❌ Erro na conexão com Supabase:', error);
  } else {
    console.log('✅ Conectado ao Supabase/Neon com sucesso!');
  }
});

// Configurações para otimização de fotos
export const PHOTO_CONFIG = {
  // Tamanho máximo de cada foto (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  // Formatos permitidos
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  // Qualidade de compressão (0-100)
  COMPRESSION_QUALITY: 80,
  // Dimensões máximas
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  // Limite de fotos por ronda
  MAX_PHOTOS_PER_RONDA: 50,
  // Limite de fotos por área técnica
  MAX_PHOTOS_PER_AREA: 10
}

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
          url_foto: string
          nome_arquivo: string
          tamanho: number
          tipo_mime: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ronda_id: string
          descricao: string
          responsavel: string
          url_foto: string
          nome_arquivo: string
          tamanho: number
          tipo_mime: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ronda_id?: string
          descricao?: string
          responsavel?: string
          url_foto?: string
          nome_arquivo?: string
          tamanho?: number
          tipo_mime?: string
          created_at?: string
          updated_at?: string
        }
      }
      fotos_areas_tecnicas: {
        Row: {
          id: string
          area_tecnica_id: string
          url_foto: string
          nome_arquivo: string
          tamanho: number
          tipo_mime: string
          observacoes: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_tecnica_id: string
          url_foto: string
          nome_arquivo: string
          tamanho: number
          tipo_mime: string
          observacoes: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_tecnica_id?: string
          url_foto?: string
          nome_arquivo?: string
          tamanho?: number
          tipo_mime?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
