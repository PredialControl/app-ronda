// Sistema simplificado de dados locais
export interface Contrato {
  id: string;
  nome: string;
  sindico: string;
  endereco: string;
  periodicidade: string;
  observacoes: string;
  dataCriacao: string;
}

export interface Ronda {
  id: string;
  nome: string;
  contrato: string;
  data: string;
  hora: string;
  responsavel: string;
  observacoesGerais: string;
  areasTecnicas: any[];
  fotosRonda: any[];
  outrosItensCorrigidos: any[];
}

class LocalDataService {
  private static instance: LocalDataService;
  
  static getInstance(): LocalDataService {
    if (!LocalDataService.instance) {
      LocalDataService.instance = new LocalDataService();
    }
    return LocalDataService.instance;
  }

  // Contratos
  getContratos(): Contrato[] {
    try {
      const saved = localStorage.getItem('appRonda_contratos');
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Criar contratos de exemplo
      const contratos: Contrato[] = [
        {
          id: '1',
          nome: 'Dream Panamby',
          sindico: 'Ricardo Oliveira',
          endereco: 'Rua das Flores, 123 - Centro',
          periodicidade: 'MENSAL',
          observacoes: 'Contrato de manutenção preventiva',
          dataCriacao: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          nome: 'Residencial Primavera',
          sindico: 'Maria Santos',
          endereco: 'Av. Principal, 456 - Bairro Novo',
          periodicidade: 'SEMANAL',
          observacoes: 'Inspeção semanal de segurança',
          dataCriacao: '2024-01-01T00:00:00.000Z'
        }
      ];
      
      localStorage.setItem('appRonda_contratos', JSON.stringify(contratos));
      return contratos;
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      return [];
    }
  }

  // Rondas
  getRondas(): Ronda[] {
    try {
      const saved = localStorage.getItem('appRonda_rondas');
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Criar rondas de exemplo
      const hoje = new Date().toISOString().split('T')[0];
      const rondas: Ronda[] = [
        {
          id: '1',
          nome: 'Ronda Semanal - Dream Panamby',
          contrato: 'Dream Panamby',
          data: hoje,
          hora: '09:00',
          responsavel: 'João Silva',
          observacoesGerais: 'Ronda de manutenção preventiva',
          areasTecnicas: [],
          fotosRonda: [],
          outrosItensCorrigidos: []
        },
        {
          id: '2',
          nome: 'Inspeção Mensal - Primavera',
          contrato: 'Residencial Primavera',
          data: hoje,
          hora: '14:00',
          responsavel: 'Maria Costa',
          observacoesGerais: 'Inspeção mensal completa',
          areasTecnicas: [],
          fotosRonda: [],
          outrosItensCorrigidos: []
        }
      ];
      
      localStorage.setItem('appRonda_rondas', JSON.stringify(rondas));
      return rondas;
    } catch (error) {
      console.error('Erro ao carregar rondas:', error);
      return [];
    }
  }

  // Salvar contrato
  salvarContrato(contrato: Contrato): void {
    try {
      const contratos = this.getContratos();
      const index = contratos.findIndex(c => c.id === contrato.id);
      
      if (index >= 0) {
        contratos[index] = contrato;
      } else {
        contratos.push(contrato);
      }
      
      localStorage.setItem('appRonda_contratos', JSON.stringify(contratos));
      console.log('✅ Contrato salvo:', contrato.nome);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
    }
  }

  // Salvar ronda
  salvarRonda(ronda: Ronda): void {
    try {
      const rondas = this.getRondas();
      const index = rondas.findIndex(r => r.id === ronda.id);
      
      if (index >= 0) {
        rondas[index] = ronda;
      } else {
        rondas.push(ronda);
      }
      
      localStorage.setItem('appRonda_rondas', JSON.stringify(rondas));
      console.log('✅ Ronda salva:', ronda.nome);
    } catch (error) {
      console.error('Erro ao salvar ronda:', error);
    }
  }

  // Deletar contrato
  deletarContrato(id: string): void {
    try {
      const contratos = this.getContratos();
      const filtrados = contratos.filter(c => c.id !== id);
      localStorage.setItem('appRonda_contratos', JSON.stringify(filtrados));
      console.log('✅ Contrato deletado:', id);
    } catch (error) {
      console.error('Erro ao deletar contrato:', error);
    }
  }

  // Deletar ronda
  deletarRonda(id: string): void {
    try {
      const rondas = this.getRondas();
      const filtradas = rondas.filter(r => r.id !== id);
      localStorage.setItem('appRonda_rondas', JSON.stringify(filtradas));
      console.log('✅ Ronda deletada:', id);
    } catch (error) {
      console.error('Erro ao deletar ronda:', error);
    }
  }

  // Limpar todos os dados
  limparDados(): void {
    try {
      localStorage.removeItem('appRonda_contratos');
      localStorage.removeItem('appRonda_rondas');
      console.log('✅ Todos os dados foram limpos');
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
    }
  }
}

export const localDataService = LocalDataService.getInstance();

