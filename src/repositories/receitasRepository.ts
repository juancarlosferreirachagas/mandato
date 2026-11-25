/**
 * ============================================================================
 * REPOSITÓRIO DE RECEITAS MUNICIPAIS (TCE-SP AUDESP — GUARULHOS 2025 & 2026)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 */

import { db } from '@/database/client';
import { SNAPSHOT_TCE_GUARULHOS_2026 } from '@/database/contingenciaOficialGuarulhos';
import { SNAPSHOT_TCE_GUARULHOS_2025 } from '@/database/contingenciaOficialGuarulhos2025';

export interface ResumoReceitas {
  total_arrecadado: number;
  total_corrente: number;
  total_capital: number;
  total_intra: number;
  qtd_lancamentos: number;
  ultimo_mes: number | null;
}

export interface ReceitaMes {
  exercicio: number;
  mes: number;
  total_liquido: number;
  qtd: number;
}

export interface ReceitaLinha {
  categoria: string;
  subcategoria: string;
  rubrica: string;
  total: number;
  qtd: number;
}

export interface ReceitaFonte {
  fonte_recurso: string;
  total: number;
  qtd: number;
}

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

interface SnapshotReceitasConsolidado {
  resumo: ResumoReceitas;
  porMes: ReceitaMes[];
  arvore: ReceitaLinha[];
  porFonte: ReceitaFonte[];
}

let cacheConsolidado: SnapshotReceitasConsolidado | null = null;

function consolidarSnapshotsReceitas(): SnapshotReceitasConsolidado {
  if (cacheConsolidado) return cacheConsolidado;

  const s25 = SNAPSHOT_TCE_GUARULHOS_2025.receitas;
  const s26 = SNAPSHOT_TCE_GUARULHOS_2026.receitas;

  const resumo: ResumoReceitas = {
    total_arrecadado: Math.round((s25.resumo.total_arrecadado + s26.resumo.total_arrecadado) * 100) / 100,
    total_corrente: Math.round((s25.resumo.total_corrente + s26.resumo.total_corrente) * 100) / 100,
    total_capital: Math.round((s25.resumo.total_capital + s26.resumo.total_capital) * 100) / 100,
    total_intra: Math.round((s25.resumo.total_intra + s26.resumo.total_intra) * 100) / 100,
    qtd_lancamentos: s25.resumo.qtd_lancamentos + s26.resumo.qtd_lancamentos,
    ultimo_mes: s26.resumo.ultimo_mes,
  };

  const porMes: ReceitaMes[] = [
    ...(s25.porMes as ReceitaMes[]),
    ...(s26.porMes as ReceitaMes[]),
  ];

  const arvoreMap = new Map<string, ReceitaLinha>();
  for (const item of [...(s25.arvore as ReceitaLinha[]), ...(s26.arvore as ReceitaLinha[])]) {
    const chave = `${item.categoria}|${item.subcategoria}|${item.rubrica}`;
    const atual = arvoreMap.get(chave);
    if (!atual) {
      arvoreMap.set(chave, { ...item });
    } else {
      atual.total = Math.round((atual.total + item.total) * 100) / 100;
      atual.qtd += item.qtd;
    }
  }
  const arvore = Array.from(arvoreMap.values()).sort((a, b) => b.total - a.total);

  const fonteMap = new Map<string, ReceitaFonte>();
  for (const f of [...(s25.porFonte as ReceitaFonte[]), ...(s26.porFonte as ReceitaFonte[])]) {
    const atual = fonteMap.get(f.fonte_recurso);
    if (!atual) {
      fonteMap.set(f.fonte_recurso, { ...f });
    } else {
      atual.total = Math.round((atual.total + f.total) * 100) / 100;
      atual.qtd += f.qtd;
    }
  }
  const porFonte = Array.from(fonteMap.values()).sort((a, b) => b.total - a.total);

  cacheConsolidado = { resumo, porMes, arvore, porFonte };
  return cacheConsolidado;
}

function selecionarSnapshotReceitas(ano?: number | null) {
  if (ano === 2025) return SNAPSHOT_TCE_GUARULHOS_2025.receitas;
  if (ano === 2026) return SNAPSHOT_TCE_GUARULHOS_2026.receitas;
  return consolidarSnapshotsReceitas();
}

async function rpcSafe<T>(nome: string, args: Record<string, unknown>): Promise<T | null> {
  try {
    const { data, error } = await db().rpc(nome, args);
    if (error || !data) return null;
    return data as T;
  } catch {
    return null;
  }
}

export const receitasRepository = {
  async resumo(ano: number | null, mes: number | null = null): Promise<ResumoReceitas> {
    const rows = await rpcSafe<any[]>('fg_receitas_resumo', { p_ano: ano, p_mes: mes, p_orgao: null });
    if (rows && rows[0] && num(rows[0].total_arrecadado) > 0) {
      const r = rows[0];
      return {
        total_arrecadado: num(r.total_arrecadado),
        total_corrente: num(r.total_corrente),
        total_capital: num(r.total_capital),
        total_intra: num(r.total_intra),
        qtd_lancamentos: num(r.qtd_lancamentos),
        ultimo_mes: r.ultimo_mes ?? null,
      };
    }

    const snap = selecionarSnapshotReceitas(ano);
    if (mes && ano != null) {
      const mObj = (snap.porMes as ReceitaMes[]).find((x) => x.mes === mes);
      const fator = mObj && snap.resumo.total_arrecadado > 0 ? mObj.total_liquido / snap.resumo.total_arrecadado : 1;
      return {
        total_arrecadado: Math.round(snap.resumo.total_arrecadado * fator * 100) / 100,
        total_corrente: Math.round(snap.resumo.total_corrente * fator * 100) / 100,
        total_capital: Math.round(snap.resumo.total_capital * fator * 100) / 100,
        total_intra: Math.round(snap.resumo.total_intra * fator * 100) / 100,
        qtd_lancamentos: mObj?.qtd ?? snap.resumo.qtd_lancamentos,
        ultimo_mes: snap.resumo.ultimo_mes,
      };
    }
    return snap.resumo as ResumoReceitas;
  },

  async porMes(ano: number | null): Promise<ReceitaMes[]> {
    const rows = await rpcSafe<any[]>('fg_receitas_por_mes', { p_ano: ano, p_orgao: null });
    if (rows && rows.length > 0) {
      return rows.map((r) => ({ ...r, total_liquido: num(r.total_liquido), qtd: num(r.qtd) }));
    }
    if (ano == null) {
      return consolidarSnapshotsReceitas().porMes;
    }
    return selecionarSnapshotReceitas(ano).porMes as ReceitaMes[];
  },

  async arvore(ano: number | null, mes: number | null = null): Promise<ReceitaLinha[]> {
    const rows = await rpcSafe<any[]>('fg_receitas_arvore', { p_ano: ano, p_mes: mes, p_orgao: null });
    if (rows && rows.length > 0) {
      return rows.map((r) => ({ ...r, total: num(r.total), qtd: num(r.qtd) }));
    }

    const snap = selecionarSnapshotReceitas(ano);
    const base = snap.arvore as ReceitaLinha[];
    if (!mes || ano == null) return base;

    const mObj = (snap.porMes as ReceitaMes[]).find((x) => x.mes === mes);
    const fator = mObj && snap.resumo.total_arrecadado > 0 ? mObj.total_liquido / snap.resumo.total_arrecadado : 1;
    return base.map((item) => ({
      ...item,
      total: Math.round(item.total * fator * 100) / 100,
    }));
  },

  async porFonte(ano: number | null, mes: number | null = null): Promise<ReceitaFonte[]> {
    const rows = await rpcSafe<any[]>('fg_receitas_por_fonte', { p_ano: ano, p_mes: mes });
    if (rows && rows.length > 0) {
      return rows.map((r) => ({ ...r, total: num(r.total), qtd: num(r.qtd) }));
    }

    const snap = selecionarSnapshotReceitas(ano);
    const base = snap.porFonte as ReceitaFonte[];
    if (!mes || ano == null) return base;

    const mObj = (snap.porMes as ReceitaMes[]).find((x) => x.mes === mes);
    const fator = mObj && snap.resumo.total_arrecadado > 0 ? mObj.total_liquido / snap.resumo.total_arrecadado : 1;
    return base.map((item) => ({
      ...item,
      total: Math.round(item.total * fator * 100) / 100,
    }));
  },
};
