/**
 * ============================================================================
 * MOTOR DO QUEBRA-CABEÇA DOCUMENTAL — AUDITORIA CRUZADA DE GUARULHOS
 * ============================================================================
 * Conecta as 4 pontas oficiais do dinheiro e das leis de Guarulhos (2025 e 2026):
 *   1. Legislativo (Câmara Municipal): 140 edições do DOL + projetos e normas.
 *   2. Leis Sancionadas (DOM-GRU): 191 leis municipais extraídas dos PDFs.
 *   3. Mudanças no Orçamento (DOM-GRU): 708 decretos suplementares (Art. 2º → Art. 1º).
 *   4. Pagamento Real na Ponta (TCE-SP): 66.407 pagamentos a fornecedores (até Set/2026).
 * ============================================================================
 */

import {
  ACERVO_DIARIOS_EXECUTIVO,
  ACERVO_DIARIOS_LEGISLATIVO,
  ATOS_LEGISLATIVOS_RECENTES,
  CATALOGO_DECRETOS_SUPLEMENTARES_REAIS,
  LEIS_MUNICIPAIS_SANCIONADAS_REAIS,
  type AtoLegislativoRecente,
  type DecretoSuplementarReal,
  type EdicaoDiarioLegislativoReal,
  type EdicaoDiarioReal,
  type LeiMunicipalSancionadaReal,
} from './diariosCatalogoReal';
import { DECRETOS_ORCAMENTARIOS_AUDITADOS, type DecretoOrcamentarioAuditado } from './decretosOrcamentarios';
import { SNAPSHOT_TCE_GUARULHOS_2026 } from '@/database/contingenciaOficialGuarulhos';
import { SNAPSHOT_TCE_GUARULHOS_2025 } from '@/database/contingenciaOficialGuarulhos2025';

export interface FornecedorPontaResumo {
  chave: string;
  nome: string;
  cnpj: string | null;
  pago2025: number;
  pago2026: number;
  pagoTotal: number;
  qtdPagamentos: number;
}

export interface TrilhaQuebraCabecaArea {
  id: string;
  areaNome: string;
  resumoCidadao: string;
  filtroDespesas: string;
  // Peça 1 & 2: Leis e Projetos
  leisRelacionadas: LeiMunicipalSancionadaReal[];
  projetosCamara: AtoLegislativoRecente[];
  // Peça 3: Decretos Suplementares
  decretosDetalhados: DecretoOrcamentarioAuditado[];
  qtdDecretosCatalogo: number;
  valorDecretosCatalogo: number;
  // Peça 4: Execução Real TCE-SP (2025 + Jan–Set 2026)
  pago2025: number;
  pago2026: number;
  pagoConsolidado: number;
  qtdPagamentosConsolidado: number;
  principaisFornecedores: FornecedorPontaResumo[];
}

export interface DiaCruzadoExecutivoLegislativo {
  dataIso: string;
  dataBr: string;
  ano: number;
  mes: number;
  executivo: EdicaoDiarioReal | null;
  legislativo: EdicaoDiarioLegislativoReal[];
  decretosNoDia: DecretoSuplementarReal[];
  somaDecretosNoDia: number;
  leisNoDia: LeiMunicipalSancionadaReal[];
  atosCamaraNoDia: AtoLegislativoRecente[];
  temAmbosPoderes: boolean;
}

interface ConfigTrilha {
  id: string;
  areaSnapshot: string;
  resumoCidadao: string;
  filtroDespesas: string;
  termosLeiProjeto: RegExp;
  termosDecretoTrecho: RegExp;
  idsDecretosAuditados: string[];
}

const CONFIG_TRILHAS: ConfigTrilha[] = [
  {
    id: 'saude',
    areaSnapshot: 'Saúde & Hospitais',
    resumoCidadao: 'Hospitais municipais (HMU, HMPB, HMCA), UPAs 24h, UBSs, medicamentos e contratos de gestão em saúde.',
    filtroDespesas: 'HOSPITAL',
    termosLeiProjeto: /sa[úu]de|hospital|obst[ée]trica|parto|m[ée]dic|enferm|sus|vacina|farm[áa]cia|upa|ubs|autismo|defici[êe]ncia/i,
    termosDecretoTrecho: /0791\.|30001|3100000|sa[úu]de|1111\.202/i,
    idsDecretosAuditados: ['dec-44655-2026', 'dec-44629-2026', 'dec-44591-2026'],
  },
  {
    id: 'educacao',
    areaSnapshot: 'Educação & Creches',
    resumoCidadao: 'Escolas da Prefeitura (EPGs), creches parceiras, alimentação escolar (merenda), uniformes e folha FUNDEB.',
    filtroDespesas: 'EDUCACAO',
    termosLeiProjeto: /educa[çc][ãa]o|escola|alfabetiza[çc][ãa]o|leia\+|creche|ensino|estudante|professor|magist[ée]rio|merenda/i,
    termosDecretoTrecho: /0810\.|261000|220000|alimenta[çc][ãa]o escolar|ensino|1118\.202/i,
    idsDecretosAuditados: ['dec-44681-2026'],
  },
  {
    id: 'zeladoria-obras',
    areaSnapshot: 'Limpeza Urbana, Obras & Bairros',
    resumoCidadao: 'Coleta de lixo, varrição, iluminação pública, drenagem, pavimentação, meio ambiente e proteção animal.',
    filtroDespesas: 'SANEAMENTO',
    termosLeiProjeto: /urbana|obras|limpeza|res[íi]duos|ambiental|animal|ilumina[çc][ãa]o|habita[çc][ãa]o|moradia|pra[çc]a|bairro/i,
    termosDecretoTrecho: /3710\.|1810\.|15452|infraestrutura urbana|prote[çc][ãa]o animal|saneamento/i,
    idsDecretosAuditados: ['dec-44607-2026', 'dec-44513-2026'],
  },
  {
    id: 'transporte',
    areaSnapshot: 'Transporte & Trânsito',
    resumoCidadao: 'Subsídio tarifário de ônibus, corredores viários, sinalização e fiscalização eletrônica de trânsito (FMTT).',
    filtroDespesas: 'VIACAO',
    termosLeiProjeto: /transporte|tr[âa]nsito|vi[áa]ria|ve[íi]culo|[ôo]nibus|mobilidade|condutor|estacionamento/i,
    termosDecretoTrecho: /1091\.|4000001|fmtt|fiscaliza[çc][ãa]o vi[áa]ria|transporte|1124\.202/i,
    idsDecretosAuditados: ['dec-44643-2026'],
  },
  {
    id: 'administracao-precatorios',
    areaSnapshot: 'Administração, Finanças & Legislativo',
    resumoCidadao: 'Gestão das secretarias, Câmara Municipal, precatórios judiciais (TJSP), dívida pública, esporte e segurança.',
    filtroDespesas: 'TRIBUNAL',
    termosLeiProjeto: /servidor|carreira|sal[áa]rio|guarda|seguran[çc]a|or[çc]ament|tribut|administra|esport/i,
    termosDecretoTrecho: /8010\.|1410\.|3610\.|1710\.|precat[óo]rios|senten[çc]as|esport/i,
    idsDecretosAuditados: ['dec-44622-2026', 'dec-44614-2026'],
  },
];

let cacheTrilhas: TrilhaQuebraCabecaArea[] | null = null;
let cacheDiasCruzados: DiaCruzadoExecutivoLegislativo[] | null = null;

export function obterTrilhasQuebraCabeca(): TrilhaQuebraCabecaArea[] {
  if (cacheTrilhas) return cacheTrilhas;

  const areas25 = SNAPSHOT_TCE_GUARULHOS_2025.despesas.porArea as any[];
  const areas26 = SNAPSHOT_TCE_GUARULHOS_2026.despesas.porArea as any[];
  const creds25 = SNAPSHOT_TCE_GUARULHOS_2025.despesas.credores as any[];
  const creds26 = SNAPSHOT_TCE_GUARULHOS_2026.despesas.credores as any[];

  cacheTrilhas = CONFIG_TRILHAS.map((cfg) => {
    const a25 = areas25.find((a) => a.area === cfg.areaSnapshot);
    const a26 = areas26.find((a) => a.area === cfg.areaSnapshot);
    const pago2025 = Number(a25?.total_liquido ?? 0);
    const pago2026 = Number(a26?.total_liquido ?? 0);
    const qtdPag = Number(a25?.qtd_pagamentos ?? 0) + Number(a26?.qtd_pagamentos ?? 0);

    // Consolida principais fornecedores externos (não repasse interno) desta área
    const mapaForn = new Map<string, FornecedorPontaResumo>();
    for (const c of creds25) {
      if (c.area !== cfg.areaSnapshot || c.repasse_interno) continue;
      mapaForn.set(c.chave, {
        chave: c.chave,
        nome: c.credor,
        cnpj: c.cnpj_credor ?? null,
        pago2025: c.total_liquido,
        pago2026: 0,
        pagoTotal: c.total_liquido,
        qtdPagamentos: c.qtd,
      });
    }
    for (const c of creds26) {
      if (c.area !== cfg.areaSnapshot || c.repasse_interno) continue;
      const at = mapaForn.get(c.chave);
      if (!at) {
        mapaForn.set(c.chave, {
          chave: c.chave,
          nome: c.credor,
          cnpj: c.cnpj_credor ?? null,
          pago2025: 0,
          pago2026: c.total_liquido,
          pagoTotal: c.total_liquido,
          qtdPagamentos: c.qtd,
        });
      } else {
        at.pago2026 = c.total_liquido;
        at.pagoTotal = Math.round((at.pago2025 + c.total_liquido) * 100) / 100;
        at.qtdPagamentos += c.qtd;
      }
    }

    const principaisFornecedores = [...mapaForn.values()]
      .sort((a, b) => b.pagoTotal - a.pagoTotal)
      .slice(0, 4);

    const leisRelacionadas = LEIS_MUNICIPAIS_SANCIONADAS_REAIS.filter(
      (l) => cfg.termosLeiProjeto.test(l.ementa) || cfg.termosLeiProjeto.test(l.autoria)
    ).slice(0, 4);

    const projetosCamara = ATOS_LEGISLATIVOS_RECENTES.filter((p) =>
      cfg.termosLeiProjeto.test(p.resumo) || cfg.termosLeiProjeto.test(p.titulo)
    ).slice(0, 3);

    const decretosDetalhados = DECRETOS_ORCAMENTARIOS_AUDITADOS.filter((d) =>
      cfg.idsDecretosAuditados.includes(d.id)
    );

    const decsCat = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter((d) => cfg.termosDecretoTrecho.test(d.trecho));
    const somaDecsCat = decsCat.reduce((s, d) => s + d.valor, 0);

    return {
      id: cfg.id,
      areaNome: cfg.areaSnapshot,
      resumoCidadao: cfg.resumoCidadao,
      filtroDespesas: cfg.filtroDespesas,
      leisRelacionadas,
      projetosCamara,
      decretosDetalhados,
      qtdDecretosCatalogo: Math.max(decsCat.length, decretosDetalhados.length),
      valorDecretosCatalogo: Math.max(
        Math.round(somaDecsCat * 100) / 100,
        decretosDetalhados.reduce((s, d) => s + d.valorTotal, 0)
      ),
      pago2025: Math.round(pago2025 * 100) / 100,
      pago2026: Math.round(pago2026 * 100) / 100,
      pagoConsolidado: Math.round((pago2025 + pago2026) * 100) / 100,
      qtdPagamentosConsolidado: qtdPag,
      principaisFornecedores,
    };
  });

  return cacheTrilhas;
}

export function obterLinhaDoTempoUnificada(): DiaCruzadoExecutivoLegislativo[] {
  if (cacheDiasCruzados) return cacheDiasCruzados;

  const mapa = new Map<string, DiaCruzadoExecutivoLegislativo>();

  const garantirDia = (dataIso: string, dataBrFallback?: string): DiaCruzadoExecutivoLegislativo => {
    let d = mapa.get(dataIso);
    if (!d) {
      const [y, m, dia] = dataIso.split('-');
      d = {
        dataIso,
        dataBr: dataBrFallback || `${dia}/${m}/${y}`,
        ano: Number(y),
        mes: Number(m),
        executivo: null,
        legislativo: [],
        decretosNoDia: [],
        somaDecretosNoDia: 0,
        leisNoDia: [],
        atosCamaraNoDia: [],
        temAmbosPoderes: false,
      };
      mapa.set(dataIso, d);
    }
    return d;
  };

  for (const ed of ACERVO_DIARIOS_EXECUTIVO) {
    const d = garantirDia(ed.dataPublicacao, ed.dataBr);
    d.executivo = ed;
  }

  for (const dol of ACERVO_DIARIOS_LEGISLATIVO) {
    const d = garantirDia(dol.dataPublicacao, dol.dataBr);
    d.legislativo.push(dol);
  }

  for (const dec of CATALOGO_DECRETOS_SUPLEMENTARES_REAIS) {
    const d = garantirDia(dec.dataIso, dec.dataBr);
    d.decretosNoDia.push(dec);
    d.somaDecretosNoDia = Math.round((d.somaDecretosNoDia + dec.valor) * 100) / 100;
  }

  for (const lei of LEIS_MUNICIPAIS_SANCIONADAS_REAIS) {
    const d = garantirDia(lei.dataIso, lei.dataBr);
    d.leisNoDia.push(lei);
  }

  for (const ato of ATOS_LEGISLATIVOS_RECENTES) {
    const d = garantirDia(ato.dataIso, ato.dataBr);
    d.atosCamaraNoDia.push(ato);
  }

  for (const d of mapa.values()) {
    d.temAmbosPoderes = Boolean(d.executivo && d.legislativo.length > 0);
  }

  cacheDiasCruzados = [...mapa.values()].sort((a, b) => b.dataIso.localeCompare(a.dataIso));
  return cacheDiasCruzados;
}
