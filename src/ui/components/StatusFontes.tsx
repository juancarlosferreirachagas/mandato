/**
 * ============================================================================
 * COMPONENTE DE STATUS DE AUDITORIA EM TEMPO REAL (<StatusBanco />)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 *
 * Exibe o status de conectividade e validação da camada de dados (com failover
 * automático entre Supabase PostgreSQL e os snapshots oficiais TCE-2026/TSE-2024).
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, Database, Loader2 } from 'lucide-react';
import { pingBanco } from '@/services/auditoriaTempoRealService';

type Estado =
  | { fase: 'carregando' }
  | { fase: 'ativo'; ms: number; modo: 'REMOTO' | 'LOCAL' };

let cache: { quando: number; promessa: Promise<Estado> } | null = null;

function consultar(): Promise<Estado> {
  if (cache && Date.now() - cache.quando < 20_000) return cache.promessa;
  const promessa = pingBanco().then<Estado>((r) => ({
    fase: 'ativo',
    ms: r.ms,
    modo: r.modo,
  }));
  cache = { quando: Date.now(), promessa };
  return promessa;
}

export function useStatusBanco(): Estado {
  const [estado, setEstado] = useState<Estado>({ fase: 'carregando' });
  useEffect(() => {
    let vivo = true;
    consultar().then((e) => vivo && setEstado(e));
    return () => {
      vivo = false;
    };
  }, []);
  return estado;
}

export function StatusBanco({ compacto = false }: { compacto?: boolean }) {
  const e = useStatusBanco();

  if (e.fase === 'carregando') {
    return (
      <span className="fg-status fg-status--wait" role="status">
        <Loader2 size={12} className="fg-spin" aria-hidden />
        <span>Verificando dados…</span>
      </span>
    );
  }

  return (
    <span
      className="fg-status fg-status--on"
      role="status"
      title={
        e.modo === 'LOCAL'
          ? 'Base oficial TCE-SP & TSE pronta para consulta instantânea'
          : 'Conectado ao banco remoto de dados abertos'
      }
    >
      {e.modo === 'LOCAL' ? <Database size={12} aria-hidden /> : <CheckCircle2 size={12} aria-hidden />}
      <span>
        {compacto
          ? 'Dados oficiais ativos'
          : `Fontes oficiais ativas · ${e.ms} ms`}
      </span>
    </span>
  );
}
