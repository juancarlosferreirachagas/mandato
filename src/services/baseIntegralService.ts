/**
 * ============================================================================
 * SERVIÇO DA BASE INTEGRAL (EMPRESAS, PAGAMENTOS & CONEXÕES DIÁRIO OFICIAL)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Carrega sob demanda e mantém em cache na memória os pacotes oficiais gerados
 * em `public/dados/` (servidos com Brotli/Gzip direto pela CDN da Vercel):
 *   - credores-completo.json     (100% dos fornecedores de 2025 + 2026)
 *   - conexoes-empresas-dom.json (100% das conexões CNPJ <-> 222 PDFs DOM-GRU)
 *   - pagamentos-2026.json       (100% dos pagamentos liquidados 2026)
 *   - pagamentos-2025.json       (100% dos pagamentos liquidados 2025)
 * ============================================================================
 */

export interface CredorIntegral {
  chave: string;
  credor: string;
  cnpj: string | null;
  tipo: 'PJ' | 'PF' | 'OUTRO';
  area: string;
  repasseInterno: boolean;
  orgaoPrincipal: string;
  total2025: number;
  qtd2025: number;
  total2026: number;
  qtd2026: number;
  totalConsolidado: number;
  qtdConsolidado: number;
  maiorPagamento: number;
  primeiroPagamento: string | null;
  ultimoPagamento: string | null;
  meses2025: number[];
  meses2026: number[];
  orgaos: { orgao: string; val25: number; qtd25: number; val26: number; qtd26: number }[];
  modalidadePrincipal: string | null;
  contratosRef: string[];
  qtdConexoesDom: number;
  ultimoDomData: string | null;
  ultimoDomCod: number | null;
  ultimoDomUrl: string | null;
}

export type TipoAtoConexaoDom =
  | 'CONTRATO'
  | 'ADITIVO'
  | 'ATA_RP'
  | 'HOMOLOGACAO'
  | 'DISPENSA'
  | 'CONVENIO'
  | 'PORTARIA_FISCAL'
  | 'ATO_OFICIAL';

export interface ConexaoEmpresaDom {
  id: string;
  chave: string;
  credor: string;
  cnpj: string;
  area: string;
  tipoAto: TipoAtoConexaoDom;
  dataIso: string;
  dataBr: string;
  ano: number;
  mes: number;
  codigoDom: number;
  pagina: number;
  valorMencionado: number | null;
  totalPagoTce: number;
  pago2025: number;
  pago2026: number;
  qtdPagamentosTce: number;
  trecho: string;
  pdfUrl: string;
  sha256Pdf: string | null;
}

export interface PagamentoIntegral {
  id: string;
  chave: string;
  ano: 2025 | 2026;
  mes: number;
  data_pagamento: string;
  orgao: string;
  valor_pago: number;
  nr_empenho: string | null;
  descricao: string;
  modalidade_lic: string | null;
  elemento: string | null;
  fonte_url: string;
}

export const ROTULOS_TIPO_ATO_DOM: Record<TipoAtoConexaoDom, string> = {
  CONTRATO: 'Contrato / Extrato',
  ADITIVO: 'Termo Aditivo',
  ATA_RP: 'Ata de Registro de Preços',
  HOMOLOGACAO: 'Homologação / Adjudicação',
  DISPENSA: 'Dispensa / Inexigibilidade',
  CONVENIO: 'Convênio / Gestão',
  PORTARIA_FISCAL: 'Gestor / Fiscal de Contrato',
  ATO_OFICIAL: 'Publicação Oficial no DOM',
};

let cacheCredores: Promise<CredorIntegral[]> | null = null;
let cacheCredoresMapa: Map<string, CredorIntegral> | null = null;
let cacheConexoesDom: Promise<ConexaoEmpresaDom[]> | null = null;
let cachePagamentos26: Promise<Map<string, PagamentoIntegral[]>> | null = null;
let cachePagamentos25: Promise<Map<string, PagamentoIntegral[]>> | null = null;

export async function carregarCredoresCompletos(): Promise<CredorIntegral[]> {
  if (!cacheCredores) {
    cacheCredores = fetch('/dados/credores-completo.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: { orgaos: string[]; itens: any[] }) => {
        const orgaos = json.orgaos || [
          'PREFEITURA MUNICIPAL DE GUARULHOS',
          'CÂMARA MUNICIPAL DE GUARULHOS',
          'INSTITUTO DE PREVID.FUNC.PÚBL.MUNICIPAIS DE GUARULHOS',
        ];
        const lista: CredorIntegral[] = (json.itens || []).map((it) => {
          const ogArr = (it.og || [])
            .map((v: number[], idx: number) => ({
              orgao: orgaos[idx] || orgaos[0],
              val25: Number(v[0] || 0),
              qtd25: Number(v[1] || 0),
              val26: Number(v[2] || 0),
              qtd26: Number(v[3] || 0),
            }))
            .filter((x: any) => x.val25 !== 0 || x.val26 !== 0 || x.qtd25 > 0 || x.qtd26 > 0);

          const t25 = Number(it.t25 || 0);
          const t26 = Number(it.t26 || 0);
          return {
            chave: it.k,
            credor: it.n,
            cnpj: it.c ?? null,
            tipo: it.t ?? 'OUTRO',
            area: it.a ?? 'Administração, Finanças & Legislativo',
            repasseInterno: Boolean(it.r),
            orgaoPrincipal: orgaos[it.o ?? 0] || orgaos[0],
            total2025: t25,
            qtd2025: Number(it.q25 || 0),
            total2026: t26,
            qtd2026: Number(it.q26 || 0),
            totalConsolidado: Math.round((t25 + t26) * 100) / 100,
            qtdConsolidado: Number(it.q25 || 0) + Number(it.q26 || 0),
            maiorPagamento: Number(it.mx || 0),
            primeiroPagamento: it.p1 ?? null,
            ultimoPagamento: it.p2 ?? null,
            meses2025: Array.isArray(it.m25) ? it.m25 : Array(12).fill(0),
            meses2026: Array.isArray(it.m26) ? it.m26 : Array(9).fill(0),
            orgaos: ogArr,
            modalidadePrincipal: it.ml ?? null,
            contratosRef: Array.isArray(it.cr) ? it.cr : [],
            qtdConexoesDom: Number(it.dom || 0),
            ultimoDomData: it.domD ?? null,
            ultimoDomCod: it.domC ?? null,
            ultimoDomUrl: it.domU ?? null,
          };
        });
        cacheCredoresMapa = new Map(lista.map((c) => [c.chave, c]));
        return lista;
      })
      .catch((err) => {
        cacheCredores = null;
        throw err;
      });
  }
  return cacheCredores;
}

export async function obterCredorIntegralPorChave(chave: string): Promise<CredorIntegral | null> {
  await carregarCredoresCompletos();
  return cacheCredoresMapa?.get(chave) ?? null;
}

export async function carregarConexoesDom(): Promise<ConexaoEmpresaDom[]> {
  if (!cacheConexoesDom) {
    cacheConexoesDom = fetch('/dados/conexoes-empresas-dom.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<ConexaoEmpresaDom[]>;
      })
      .catch((err) => {
        cacheConexoesDom = null;
        throw err;
      });
  }
  return cacheConexoesDom;
}

export async function obterConexoesDomDoCredor(chave: string): Promise<ConexaoEmpresaDom[]> {
  const todas = await carregarConexoesDom();
  return todas.filter((c) => c.chave === chave);
}

async function carregarMapaPagamentos(ano: 2025 | 2026): Promise<Map<string, PagamentoIntegral[]>> {
  const url = ano === 2026 ? '/dados/pagamentos-2026.json' : '/dados/pagamentos-2025.json';
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json: { ano: 2025 | 2026; orgaos: string[]; chaves: string[]; rows: any[][] } = await res.json();
  const mapa = new Map<string, PagamentoIntegral[]>();
  const orgaos = json.orgaos || [];
  const chaves = json.chaves || [];

  for (let i = 0; i < json.rows.length; i++) {
    const r = json.rows[i];
    const chave = chaves[r[0]];
    if (!chave) continue;
    const dataIso = String(r[1] || `${ano}-01-01`);
    const mes = Number(dataIso.slice(5, 7)) || 1;
    const item: PagamentoIntegral = {
      id: `${ano}-${i + 1}`,
      chave,
      ano,
      mes,
      data_pagamento: dataIso,
      orgao: orgaos[r[2]] || orgaos[0] || 'PREFEITURA MUNICIPAL DE GUARULHOS',
      valor_pago: Number(r[3] || 0),
      nr_empenho: r[4] || null,
      descricao:
        r[5] ||
        `Pagamento liquidado registrado no TCE-SP (Empenho ${r[4] || 'oficial'} · ${ano})`,
      modalidade_lic: r[6] || null,
      elemento: r[7] || null,
      fonte_url: 'https://transparencia.tce.sp.gov.br/municipio/guarulhos',
    };
    const arr = mapa.get(chave);
    if (arr) arr.push(item);
    else mapa.set(chave, [item]);
  }
  return mapa;
}

export async function carregarPagamentosDoCredor(
  chave: string,
  anoFiltro?: 2025 | 2026 | null
): Promise<PagamentoIntegral[]> {
  if (!cachePagamentos26 && (!anoFiltro || anoFiltro === 2026)) {
    cachePagamentos26 = carregarMapaPagamentos(2026).catch((e) => {
      cachePagamentos26 = null;
      throw e;
    });
  }
  if (!cachePagamentos25 && (!anoFiltro || anoFiltro === 2025)) {
    cachePagamentos25 = carregarMapaPagamentos(2025).catch((e) => {
      cachePagamentos25 = null;
      throw e;
    });
  }

  const partes: PagamentoIntegral[] = [];
  if (!anoFiltro || anoFiltro === 2026) {
    const m26 = await cachePagamentos26!;
    const l26 = m26.get(chave);
    if (l26) partes.push(...l26);
  }
  if (!anoFiltro || anoFiltro === 2025) {
    const m25 = await cachePagamentos25!;
    const l25 = m25.get(chave);
    if (l25) partes.push(...l25);
  }
  return partes.sort((a, b) => b.data_pagamento.localeCompare(a.data_pagamento) || b.valor_pago - a.valor_pago);
}

/** Exporta uma tabela filtrada como planilha CSV compatível com Excel (UTF-8 com BOM e ';'). */
export function exportarCsvPlanilha(
  nomeArquivo: string,
  cabecalhos: string[],
  linhas: (string | number | null | undefined)[][]
): void {
  const esc = (v: unknown) => {
    const s = String(v ?? '').replace(/\r?\n/g, ' ').trim();
    if (s.includes(';') || s.includes('"')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const corpo = [cabecalhos.map(esc).join(';'), ...linhas.map((l) => l.map(esc).join(';'))].join('\r\n');
  const blob = new Blob(['\uFEFF' + corpo], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo.endsWith('.csv') ? nomeArquivo : `${nomeArquivo}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
