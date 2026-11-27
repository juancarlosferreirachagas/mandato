
/**
 * ============================================================================
 * CENTRAL DE DIÁRIOS OFICIAIS (EXECUTIVO + LEGISLATIVO), LEIS, DECRETOS
 * E QUEBRA-CABEÇA COMPLETO DE AUDITORIA — FISCALIZA GUARULHOS
 * Rota: /decretos
 * ============================================================================
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  ArrowRightLeft,
  ArrowUpNarrowWide,
  ArrowUpRight,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  Filter,
  Gavel,
  HardDrive,
  Landmark,
  Layers,
  Puzzle,
  RefreshCw,
  Scale,
  ScrollText,
  Search,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  calcularResumoDecretos,
  DECRETOS_ORCAMENTARIOS_AUDITADOS,
  type DecretoOrcamentarioAuditado,
  type TipoOrigemRecursoDecreto,
} from '@/domain/decretosOrcamentarios';
import {
  ACERVO_DIARIOS_EXECUTIVO,
  ACERVO_DIARIOS_LEGISLATIVO,
  CATALOGO_DECRETOS_SUPLEMENTARES_REAIS,
  DOCS_INSTITUCIONAIS_LEGISLATIVO,
  EXTRATOS_CONTRATOS_DOM_REAIS,
  LEIS_MUNICIPAIS_SANCIONADAS_REAIS,
  RESUMO_VALIDACAO_ACERVO,
  type DecretoSuplementarReal,
  type EdicaoDiarioLegislativoReal,
  type EdicaoDiarioReal,
  type ExtratoContratoDomReal,
  type LeiMunicipalSancionadaReal,
} from '@/domain/diariosCatalogoReal';
import {
  obterLinhaDoTempoUnificada,
  obterTrilhasQuebraCabeca,
} from '@/domain/quebraCabecaAuditoria';
import { IconeArea } from '../components/AreasOrcamento';
import { verificarFontesEmTempoReal } from '@/services/auditoriaTempoRealService';
import { StatusBanco } from '../components/StatusFontes';
import { PaginacaoModerna } from '../components/PaginacaoModerna';
import { PainelIndicadoresAuditoria } from '../components/PainelIndicadoresAuditoria';
import { PainelRaioX } from '../components/PainelRaioX';
import { exportarCsvPlanilha } from '@/services/baseIntegralService';
import { RESUMO_CONEXOES_OFICIAIS } from '@/database/resumoConexoesOficiais';
import { urlPdfOficialSegura } from '@/domain/seguranca';
import { useAsync } from '../hooks/useAsync';
import { brl, brlCompacto, dataBr, dataHoraBr, formatarCnpj, inteiro, mesAbrev, mesNome, nomeLegivel } from '../format';
import {
  PAGINAS_EXECUTIVO_TOTAL,
  QTD_DECRETOS,
  QTD_DECRETOS_REMANEJAMENTO,
  QTD_DECRETOS_SUPLEMENTARES,
  QTD_DIARIOS,
  QTD_DIARIOS_EXECUTIVO,
  QTD_DIARIOS_LEGISLATIVO,
  QTD_EXTRATOS_CONTRATOS,
  QTD_LEIS_SANCIONADAS,
  QTD_PDFS_EXECUTIVO,
  TAMANHO_ACERVO_MB,
} from '@/domain/plataforma';

type AbaAuditoria =
  | 'quebra_cabeca'
  | 'decretos_fluxo'
  | 'catalogo_decretos'
  | 'diarios_oficiais'
  | 'fontes_tempo_real';

type OrdemDecretos = 'RECENTES' | 'MAIOR_VALOR' | 'ANTIGOS';
type OrdemDiarios = 'RECENTES' | 'ANTIGOS' | 'MAIS_PAGINAS';
type EscopoAcervo = 'TODOS_DIARIOS' | 'EXECUTIVO' | 'LEGISLATIVO' | 'LEIS' | 'CONTRATOS';
type FiltroLinhaUnificada = 'TODOS' | 'AMBOS_PODERES' | 'COM_DECRETOS' | 'COM_LEIS';

const FILTROS_MODALIDADE: { id: 'TODOS' | TipoOrigemRecursoDecreto; label: string }[] = [
  { id: 'TODOS', label: 'Todos detalhados' },
  { id: 'ANULACAO_DOTACAO', label: 'Redução / Anulação' },
  { id: 'EXCESSO_ARRECADACAO', label: 'Excesso de arrecadação' },
  { id: 'REMANEJAMENTO_INTERNO', label: 'Remanejamento interno' },
];

const ABA_PARA_PARAM: Record<AbaAuditoria, string> = {
  quebra_cabeca: 'quebra-cabeca',
  decretos_fluxo: 'fluxo',
  catalogo_decretos: 'decretos',
  diarios_oficiais: 'diarios',
  fontes_tempo_real: 'fontes',
};

const PARAM_PARA_ABA: Record<string, AbaAuditoria> = {
  'quebra-cabeca': 'quebra_cabeca',
  fluxo: 'decretos_fluxo',
  decretos: 'catalogo_decretos',
  diarios: 'diarios_oficiais',
  fontes: 'fontes_tempo_real',
};

function formatarBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function DecretosAuditoriaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const decretoDestaqueId = searchParams.get('decreto');
  const abaParam = searchParams.get('aba');

  const abaAtiva: AbaAuditoria = decretoDestaqueId
    ? 'decretos_fluxo'
    : (abaParam && PARAM_PARA_ABA[abaParam]) || 'quebra_cabeca';

  const setAbaAtiva = (novaAba: AbaAuditoria) => {
    const p = new URLSearchParams(searchParams);
    p.set('aba', ABA_PARA_PARAM[novaAba]);
    if (novaAba !== 'decretos_fluxo') p.delete('decreto');
    setSearchParams(p, { replace: true });
  };

  // Visualizador de PDF integrado (Modal / Bottom-sheet no celular)
  const [pdfPreview, setPdfPreview] = useState<{
    titulo: string;
    subtitulo: string;
    url: string;
    sha256?: string | null;
  } | null>(null);

  const [decretoSelecionado, setDecretoSelecionado] = useState<DecretoOrcamentarioAuditado | null>(null);
  const [decretoCatalogoRaioX, setDecretoCatalogoRaioX] = useState<DecretoSuplementarReal | null>(null);
  const [leiRaioX, setLeiRaioX] = useState<LeiMunicipalSancionadaReal | null>(null);
  const [hashCopiado, setHashCopiado] = useState<string | null>(null);

  const copiarHash = (hash: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(hash).catch(() => {});
    }
    setHashCopiado(hash);
    window.setTimeout(() => setHashCopiado((at) => (at === hash ? null : at)), 2000);
  };

  // Estado Aba 1: Quebra-Cabeça da Auditoria
  const trilhasQuebraCabeca = useMemo(() => obterTrilhasQuebraCabeca(), []);
  const diasUnificados = useMemo(() => obterLinhaDoTempoUnificada(), []);
  const [trilhaAtivaId, setTrilhaAtivaId] = useState<string>(trilhasQuebraCabeca[0]?.id ?? 'saude');
  const [filtroLinhaUnificada, setFiltroLinhaUnificada] = useState<FiltroLinhaUnificada>('AMBOS_PODERES');
  const [buscaLinhaUnificada, setBuscaLinhaUnificada] = useState('');
  const [qtdDiasVisiveis, setQtdDiasVisiveis] = useState(14);

  // Estado Aba 2: Fluxo Contábil Detalhado
  const [filtroModalidade, setFiltroModalidade] = useState<'TODOS' | TipoOrigemRecursoDecreto>('TODOS');
  const [buscaFluxo, setBuscaFluxo] = useState('');

  // Estado Aba 3: Todos os Decretos Orçamentários
  const [anoCatalogo, setAnoCatalogo] = useState<'TODOS' | 2026 | 2025>('TODOS');
  const [modalidadeCatalogo, setModalidadeCatalogo] = useState<'TODOS' | 'SUPLEMENTAR' | 'REMANEJAMENTO'>('TODOS');
  const [mesCatalogo, setMesCatalogo] = useState<number | null>(null);
  const [ordemDecretos, setOrdemDecretos] = useState<OrdemDecretos>('RECENTES');
  const [buscaCatalogo, setBuscaCatalogo] = useState('');
  const [pagCatalogo, setPagCatalogo] = useState(1);

  // Estado Aba 4: Diários Oficiais (Executivo + Legislativo) e Leis
  const [escopoAcervo, setEscopoAcervo] = useState<EscopoAcervo>('TODOS_DIARIOS');
  const [anoDiario, setAnoDiario] = useState<'TODOS' | 2026 | 2025>('TODOS');
  const [mesDiario, setMesDiario] = useState<number | null>(null);
  const [ordemDiarios, setOrdemDiarios] = useState<OrdemDiarios>('RECENTES');
  const [buscaDiario, setBuscaDiario] = useState('');
  const [pagDiario, setPagDiario] = useState(1);

  // Rola até o decreto destacado quando o usuário chega por /decretos?decreto=...
  useEffect(() => {
    if (!decretoDestaqueId) return;
    const el = document.getElementById(decretoDestaqueId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [decretoDestaqueId]);

  // Fecha modais com Esc e trava rolagem de fundo
  useEffect(() => {
    if (!pdfPreview && !decretoSelecionado) return;
    document.body.classList.add('fg-lock');
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPdfPreview(null);
        setDecretoSelecionado(null);
      }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => {
      document.body.classList.remove('fg-lock');
      window.removeEventListener('keydown', aoTeclar);
    };
  }, [pdfPreview, decretoSelecionado]);

  // Telemetria em tempo real
  const [cicloVerificacao, setCicloVerificacao] = useState(0);
  const { data: relatorioTempoReal, loading: verificandoFontes } = useAsync(
    () => verificarFontesEmTempoReal(2026),
    [cicloVerificacao]
  );

  const resumoDecretos = useMemo(() => calcularResumoDecretos(DECRETOS_ORCAMENTARIOS_AUDITADOS), []);

  const statsCatalogo = useMemo(() => {
    const d26 = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter((d) => d.ano === 2026);
    const d25 = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter((d) => d.ano === 2025);
    return {
      qtd2026: d26.length,
      qtd2025: d25.length,
      exec2026: ACERVO_DIARIOS_EXECUTIVO.filter((e) => e.ano === 2026).length,
      exec2025: ACERVO_DIARIOS_EXECUTIVO.filter((e) => e.ano === 2025).length,
      leg2026: ACERVO_DIARIOS_LEGISLATIVO.filter((e) => e.ano === 2026).length,
      leg2025: ACERVO_DIARIOS_LEGISLATIVO.filter((e) => e.ano === 2025).length,
      leis2026: LEIS_MUNICIPAIS_SANCIONADAS_REAIS.filter((l) => l.ano === 2026).length,
      leis2025: LEIS_MUNICIPAIS_SANCIONADAS_REAIS.filter((l) => l.ano === 2025).length,
    };
  }, []);

  // Mapas rápidos por Data ISO para cruzamento instantâneo
  const { decretosPorDataIso, leisPorDataIso, dolPorDataIso, domPorDataIso } = useMemo(() => {
    const mDec = new Map<string, DecretoSuplementarReal[]>();
    for (const d of CATALOGO_DECRETOS_SUPLEMENTARES_REAIS) {
      const l = mDec.get(d.dataIso) ?? [];
      l.push(d);
      mDec.set(d.dataIso, l);
    }
    const mLei = new Map<string, LeiMunicipalSancionadaReal[]>();
    for (const lei of LEIS_MUNICIPAIS_SANCIONADAS_REAIS) {
      const l = mLei.get(lei.dataIso) ?? [];
      l.push(lei);
      mLei.set(lei.dataIso, l);
    }
    const mDol = new Map<string, EdicaoDiarioLegislativoReal[]>();
    for (const dol of ACERVO_DIARIOS_LEGISLATIVO) {
      const l = mDol.get(dol.dataPublicacao) ?? [];
      l.push(dol);
      mDol.set(dol.dataPublicacao, l);
    }
    const mDom = new Map<string, EdicaoDiarioReal>();
    for (const dom of ACERVO_DIARIOS_EXECUTIVO) {
      mDom.set(dom.dataPublicacao, dom);
    }
    return { decretosPorDataIso: mDec, leisPorDataIso: mLei, dolPorDataIso: mDol, domPorDataIso: mDom };
  }, []);

  // --------------------------------------------------------------------------
  // ABA 1: Quebra-Cabeça da Auditoria + Linha do Tempo Unificada
  // --------------------------------------------------------------------------
  const trilhaSelecionada = useMemo(
    () => trilhasQuebraCabeca.find((t) => t.id === trilhaAtivaId) ?? trilhasQuebraCabeca[0],
    [trilhasQuebraCabeca, trilhaAtivaId]
  );

  const diasUnificadosFiltrados = useMemo(() => {
    const termo = buscaLinhaUnificada.trim().toLowerCase();
    return diasUnificados.filter((d) => {
      if (filtroLinhaUnificada === 'AMBOS_PODERES' && !d.temAmbosPoderes) return false;
      if (filtroLinhaUnificada === 'COM_DECRETOS' && d.decretosNoDia.length === 0) return false;
      if (filtroLinhaUnificada === 'COM_LEIS' && d.leisNoDia.length === 0) return false;
      if (!termo) return true;
      return (
        d.dataBr.includes(termo) ||
        (d.executivo && String(d.executivo.codigoDom).includes(termo)) ||
        d.legislativo.some((x) => String(x.numeroEdicao ?? '').includes(termo) || (x.protocolo ?? '').includes(termo)) ||
        d.decretosNoDia.some((x) => x.numero.includes(termo) || x.numeroFmt.includes(termo)) ||
        d.leisNoDia.some((x) => x.numero.includes(termo) || x.numeroFmt.includes(termo) || x.ementa.toLowerCase().includes(termo))
      );
    });
  }, [diasUnificados, filtroLinhaUnificada, buscaLinhaUnificada]);

  // --------------------------------------------------------------------------
  // ABA 2: Fluxo Contábil Detalhado
  // --------------------------------------------------------------------------
  const decretosFluxoFiltrados = useMemo(() => {
    const termo = buscaFluxo.trim().toLowerCase();
    return DECRETOS_ORCAMENTARIOS_AUDITADOS.filter((d) => {
      if (filtroModalidade !== 'TODOS' && d.tipoOrigem !== filtroModalidade) return false;
      if (!termo) return true;
      const txt = [
        d.numeroDecreto,
        d.edicaoDiarioOficial,
        d.tituloObjetivo,
        d.resumoExplicativo,
        ...d.origens.map((o) => `${o.orgaoOrigem} ${o.dotacaoCodigo} ${o.acaoProgramatica}`),
        ...d.destinos.map((dest) => `${dest.orgaoDestino} ${dest.areaTematica} ${dest.dotacaoCodigo} ${dest.acaoProgramatica}`),
      ]
        .join(' ')
        .toLowerCase();
      return txt.includes(termo);
    });
  }, [filtroModalidade, buscaFluxo]);

  // --------------------------------------------------------------------------
  // ABA 3: Todos os 708 Decretos Suplementares
  // --------------------------------------------------------------------------
  const resumoMensalDecretos = useMemo(() => {
    const baseAno = anoCatalogo === 'TODOS' ? 2026 : anoCatalogo;
    const mapa = new Map<number, { mes: number; qtd: number; valor: number }>();
    for (let m = 1; m <= (baseAno === 2026 ? 11 : 12); m++) {
      mapa.set(m, { mes: m, qtd: 0, valor: 0 });
    }
    for (const d of CATALOGO_DECRETOS_SUPLEMENTARES_REAIS) {
      if (d.ano !== baseAno) continue;
      const item = mapa.get(d.mes) ?? { mes: d.mes, qtd: 0, valor: 0 };
      item.qtd += 1;
      item.valor += d.valor;
      mapa.set(d.mes, item);
    }
    return [...mapa.values()].sort((a, b) => a.mes - b.mes);
  }, [anoCatalogo]);

  const maxValorMesDecreto = useMemo(
    () => Math.max(...resumoMensalDecretos.map((m) => m.valor), 1),
    [resumoMensalDecretos]
  );

  const catalogoFiltradoEOrdenado = useMemo(() => {
    const termo = buscaCatalogo.trim().toLowerCase();
    const filtrados = CATALOGO_DECRETOS_SUPLEMENTARES_REAIS.filter((d) => {
      if (anoCatalogo !== 'TODOS' && d.ano !== anoCatalogo) return false;
      const mod = d.modalidade ?? 'SUPLEMENTAR';
      if (modalidadeCatalogo !== 'TODOS' && mod !== modalidadeCatalogo) return false;
      if (mesCatalogo !== null && d.mes !== mesCatalogo) return false;
      if (!termo) return true;
      return (
        d.numero.toLowerCase().includes(termo) ||
        d.numeroFmt.toLowerCase().includes(termo) ||
        d.dataBr.includes(termo) ||
        d.valorFmt.toLowerCase().includes(termo) ||
        d.trecho.toLowerCase().includes(termo) ||
        (d.tituloSimples ?? '').toLowerCase().includes(termo) ||
        (d.destinoResumo ?? '').toLowerCase().includes(termo) ||
        (d.origemResumo ?? '').toLowerCase().includes(termo) ||
        (d.textoIntegral ?? '').toLowerCase().includes(termo)
      );
    });

    const copia = [...filtrados];
    if (ordemDecretos === 'RECENTES') {
      copia.sort((a, b) => b.dataIso.localeCompare(a.dataIso) || b.numeroInt - a.numeroInt);
    } else if (ordemDecretos === 'ANTIGOS') {
      copia.sort((a, b) => a.dataIso.localeCompare(b.dataIso) || a.numeroInt - b.numeroInt);
    } else {
      copia.sort((a, b) => b.valor - a.valor || b.dataIso.localeCompare(a.dataIso));
    }
    return copia;
  }, [anoCatalogo, modalidadeCatalogo, mesCatalogo, buscaCatalogo, ordemDecretos]);

  const LIMIT_CATALOGO = 24;
  const catalogoVisivel = catalogoFiltradoEOrdenado.slice(
    (pagCatalogo - 1) * LIMIT_CATALOGO,
    pagCatalogo * LIMIT_CATALOGO
  );
  const somaCatalogoFiltrado = useMemo(
    () => catalogoFiltradoEOrdenado.reduce((acc, d) => acc + d.valor, 0),
    [catalogoFiltradoEOrdenado]
  );

  // --------------------------------------------------------------------------
  // ABA 4: Diários Oficiais Unificados (Executivo + Legislativo) e Leis
  // --------------------------------------------------------------------------
  type ItemAcervoUnificado =
    | { tipo: 'EXECUTIVO'; dataIso: string; dataBr: string; ano: number; mes: number; paginas: number; ed: EdicaoDiarioReal }
    | { tipo: 'LEGISLATIVO'; dataIso: string; dataBr: string; ano: number; mes: number; paginas: number; dol: EdicaoDiarioLegislativoReal }
    | { tipo: 'LEI'; dataIso: string; dataBr: string; ano: number; mes: number; paginas: number; lei: LeiMunicipalSancionadaReal }
    | { tipo: 'CONTRATO'; dataIso: string; dataBr: string; ano: number; mes: number; paginas: number; ext: ExtratoContratoDomReal };

  const acervoUnificadoFiltrado = useMemo(() => {
    const termo = buscaDiario.trim().toLowerCase();
    const lista: ItemAcervoUnificado[] = [];

    if (escopoAcervo === 'TODOS_DIARIOS' || escopoAcervo === 'EXECUTIVO') {
      for (const ed of ACERVO_DIARIOS_EXECUTIVO) {
        if (anoDiario !== 'TODOS' && ed.ano !== anoDiario) continue;
        if (mesDiario !== null && ed.mes !== mesDiario) continue;
        if (termo) {
          const decs = decretosPorDataIso.get(ed.dataPublicacao) ?? [];
          const leis = leisPorDataIso.get(ed.dataPublicacao) ?? [];
          const bate =
            String(ed.codigoDom).includes(termo) ||
            ed.dataBr.includes(termo) ||
            (ed.sha256Principal ?? '').toLowerCase().includes(termo) ||
            decs.some((d) => d.numero.includes(termo) || d.numeroFmt.includes(termo)) ||
            leis.some((l) => l.numero.includes(termo) || l.numeroFmt.includes(termo) || l.ementa.toLowerCase().includes(termo));
          if (!bate) continue;
        }
        lista.push({
          tipo: 'EXECUTIVO',
          dataIso: ed.dataPublicacao,
          dataBr: ed.dataBr,
          ano: ed.ano,
          mes: ed.mes,
          paginas: ed.totalPaginas,
          ed,
        });
      }
    }

    if (escopoAcervo === 'TODOS_DIARIOS' || escopoAcervo === 'LEGISLATIVO') {
      for (const dol of ACERVO_DIARIOS_LEGISLATIVO) {
        if (anoDiario !== 'TODOS' && dol.ano !== anoDiario) continue;
        if (mesDiario !== null && dol.mes !== mesDiario) continue;
        if (termo) {
          const bate =
            String(dol.numeroEdicao ?? '').includes(termo) ||
            dol.dataBr.includes(termo) ||
            (dol.protocolo ?? '').includes(termo) ||
            dol.titulo.toLowerCase().includes(termo);
          if (!bate) continue;
        }
        lista.push({
          tipo: 'LEGISLATIVO',
          dataIso: dol.dataPublicacao,
          dataBr: dol.dataBr,
          ano: dol.ano,
          mes: dol.mes,
          paginas: 1,
          dol,
        });
      }
    }

    if (escopoAcervo === 'LEIS') {
      for (const lei of LEIS_MUNICIPAIS_SANCIONADAS_REAIS) {
        if (anoDiario !== 'TODOS' && lei.ano !== anoDiario) continue;
        if (mesDiario !== null && lei.mes !== mesDiario) continue;
        if (termo) {
          const bate =
            lei.numero.toLowerCase().includes(termo) ||
            lei.numeroFmt.toLowerCase().includes(termo) ||
            lei.dataBr.includes(termo) ||
            lei.autoria.toLowerCase().includes(termo) ||
            lei.ementa.toLowerCase().includes(termo) ||
            (lei.tituloSimples ?? '').toLowerCase().includes(termo) ||
            (lei.tema ?? '').toLowerCase().includes(termo) ||
            (lei.autorLimpo ?? '').toLowerCase().includes(termo);
          if (!bate) continue;
        }
        lista.push({
          tipo: 'LEI',
          dataIso: lei.dataIso,
          dataBr: lei.dataBr,
          ano: lei.ano,
          mes: lei.mes,
          paginas: 1,
          lei,
        });
      }
    }

    if (escopoAcervo === 'CONTRATOS') {
      for (const ext of EXTRATOS_CONTRATOS_DOM_REAIS) {
        if (anoDiario !== 'TODOS' && ext.ano !== anoDiario) continue;
        if (mesDiario !== null && ext.mes !== mesDiario) continue;
        if (termo) {
          const bate =
            ext.contratada.toLowerCase().includes(termo) ||
            ext.objeto.toLowerCase().includes(termo) ||
            ext.tipo.toLowerCase().includes(termo) ||
            ext.dataBr.includes(termo) ||
            String(ext.codigoDom).includes(termo);
          if (!bate) continue;
        }
        lista.push({
          tipo: 'CONTRATO',
          dataIso: ext.dataIso,
          dataBr: ext.dataBr,
          ano: ext.ano,
          mes: ext.mes,
          paginas: 1,
          ext,
        });
      }
    }

    if (ordemDiarios === 'RECENTES') {
      lista.sort((a, b) => b.dataIso.localeCompare(a.dataIso) || (a.tipo === 'EXECUTIVO' ? -1 : 1));
    } else if (ordemDiarios === 'ANTIGOS') {
      lista.sort((a, b) => a.dataIso.localeCompare(b.dataIso) || (a.tipo === 'EXECUTIVO' ? -1 : 1));
    } else {
      lista.sort((a, b) => b.paginas - a.paginas || b.dataIso.localeCompare(a.dataIso));
    }

    return lista;
  }, [escopoAcervo, anoDiario, mesDiario, buscaDiario, ordemDiarios, decretosPorDataIso, leisPorDataIso]);

  const LIMIT_DIARIOS = 24;
  const acervoVisivel = acervoUnificadoFiltrado.slice(
    (pagDiario - 1) * LIMIT_DIARIOS,
    pagDiario * LIMIT_DIARIOS
  );

  const resumoMensalAcervo = useMemo(() => {
    const baseAno = anoDiario === 'TODOS' ? 2026 : anoDiario;
    const mapa = new Map<number, { mes: number; exec: number; leg: number; total: number }>();
    for (let m = 1; m <= (baseAno === 2026 ? 11 : 12); m++) {
      mapa.set(m, { mes: m, exec: 0, leg: 0, total: 0 });
    }
    if (escopoAcervo !== 'LEGISLATIVO' && escopoAcervo !== 'LEIS' && escopoAcervo !== 'CONTRATOS') {
      for (const e of ACERVO_DIARIOS_EXECUTIVO) {
        if (e.ano !== baseAno) continue;
        const it = mapa.get(e.mes);
        if (it) {
          it.exec += 1;
          it.total += 1;
        }
      }
    }
    if (escopoAcervo !== 'EXECUTIVO' && escopoAcervo !== 'LEIS' && escopoAcervo !== 'CONTRATOS') {
      for (const l of ACERVO_DIARIOS_LEGISLATIVO) {
        if (l.ano !== baseAno) continue;
        const it = mapa.get(l.mes);
        if (it) {
          it.leg += 1;
          it.total += 1;
        }
      }
    }
    if (escopoAcervo === 'LEIS') {
      for (const lei of LEIS_MUNICIPAIS_SANCIONADAS_REAIS) {
        if (lei.ano !== baseAno) continue;
        const it = mapa.get(lei.mes);
        if (it) it.total += 1;
      }
    }
    if (escopoAcervo === 'CONTRATOS') {
      for (const ext of EXTRATOS_CONTRATOS_DOM_REAIS) {
        if (ext.ano !== baseAno) continue;
        const it = mapa.get(ext.mes);
        if (it) it.total += 1;
      }
    }
    return [...mapa.values()].sort((a, b) => a.mes - b.mes);
  }, [anoDiario, escopoAcervo]);

  const maxMesAcervo = useMemo(
    () => Math.max(...resumoMensalAcervo.map((m) => m.total), 1),
    [resumoMensalAcervo]
  );

  return (
    <div className="fg-page-container">
      {/* ====================================================================
          HERO MODERNO E COMPACTO (MOBILE + DESKTOP)
          ==================================================================== */}
      <header className="fg-hero" style={{ marginBottom: 16 }}>
        <div className="fg-hero-split">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="fg-hero__eyebrow">
                <span className="fg-hero__dot" />
                Acervo Oficial Validado · 2025 e 2026
              </span>
              <StatusBanco />
            </div>

            <h1 className="fg-hero__title" style={{ marginTop: 10 }}>
              Diários Oficiais, Leis e Decretos <span>conectados</span>
            </h1>
            <p className="fg-hero__lead">
              Mapeamos e validamos as <strong>{QTD_DIARIOS_EXECUTIVO} edições do Executivo</strong> ({QTD_PDFS_EXECUTIVO}{' '}
              PDFs verificados com SHA-256) e as <strong>{QTD_DIARIOS_LEGISLATIVO} edições do Legislativo</strong>,
              extraindo <strong>{QTD_LEIS_SANCIONADAS} leis</strong> e <strong>{QTD_DECRETOS} decretos</strong> para
              ligar cada decisão aos pagamentos reais no TCE-SP.
            </p>
          </div>

          <div className="fg-hero-kpis">
            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Diários validados</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--sky">{QTD_DIARIOS}</div>
              <div className="fg-hero-kpi__sub">
                {QTD_DIARIOS_EXECUTIVO} Executivo + {QTD_DIARIOS_LEGISLATIVO} Legislativo
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Decretos no orçamento</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--amber">
                {brlCompacto(resumoDecretos.totalCatalogo262)}
              </div>
              <div className="fg-hero-kpi__sub">{QTD_DECRETOS} decretos extraídos dos PDFs</div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Leis sancionadas</div>
              <div className="fg-hero-kpi__val fg-hero-kpi__val--emerald">{QTD_LEIS_SANCIONADAS}</div>
              <div className="fg-hero-kpi__sub">
                {statsCatalogo.leis2025} em 2025 · {statsCatalogo.leis2026} em 2026
              </div>
            </div>

            <div className="fg-hero-kpi">
              <div className="fg-hero-kpi__lbl">Integridade SHA-256</div>
              <div className="fg-hero-kpi__val">{(TAMANHO_ACERVO_MB / 1024).toFixed(2).replace('.', ',')} GB</div>
              <div className="fg-hero-kpi__sub">{inteiro(PAGINAS_EXECUTIVO_TOTAL)} págs · 100% íntegras</div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================================
          BARRA DE NAVEGAÇÃO MODERNA EM 5 ABAS (DESLIZANTE NO CELULAR)
          ==================================================================== */}
      <div className="fg-hub-nav" role="tablist" aria-label="Navegação da central documental">
        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'quebra_cabeca'}
          className={`fg-hub-tab${abaAtiva === 'quebra_cabeca' ? ' is-active' : ''}`}
          onClick={() => setAbaAtiva('quebra_cabeca')}
        >
          <Puzzle size={16} aria-hidden />
          <span>Quebra-cabeça</span>
          <b className="fg-hub-tab__badge">4 elos</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'decretos_fluxo'}
          className={`fg-hub-tab${abaAtiva === 'decretos_fluxo' ? ' is-active' : ''}`}
          onClick={() => setAbaAtiva('decretos_fluxo')}
        >
          <ArrowRightLeft size={16} aria-hidden />
          <span>De onde saiu → foi</span>
          <b className="fg-hub-tab__badge">{DECRETOS_ORCAMENTARIOS_AUDITADOS.length}</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'catalogo_decretos'}
          className={`fg-hub-tab${abaAtiva === 'catalogo_decretos' ? ' is-active' : ''}`}
          onClick={() => setAbaAtiva('catalogo_decretos')}
        >
          <FileText size={16} aria-hidden />
          <span>Todos os decretos</span>
          <b className="fg-hub-tab__badge">{QTD_DECRETOS}</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'diarios_oficiais'}
          className={`fg-hub-tab${abaAtiva === 'diarios_oficiais' ? ' is-active' : ''}`}
          onClick={() => setAbaAtiva('diarios_oficiais')}
        >
          <BookOpen size={16} aria-hidden />
          <span>Diários e leis</span>
          <b className="fg-hub-tab__badge">{QTD_DIARIOS}</b>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={abaAtiva === 'fontes_tempo_real'}
          className={`fg-hub-tab${abaAtiva === 'fontes_tempo_real' ? ' is-active' : ''}`}
          onClick={() => setAbaAtiva('fontes_tempo_real')}
        >
          <ShieldCheck size={16} aria-hidden />
          <span>Fontes e SHA-256</span>
          <b className="fg-hub-tab__badge">7</b>
        </button>
      </div>

      {/* ====================================================================
          ABA 1: QUEBRA-CABEÇA DA AUDITORIA (VISÃO INTEGRADA)
          ==================================================================== */}
      {abaAtiva === 'quebra_cabeca' && trilhaSelecionada && (
        <section aria-label="Quebra-cabeça completo da auditoria municipal">
          <div style={{ marginBottom: 16 }}>
            <PainelIndicadoresAuditoria />
          </div>

          {/* Como as 4 peças se encaixam */}
          <div className="fg-puzzle-steps">
            <button
              type="button"
              className="fg-puzzle-step"
              onClick={() => {
                setEscopoAcervo('LEGISLATIVO');
                setAbaAtiva('diarios_oficiais');
              }}
            >
              <span className="fg-puzzle-step__num">1</span>
              <div>
                <strong>Câmara · Legislativo</strong>
                <span>{QTD_DIARIOS_LEGISLATIVO} edições do DOL + projetos votados</span>
              </div>
            </button>

            <button
              type="button"
              className="fg-puzzle-step"
              onClick={() => {
                setEscopoAcervo('LEIS');
                setAbaAtiva('diarios_oficiais');
              }}
            >
              <span className="fg-puzzle-step__num">2</span>
              <div>
                <strong>Leis Sancionadas</strong>
                <span>{QTD_LEIS_SANCIONADAS} leis publicadas no Diário Oficial</span>
              </div>
            </button>

            <button
              type="button"
              className="fg-puzzle-step"
              onClick={() => setAbaAtiva('catalogo_decretos')}
            >
              <span className="fg-puzzle-step__num">3</span>
              <div>
                <strong>Decretos no Orçamento</strong>
                <span>
                  {QTD_DECRETOS} decretos ({QTD_DECRETOS_SUPLEMENTARES} supl. + {QTD_DECRETOS_REMANEJAMENTO} rem.)
                </span>
              </div>
            </button>

            <Link to="/despesas?visao=conexoes" className="fg-puzzle-step">
              <span className="fg-puzzle-step__num">4</span>
              <div>
                <strong>Empresas & Pagamentos</strong>
                <span>{inteiro(RESUMO_CONEXOES_OFICIAIS.totalConexoesDom)} conexões CNPJ↔DOM + TCE-SP</span>
              </div>
            </Link>
          </div>

          {/* Cruzamento por Área da Cidade */}
          <div className="fg-card" style={{ marginBottom: 20 }}>
            <div className="fg-section__head" style={{ marginBottom: 12 }}>
              <div>
                <h2 className="fg-h2">Siga o dinheiro e os atos por área da cidade</h2>
                <p className="fg-sub">
                  Escolha uma área para ver, lado a lado, as leis e projetos, os decretos que mexeram na verba e as
                  empresas que receberam pagamentos.
                </p>
              </div>
            </div>

            <div className="fg-pills" style={{ marginBottom: 16 }}>
              {trilhasQuebraCabeca.map((tr) => (
                <button
                  key={tr.id}
                  type="button"
                  className={`fg-pill${trilhaAtivaId === tr.id ? ' is-active' : ''}`}
                  onClick={() => setTrilhaAtivaId(tr.id)}
                >
                  <IconeArea area={tr.areaNome} size={14} />
                  <span>{tr.areaNome}</span>
                </button>
              ))}
            </div>

            <div className="fg-puzzle-board">
              {/* Coluna 1: Legislativo & Leis */}
              <div className="fg-puzzle-col">
                <div className="fg-puzzle-col__head">
                  <span className="fg-badge fg-badge--navy">
                    <Gavel size={12} aria-hidden />
                    1. Leis e Câmara Municipal
                  </span>
                  <span className="fg-puzzle-col__count">
                    {trilhaSelecionada.leisRelacionadas.length} leis · {trilhaSelecionada.projetosCamara.length} projetos
                  </span>
                </div>

                <div className="fg-puzzle-list">
                  {trilhaSelecionada.leisRelacionadas.map((lei) => (
                    <div key={lei.numero} className="fg-puzzle-row">
                      <div className="fg-puzzle-row__top">
                        <strong>Lei nº {lei.numeroFmt}</strong>
                        <span className="fg-tag">{lei.tema || 'Lei Municipal'} · {lei.dataBr}</span>
                      </div>
                      <p className="fg-puzzle-row__text" style={{ fontWeight: 700, color: '#0f172a' }}>
                        {lei.tituloSimples || lei.ementa}
                      </p>
                      <div className="fg-puzzle-row__foot">
                        <span className="fg-cell-sub">{lei.autorLimpo || lei.autoria}</span>
                        <button
                          type="button"
                          className="fg-link-btn"
                          onClick={() => setLeiRaioX(lei)}
                        >
                          <BookOpen size={13} aria-hidden />
                          <span>Ler inteira</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {trilhaSelecionada.projetosCamara.map((proj, idx) => (
                    <div key={`${proj.url}-${idx}`} className="fg-puzzle-row">
                      <div className="fg-puzzle-row__top">
                        <strong>{proj.titulo}</strong>
                        <span className="fg-badge fg-badge--amber">Câmara · {proj.dataBr}</span>
                      </div>
                      <p className="fg-puzzle-row__text">{proj.resumo}</p>
                      <div className="fg-puzzle-row__foot">
                        <span className="fg-cell-sub">Protocolo {proj.protocolo ?? 'CMG'}</span>
                        <a href={proj.url} target="_blank" rel="noreferrer noopener" className="fg-link-inline">
                          <span>Abrir na Câmara</span>
                          <ExternalLink size={12} aria-hidden />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coluna 2: Decretos Orçamentários no DOM-GRU */}
              <div className="fg-puzzle-col">
                <div className="fg-puzzle-col__head">
                  <span className="fg-badge fg-badge--blue">
                    <ArrowRightLeft size={12} aria-hidden />
                    2. Decretos no Orçamento
                  </span>
                  <span className="fg-puzzle-col__count">
                    {brlCompacto(trilhaSelecionada.valorDecretosCatalogo)} mapeados
                  </span>
                </div>

                <div className="fg-puzzle-list">
                  {trilhaSelecionada.decretosDetalhados.map((dec) => (
                    <div key={dec.id} className="fg-puzzle-row">
                      <div className="fg-puzzle-row__top">
                        <strong>{dec.numeroDecreto}</strong>
                        <span className="fg-money" style={{ color: '#047857', fontFamily: 'var(--font-mono)' }}>
                          +{brlCompacto(dec.valorTotal)}
                        </span>
                      </div>
                      <p className="fg-puzzle-row__text">{dec.tituloObjetivo}</p>
                      <div className="fg-puzzle-row__foot">
                        <span className="fg-cell-sub">{dataBr(dec.dataPublicacao)}</span>
                        <button
                          type="button"
                          className="fg-link-btn"
                          onClick={() => {
                            const p = new URLSearchParams(searchParams);
                            p.set('aba', 'fluxo');
                            p.set('decreto', dec.id);
                            setSearchParams(p);
                          }}
                        >
                          <span>Ver origem → destino</span>
                          <ArrowRight size={13} aria-hidden />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="fg-puzzle-summary">
                    <span>
                      Total de suplementações identificadas nesta frente (2025–2026):{' '}
                      <strong>{trilhaSelecionada.qtdDecretosCatalogo} decreto(s)</strong>
                    </span>
                    <button
                      type="button"
                      className="fg-link-btn"
                      onClick={() => {
                        setBuscaCatalogo(trilhaSelecionada.filtroDespesas.slice(0, 5));
                        setAbaAtiva('catalogo_decretos');
                      }}
                    >
                      <span>Filtrar nos {QTD_DECRETOS} decretos →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Coluna 3: Execução Financeira Real (TCE-SP) */}
              <div className="fg-puzzle-col">
                <div className="fg-puzzle-col__head">
                  <span className="fg-badge fg-badge--emerald">
                    <Building2 size={12} aria-hidden />
                    3. Pago na Ponta (TCE-SP)
                  </span>
                  <span className="fg-puzzle-col__count">
                    {brlCompacto(trilhaSelecionada.pagoConsolidado)} (2025–Set/26)
                  </span>
                </div>

                <div className="fg-puzzle-kpis">
                  <div>
                    <span>Pago em 2025</span>
                    <strong>{brlCompacto(trilhaSelecionada.pago2025)}</strong>
                  </div>
                  <div>
                    <span>Pago até Set/2026</span>
                    <strong>{brlCompacto(trilhaSelecionada.pago2026)}</strong>
                  </div>
                  <div>
                    <span>Pagamentos</span>
                    <strong>{inteiro(trilhaSelecionada.qtdPagamentosConsolidado)}</strong>
                  </div>
                </div>

                <div className="fg-puzzle-list">
                  {trilhaSelecionada.principaisFornecedores.map((f) => (
                    <Link key={f.chave} to={`/despesas/credor/${f.chave}`} className="fg-puzzle-row fg-puzzle-row--link">
                      <div className="fg-puzzle-row__top">
                        <strong>{nomeLegivel(f.nome)}</strong>
                        <span className="fg-money" style={{ fontFamily: 'var(--font-mono)' }}>
                          {brlCompacto(f.pagoTotal)}
                        </span>
                      </div>
                      <div className="fg-puzzle-row__foot" style={{ marginTop: 4 }}>
                        <span className="fg-cell-sub">
                          {f.cnpj ? formatarCnpj(f.cnpj) : 'Pessoa física'} · {inteiro(f.qtdPagamentos)} pag.
                        </span>
                        <span className="fg-link-inline">
                          <span>Ficha completa</span>
                          <ArrowRight size={12} aria-hidden />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Linha do Tempo Cruzada Dia a Dia: Executivo (DOM) + Legislativo (DOL) */}
          <div className="fg-card">
            <div className="fg-section__head" style={{ marginBottom: 12 }}>
              <div>
                <h2 className="fg-h2">Linha do tempo cruzada: Executivo + Legislativo dia a dia</h2>
                <p className="fg-sub">
                  Veja o que a Prefeitura (DOM-GRU) e a Câmara Municipal (DOL) publicaram exatamente na mesma data.
                </p>
              </div>
            </div>

            <div className="fg-toolbar-modern">
              <div className="fg-pills">
                {[
                  { id: 'AMBOS_PODERES' as const, label: 'Executivo + Legislativo no mesmo dia' },
                  { id: 'COM_LEIS' as const, label: 'Dias com leis sancionadas' },
                  { id: 'COM_DECRETOS' as const, label: 'Dias com decretos' },
                  { id: 'TODOS' as const, label: 'Todas as datas' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`fg-pill${filtroLinhaUnificada === f.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setFiltroLinhaUnificada(f.id);
                      setQtdDiasVisiveis(14);
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="fg-toolbar-modern__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Data (24/11/2026), DOM #3622, DOL 140, lei ou decreto..."
                  value={buscaLinhaUnificada}
                  onChange={(e) => {
                    setBuscaLinhaUnificada(e.target.value);
                    setQtdDiasVisiveis(14);
                  }}
                />
              </div>
            </div>

            <div className="fg-dual-days">
              {diasUnificadosFiltrados.slice(0, qtdDiasVisiveis).map((dia) => (
                <article key={dia.dataIso} className="fg-dual-day">
                  <div className="fg-dual-day__date">
                    <Calendar size={15} aria-hidden />
                    <strong>{dia.dataBr}</strong>
                    {dia.temAmbosPoderes && <span className="fg-badge fg-badge--emerald">Executivo + Legislativo</span>}
                    {dia.somaDecretosNoDia > 0 && (
                      <span className="fg-badge fg-badge--amber">
                        {dia.decretosNoDia.length} dec. · {brlCompacto(dia.somaDecretosNoDia)}
                      </span>
                    )}
                    {dia.leisNoDia.length > 0 && (
                      <span className="fg-badge fg-badge--blue">{dia.leisNoDia.length} lei(s)</span>
                    )}
                  </div>

                  <div className="fg-dual-day__cols">
                    {/* Lado Executivo */}
                    <div className="fg-dual-day__side">
                      <div className="fg-dual-day__label">
                        <Landmark size={14} aria-hidden />
                        <span>Poder Executivo (DOM-GRU)</span>
                      </div>
                      {dia.executivo ? (
                        <>
                          <div className="fg-dual-day__main">
                            <div>
                              <strong>DOM #{dia.executivo.codigoDom}</strong>
                              <span className="fg-cell-sub" style={{ marginLeft: 8 }}>
                                {dia.executivo.totalPaginas} págs · {formatarBytes(dia.executivo.tamanhoTotalBytes)}
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                type="button"
                                className="fg-btn fg-btn--sm"
                                onClick={() =>
                                  setPdfPreview({
                                    titulo: `DOM-GRU #${dia.executivo!.codigoDom} — ${dia.dataBr}`,
                                    subtitulo: `${dia.executivo!.totalPaginas} páginas · ${formatarBytes(dia.executivo!.tamanhoTotalBytes)}`,
                                    url: dia.executivo!.pdfPrincipalUrl,
                                    sha256: dia.executivo!.sha256Principal,
                                  })
                                }
                              >
                                <Eye size={13} aria-hidden />
                                <span>Ler PDF</span>
                              </button>
                              <a
                                href={dia.executivo.pdfPrincipalUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="fg-btn fg-btn--primary fg-btn--sm"
                              >
                                <span>PDF</span>
                                <ArrowUpRight size={12} aria-hidden />
                              </a>
                            </div>
                          </div>

                          {(dia.leisNoDia.length > 0 || dia.decretosNoDia.length > 0) && (
                            <div className="fg-dual-day__chips">
                              {dia.leisNoDia.slice(0, 3).map((l) => (
                                <a
                                  key={l.numero}
                                  href={l.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="fg-mini-chip fg-mini-chip--blue"
                                  title={l.ementa}
                                >
                                  Lei nº {l.numeroFmt}
                                </a>
                              ))}
                              {dia.decretosNoDia.slice(0, 4).map((d) => (
                                <a
                                  key={d.numero}
                                  href={d.pdfUrl}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="fg-mini-chip fg-mini-chip--amber"
                                >
                                  Dec. {d.numeroFmt} ({brlCompacto(d.valor)})
                                </a>
                              ))}
                              {dia.decretosNoDia.length > 4 && (
                                <span className="fg-cell-sub">+{dia.decretosNoDia.length - 4} decretos</span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="fg-cell-sub">Sem edição do Executivo nesta data.</span>
                      )}
                    </div>

                    {/* Lado Legislativo */}
                    <div className="fg-dual-day__side">
                      <div className="fg-dual-day__label">
                        <Scale size={14} aria-hidden />
                        <span>Poder Legislativo (Câmara · DOL)</span>
                      </div>
                      {dia.legislativo.length > 0 ? (
                        dia.legislativo.map((dol) => (
                          <div key={dol.id} className="fg-dual-day__main">
                            <div>
                              <strong>DOL nº {dol.numeroEdicao ?? dol.documentoId}</strong>
                              <span className="fg-cell-sub" style={{ marginLeft: 8 }}>
                                Protocolo {dol.protocolo ?? '—'} · {dol.situacao}
                              </span>
                            </div>
                            <a
                              href={dol.documentoUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="fg-btn fg-btn--sm"
                            >
                              <span>Abrir na Câmara</span>
                              <ExternalLink size={12} aria-hidden />
                            </a>
                          </div>
                        ))
                      ) : (
                        <span className="fg-cell-sub">Sem edição do Legislativo nesta data.</span>
                      )}

                      {dia.atosCamaraNoDia.length > 0 && (
                        <div className="fg-dual-day__chips">
                          {dia.atosCamaraNoDia.slice(0, 2).map((ato, idx) => (
                            <a
                              key={idx}
                              href={ato.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="fg-mini-chip"
                            >
                              {ato.titulo}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {diasUnificadosFiltrados.length > qtdDiasVisiveis && (
              <div style={{ textAlign: 'center', marginTop: 14 }}>
                <button
                  type="button"
                  className="fg-btn"
                  onClick={() => setQtdDiasVisiveis((q) => q + 20)}
                >
                  Mostrar mais datas ({diasUnificadosFiltrados.length - qtdDiasVisiveis} restantes)
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ====================================================================
          ABA 2: FLUXO CONTÁBIL DETALHADO (DE ONDE SAIU -> PARA ONDE FOI)
          ==================================================================== */}
      {abaAtiva === 'decretos_fluxo' && (
        <section aria-label="Rastreabilidade contábil de decretos orçamentários">
          <div className="fg-audit-explainer">
            <div className="fg-audit-explainer__icon">
              <Scale size={20} aria-hidden />
            </div>
            <div className="fg-audit-explainer__content">
              <strong>Como ler um decreto no orçamento (Lei Federal nº 4.320/1964)</strong>
              <p>
                O <strong>Art. 2º</strong> mostra <strong>de onde saiu a verba</strong> (redução de dotação ou excesso de
                arrecadação) e o <strong>Art. 1º</strong> mostra <strong>para onde ela foi</strong>. Todos os PDFs abaixo
                foram validados com hash SHA-256.
              </p>
            </div>
          </div>

          <div className="fg-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
            <div className="fg-toolbar-modern" style={{ marginBottom: 0 }}>
              <div className="fg-pills">
                {FILTROS_MODALIDADE.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`fg-pill${filtroModalidade === f.id ? ' is-active' : ''}`}
                    onClick={() => setFiltroModalidade(f.id)}
                  >
                    <Filter size={13} aria-hidden />
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>

              <div className="fg-toolbar-modern__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Buscar decreto (44.681, 44.643), merenda, saúde, trânsito..."
                  value={buscaFluxo}
                  onChange={(e) => setBuscaFluxo(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            {decretosFluxoFiltrados.map((dec, index) => (
              <article
                key={dec.id}
                id={dec.id}
                className={`fg-decree-card${decretoDestaqueId === dec.id ? ' is-highlighted' : ''}`}
              >
                <div className="fg-decree-card__header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span className="fg-seq-badge">#{String(index + 1).padStart(2, '0')}</span>
                      <span className="fg-badge fg-badge--navy">
                        <FileText size={13} aria-hidden />
                        {dec.numeroDecreto}
                      </span>
                      <span className="fg-badge fg-badge--blue">
                        {dec.edicaoDiarioOficial} ({dec.paginaDiario})
                      </span>
                      <span className="fg-badge fg-badge--amber">{dec.rotuloModalidade}</span>
                    </div>
                    <h2 className="fg-decree-card__title">{dec.tituloObjetivo}</h2>
                  </div>

                  <div className="fg-decree-card__amount-box">
                    <span className="fg-decree-card__amount-lbl">Valor movimentado</span>
                    <strong className="fg-decree-card__amount-val">{brl(dec.valorTotal)}</strong>
                    <span className="fg-decree-card__amount-sub">{brlCompacto(dec.valorTotal)} verificados</span>
                  </div>
                </div>

                <div className="fg-decree-card__summary">
                  <strong>Em linguagem simples:</strong> {dec.resumoExplicativo}
                </div>

                <div className="fg-decree-flow">
                  {/* DE ONDE SAIU */}
                  <div className="fg-decree-flow__col fg-decree-flow__col--origin">
                    <div className="fg-decree-flow__col-head fg-decree-flow__col-head--origin">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingDown size={17} aria-hidden />
                        <span>De onde saiu (Art. 2º)</span>
                      </div>
                      <span className="fg-mono-tag">{brlCompacto(dec.valorTotal)}</span>
                    </div>

                    <div className="fg-decree-flow__list">
                      {dec.origens.map((orig, idx) => (
                        <div key={idx} className="fg-decree-flow__item">
                          <div className="fg-decree-flow__item-top">
                            <strong className="fg-decree-flow__orgao">{orig.orgaoOrigem}</strong>
                            <span className="fg-decree-flow__val fg-decree-flow__val--out">{brl(orig.valor)}</span>
                          </div>
                          <div className="fg-decree-flow__rubrica">
                            <code>{orig.dotacaoCodigo}</code> · {orig.acaoProgramatica}
                          </div>
                          <div className="fg-decree-flow__meta">
                            <span>{orig.elementoNatureza}</span>
                            <span>·</span>
                            <span>{orig.fonteRecurso}</span>
                          </div>
                          <p className="fg-decree-flow__explain">
                            <strong>Na prática:</strong> {orig.impactoOrigemCidadao}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PARA ONDE FOI */}
                  <div className="fg-decree-flow__col fg-decree-flow__col--dest">
                    <div className="fg-decree-flow__col-head fg-decree-flow__col-head--dest">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TrendingUp size={17} aria-hidden />
                        <span>Para onde foi (Art. 1º)</span>
                      </div>
                      <span className="fg-mono-tag">+{brlCompacto(dec.valorTotal)}</span>
                    </div>

                    <div className="fg-decree-flow__list">
                      {dec.destinos.map((dest, idx) => (
                        <div key={idx} className="fg-decree-flow__item">
                          <div className="fg-decree-flow__item-top">
                            <div>
                              <span className="fg-badge fg-badge--emerald" style={{ marginBottom: 4 }}>
                                {dest.areaTematica}
                              </span>
                              <strong className="fg-decree-flow__orgao" style={{ display: 'block' }}>
                                {dest.orgaoDestino}
                              </strong>
                            </div>
                            <span className="fg-decree-flow__val fg-decree-flow__val--in">+ {brl(dest.valor)}</span>
                          </div>
                          <div className="fg-decree-flow__rubrica">
                            <code>{dest.dotacaoCodigo}</code> · {dest.acaoProgramatica}
                          </div>
                          <div className="fg-decree-flow__meta">
                            <span>{dest.elementoNatureza}</span>
                            <span>·</span>
                            <span>{dest.fonteRecurso}</span>
                          </div>
                          <p className="fg-decree-flow__explain">
                            <strong>Onde chega na cidade:</strong> {dest.aplicacaoPraticaCidadao}
                          </p>
                          <div style={{ marginTop: 8 }}>
                            <Link
                              to={`/despesas?ano=todos&q=${encodeURIComponent(dest.filtroFornecedorRelacionado)}`}
                              className="fg-link-inline"
                            >
                              <span>Ver empresas pagas nesta área</span>
                              <ArrowUpRight size={14} aria-hidden />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="fg-decree-card__footer">
                  <div className="fg-decree-card__audit-note">
                    <ShieldCheck size={16} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} aria-hidden />
                    <div>
                      <strong>Conferência documental:</strong> {dec.parecerAuditoriaTecnica}
                    </div>
                  </div>

                  <div className="fg-decree-card__btns">
                    <button
                      type="button"
                      className="fg-btn"
                      onClick={() =>
                        setPdfPreview({
                          titulo: dec.numeroDecreto,
                          subtitulo: `${dec.edicaoDiarioOficial} · ${dec.paginaDiario}`,
                          url: dec.urlDiarioOficial,
                          sha256: dec.hashIntegridadeSha256,
                        })
                      }
                    >
                      <Eye size={15} aria-hidden />
                      <span>Ler no PDF</span>
                    </button>

                    <button type="button" className="fg-btn" onClick={() => setDecretoSelecionado(dec)}>
                      <FileCheck2 size={15} aria-hidden />
                      <span>Ficha técnica</span>
                    </button>

                    <a
                      href={dec.urlDiarioOficial}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="fg-btn fg-btn--primary"
                    >
                      <BookOpen size={15} aria-hidden />
                      <span>Abrir PDF ({dec.paginaDiario})</span>
                      <ArrowUpRight size={14} aria-hidden />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          ABA 3: TODOS OS 708 DECRETOS SUPLEMENTARES (EXTRAÍDOS DOS PDFs)
          ==================================================================== */}
      {abaAtiva === 'catalogo_decretos' && (
        <section aria-label={`Todos os ${QTD_DECRETOS} decretos suplementares`}>
          <div className="fg-card" style={{ marginBottom: 16 }}>
            <div className="fg-section__head" style={{ marginBottom: 8 }}>
              <div>
                <h2 className="fg-h2">
                  Volume mensal de decretos ({anoCatalogo === 'TODOS' ? 2026 : anoCatalogo})
                </h2>
                <p className="fg-sub">
                  Extraídos diretamente dos 222 PDFs oficiais (incluindo páginas com vários decretos). Toque em um mês
                  para filtrar.
                </p>
              </div>
              {mesCatalogo !== null && (
                <button
                  type="button"
                  className="fg-btn fg-btn--sm"
                  onClick={() => {
                    setMesCatalogo(null);
                    setPagCatalogo(1);
                  }}
                >
                  Limpar mês ({mesNome(mesCatalogo)})
                </button>
              )}
            </div>

            <div className="fg-month-strip">
              <div className="fg-month-chart">
                {resumoMensalDecretos.map((m) => {
                  const ativo = mesCatalogo === m.mes;
                  const alturaPct = Math.max(8, Math.round((m.valor / maxValorMesDecreto) * 100));
                  return (
                    <button
                      key={m.mes}
                      type="button"
                      className={`fg-month-chart__col${ativo ? ' is-active' : ''}`}
                      onClick={() => {
                        setMesCatalogo(ativo ? null : m.mes);
                        setPagCatalogo(1);
                      }}
                    >
                      <span className="fg-month-chart__val">
                        {m.valor > 0 ? brlCompacto(m.valor).replace('R$ ', '') : '—'}
                      </span>
                      <div className="fg-month-chart__track">
                        <div className="fg-month-chart__fill" style={{ height: `${alturaPct}%` }} />
                      </div>
                      <span className="fg-month-chart__lbl">{mesAbrev(m.mes).toUpperCase()}</span>
                      <span className="fg-month-chart__cnt">{m.qtd} dec.</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Barra de Filtros Compacta */}
          <div className="fg-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
            <div className="fg-toolbar-modern">
              <div className="fg-pills">
                {[
                  { id: 'TODOS' as const, label: `Todos (${QTD_DECRETOS})` },
                  { id: 2026 as const, label: `2026 (${statsCatalogo.qtd2026})` },
                  { id: 2025 as const, label: `2025 (${statsCatalogo.qtd2025})` },
                ].map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    className={`fg-pill${anoCatalogo === item.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setAnoCatalogo(item.id);
                      setPagCatalogo(1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="fg-pills">
                {[
                  { id: 'TODOS' as const, label: 'Todas modalidades' },
                  { id: 'SUPLEMENTAR' as const, label: `Suplementar (${QTD_DECRETOS_SUPLEMENTARES})` },
                  { id: 'REMANEJAMENTO' as const, label: `Remanejamento Art. 6º (${QTD_DECRETOS_REMANEJAMENTO})` },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    className={`fg-pill${modalidadeCatalogo === m.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setModalidadeCatalogo(m.id);
                      setPagCatalogo(1);
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="fg-pills">
                <button
                  type="button"
                  className={`fg-pill${ordemDecretos === 'RECENTES' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDecretos('RECENTES');
                    setPagCatalogo(1);
                  }}
                >
                  <ArrowDownWideNarrow size={13} aria-hidden />
                  <span>Mais recentes</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill${ordemDecretos === 'MAIOR_VALOR' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDecretos('MAIOR_VALOR');
                    setPagCatalogo(1);
                  }}
                >
                  <TrendingUp size={13} aria-hidden />
                  <span>Maior valor</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill${ordemDecretos === 'ANTIGOS' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDecretos('ANTIGOS');
                    setPagCatalogo(1);
                  }}
                >
                  <ArrowUpNarrowWide size={13} aria-hidden />
                  <span>Mais antigos</span>
                </button>
              </div>

              <div className="fg-toolbar-modern__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Nº decreto (ex: 44643), data, dotação ou valor..."
                  value={buscaCatalogo}
                  onChange={(e) => {
                    setBuscaCatalogo(e.target.value);
                    setPagCatalogo(1);
                  }}
                />
              </div>
            </div>

            <div className="fg-toolbar-summary">
              <span>
                Exibindo <strong>{inteiro(catalogoFiltradoEOrdenado.length)}</strong> decreto(s)
              </span>
              <span className="fg-badge fg-badge--emerald">Soma filtrada: {brl(somaCatalogoFiltrado)}</span>
            </div>
          </div>

          {/* Grade Limpa e Clara dos 843 Decretos (Sem poluição e com Origem -> Destino) */}
          <div className="fg-clean-decree-grid">
            {catalogoVisivel.map((dec) => {
              const domEd = dec.codigoDom ? ACERVO_DIARIOS_EXECUTIVO.find((e) => e.codigoDom === dec.codigoDom) : null;
              return (
                <article key={`${dec.numero}-${dec.dataIso}`} className="fg-clean-card">
                  <div className="fg-clean-card__top">
                    <div className="fg-clean-card__badges">
                      <span
                        className={`fg-badge ${
                          dec.modalidade === 'REMANEJAMENTO' ? 'fg-badge--amber' : 'fg-badge--emerald'
                        }`}
                      >
                        {dec.modalidade === 'REMANEJAMENTO' ? 'Remanejamento' : 'Suplementar'}
                      </span>
                      <span className="fg-cell-sub">
                        Decreto <strong>{dec.numeroFmt}</strong> · {dec.dataBr}
                      </span>
                    </div>
                    <strong className="fg-clean-card__amount">+ {brl(dec.valor)}</strong>
                  </div>

                  <h3 className="fg-clean-card__title">
                    {dec.tituloSimples || `Decreto Orçamentário nº ${dec.numeroFmt}`}
                  </h3>

                  <div className="fg-flow-mini">
                    <div className="fg-flow-mini__row fg-flow-mini__row--out">
                      <span>De onde saiu:</span>
                      <strong>{dec.origemResumo || dec.tipoFonteOrigem || 'Dotações do Art. 2º'}</strong>
                    </div>
                    <div className="fg-flow-mini__row fg-flow-mini__row--in">
                      <span>Para onde foi:</span>
                      <strong>{dec.destinoResumo || 'Reforço de dotação no Art. 1º'}</strong>
                    </div>
                  </div>

                  <div className="fg-clean-card__foot">
                    <span className="fg-cell-sub">
                      {dec.codigoDom ? `DOM #${dec.codigoDom} · ` : ''}Pág. {dec.pagina}/{dec.totalPaginas}
                    </span>

                    <div className="fg-clean-card__actions">
                      <button
                        type="button"
                        className="fg-btn fg-btn--primary fg-btn--sm"
                        onClick={() => setDecretoCatalogoRaioX(dec)}
                      >
                        <BookOpen size={13} aria-hidden />
                        <span>Ver decreto inteiro</span>
                      </button>

                      <button
                        type="button"
                        className="fg-btn fg-btn--sm"
                        onClick={() =>
                          setPdfPreview({
                            titulo: `Decreto Executivo nº ${dec.numeroFmt}`,
                            subtitulo: `Diário Oficial de ${dec.dataBr} · Página ${dec.pagina} · ${brl(dec.valor)}`,
                            url: dec.pdfUrl,
                            sha256: domEd?.sha256Principal,
                          })
                        }
                      >
                        <Eye size={13} aria-hidden />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="fg-card" style={{ marginTop: 18, padding: 0, overflow: 'hidden' }}>
            <PaginacaoModerna
              pagina={pagCatalogo}
              totalItens={catalogoFiltradoEOrdenado.length}
              itensPorPagina={LIMIT_CATALOGO}
              rotuloItem="decretos orçamentários"
              onMudarPagina={setPagCatalogo}
              onExportarCsv={() =>
                exportarCsvPlanilha(
                  'fiscaliza-guarulhos-decretos-orcamentarios.csv',
                  ['Numero', 'Modalidade', 'Data', 'DOM', 'Pagina', 'Valor_BRL', 'Trecho', 'PDF_Oficial'],
                  catalogoFiltradoEOrdenado.map((d) => [
                    d.numeroFmt,
                    d.modalidade ?? 'SUPLEMENTAR',
                    d.dataBr,
                    d.codigoDom ? `DOM #${d.codigoDom}` : '',
                    d.pagina,
                    d.valor.toFixed(2).replace('.', ','),
                    d.trecho,
                    d.pdfUrl,
                  ])
                )
              }
              rotuloExportar="Baixar CSV"
            />
          </div>
        </section>
      )}

      {/* ====================================================================
          ABA 4: DIÁRIOS OFICIAIS (EXECUTIVO + LEGISLATIVO) E LEIS SANCIONADAS
          ==================================================================== */}
      {abaAtiva === 'diarios_oficiais' && (
        <section aria-label="Acervo validado de Diários do Executivo, Legislativo e Leis">
          {/* Seletor de Poder / Escopo */}
          <div className="fg-scope-grid">
            <button
              type="button"
              className={`fg-scope-card${escopoAcervo === 'TODOS_DIARIOS' ? ' is-active' : ''}`}
              onClick={() => {
                setEscopoAcervo('TODOS_DIARIOS');
                setPagDiario(1);
              }}
            >
              <Layers size={18} aria-hidden />
              <div>
                <strong>Todos os Diários ({QTD_DIARIOS})</strong>
                <span>Executivo + Legislativo em ordem cronológica</span>
              </div>
            </button>

            <button
              type="button"
              className={`fg-scope-card${escopoAcervo === 'EXECUTIVO' ? ' is-active' : ''}`}
              onClick={() => {
                setEscopoAcervo('EXECUTIVO');
                setPagDiario(1);
              }}
            >
              <Landmark size={18} aria-hidden />
              <div>
                <strong>Executivo · DOM-GRU ({QTD_DIARIOS_EXECUTIVO})</strong>
                <span>{QTD_PDFS_EXECUTIVO} PDFs baixados · 100% SHA-256</span>
              </div>
            </button>

            <button
              type="button"
              className={`fg-scope-card${escopoAcervo === 'LEGISLATIVO' ? ' is-active' : ''}`}
              onClick={() => {
                setEscopoAcervo('LEGISLATIVO');
                setPagDiario(1);
              }}
            >
              <Scale size={18} aria-hidden />
              <div>
                <strong>Legislativo · DOL ({QTD_DIARIOS_LEGISLATIVO})</strong>
                <span>Câmara Municipal · Edições nº 1 a nº 140</span>
              </div>
            </button>

            <button
              type="button"
              className={`fg-scope-card${escopoAcervo === 'LEIS' ? ' is-active' : ''}`}
              onClick={() => {
                setEscopoAcervo('LEIS');
                setPagDiario(1);
              }}
            >
              <ScrollText size={18} aria-hidden />
              <div>
                <strong>Leis Sancionadas ({QTD_LEIS_SANCIONADAS})</strong>
                <span>Ordinárias e complementares de 2025 e 2026</span>
              </div>
            </button>

            <button
              type="button"
              className={`fg-scope-card${escopoAcervo === 'CONTRATOS' ? ' is-active' : ''}`}
              onClick={() => {
                setEscopoAcervo('CONTRATOS');
                setPagDiario(1);
              }}
            >
              <Building2 size={18} aria-hidden />
              <div>
                <strong>Contratos e Aditivos ({QTD_EXTRATOS_CONTRATOS})</strong>
                <span>Extratos contratuais e atas no Diário Oficial</span>
              </div>
            </button>
          </div>

          {/* Diplomas Estruturais da Câmara Municipal (quando em Legislativo ou Todos) */}
          {(escopoAcervo === 'LEGISLATIVO' || escopoAcervo === 'TODOS_DIARIOS') && (
            <div className="fg-card" style={{ marginBottom: 16 }}>
              <div className="fg-section__head" style={{ marginBottom: 10 }}>
                <div>
                  <h2 className="fg-h2">Diplomas estruturais do Legislativo (PDFs validados com SHA-256)</h2>
                  <p className="fg-sub">
                    Documentos normativos permanentes da Câmara Municipal baixados e verificados; para as edições
                    individuais do DOL, o portal da Câmara solicita confirmação humana de CAPTCHA ao baixar o anexo.
                  </p>
                </div>
              </div>

              <div className="fg-inst-docs">
                {DOCS_INSTITUCIONAIS_LEGISLATIVO.map((doc) => (
                  <div key={doc.id} className="fg-inst-doc">
                    <div>
                      <strong>{doc.titulo}</strong>
                      <div className="fg-cell-sub" style={{ marginTop: 3 }}>
                        {doc.paginas ?? 1} pág(s) · {formatarBytes(doc.tamanhoBytes)} · SHA-256{' '}
                        {doc.sha256?.slice(0, 12)}…
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="fg-btn fg-btn--sm"
                        onClick={() =>
                          setPdfPreview({
                            titulo: doc.titulo,
                            subtitulo: `${doc.paginas ?? 1} páginas · ${formatarBytes(doc.tamanhoBytes)}`,
                            url: doc.url,
                            sha256: doc.sha256,
                          })
                        }
                      >
                        <Eye size={13} aria-hidden />
                        <span>Ler</span>
                      </button>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="fg-btn fg-btn--primary fg-btn--sm"
                      >
                        <span>PDF</span>
                        <ArrowUpRight size={12} aria-hidden />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico Mensal do Acervo */}
          <div className="fg-card" style={{ marginBottom: 16 }}>
            <div className="fg-section__head" style={{ marginBottom: 8 }}>
              <div>
                <h2 className="fg-h2">
                  Publicações mês a mês ({anoDiario === 'TODOS' ? 2026 : anoDiario})
                </h2>
                <p className="fg-sub">Toque em qualquer mês para filtrar as publicações daquele período.</p>
              </div>
              {mesDiario !== null && (
                <button
                  type="button"
                  className="fg-btn fg-btn--sm"
                  onClick={() => {
                    setMesDiario(null);
                    setPagDiario(1);
                  }}
                >
                  Mostrar todos os meses
                </button>
              )}
            </div>

            <div className="fg-month-strip">
              <div className="fg-month-chart">
                {resumoMensalAcervo.map((m) => {
                  const ativo = mesDiario === m.mes;
                  const alturaPct = Math.max(10, Math.round((m.total / maxMesAcervo) * 100));
                  return (
                    <button
                      key={m.mes}
                      type="button"
                      className={`fg-month-chart__col${ativo ? ' is-active' : ''}`}
                      onClick={() => {
                        setMesDiario(ativo ? null : m.mes);
                        setPagDiario(1);
                      }}
                    >
                      <span className="fg-month-chart__val">{m.total} pub.</span>
                      <div className="fg-month-chart__track">
                        <div className="fg-month-chart__fill" style={{ height: `${alturaPct}%` }} />
                      </div>
                      <span className="fg-month-chart__lbl">{mesAbrev(m.mes).toUpperCase()}</span>
                      <span className="fg-month-chart__cnt">
                        {escopoAcervo === 'TODOS_DIARIOS' ? `${m.exec}E · ${m.leg}L` : `${m.total} reg.`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Barra de Controle e Busca */}
          <div className="fg-card" style={{ marginBottom: 16, padding: '14px 16px' }}>
            <div className="fg-toolbar-modern">
              <div className="fg-pills">
                {[
                  { id: 'TODOS' as const, label: '2025 + 2026' },
                  { id: 2026 as const, label: '2026' },
                  { id: 2025 as const, label: '2025' },
                ].map((item) => (
                  <button
                    key={String(item.id)}
                    type="button"
                    className={`fg-pill${anoDiario === item.id ? ' is-active' : ''}`}
                    onClick={() => {
                      setAnoDiario(item.id);
                      setPagDiario(1);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="fg-pills">
                <button
                  type="button"
                  className={`fg-pill${ordemDiarios === 'RECENTES' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDiarios('RECENTES');
                    setPagDiario(1);
                  }}
                >
                  <ArrowDownWideNarrow size={13} aria-hidden />
                  <span>Mais recentes</span>
                </button>
                <button
                  type="button"
                  className={`fg-pill${ordemDiarios === 'ANTIGOS' ? ' is-active' : ''}`}
                  onClick={() => {
                    setOrdemDiarios('ANTIGOS');
                    setPagDiario(1);
                  }}
                >
                  <ArrowUpNarrowWide size={13} aria-hidden />
                  <span>Mais antigos</span>
                </button>
                {escopoAcervo !== 'LEGISLATIVO' && escopoAcervo !== 'LEIS' && (
                  <button
                    type="button"
                    className={`fg-pill${ordemDiarios === 'MAIS_PAGINAS' ? ' is-active' : ''}`}
                    onClick={() => {
                      setOrdemDiarios('MAIS_PAGINAS');
                      setPagDiario(1);
                    }}
                  >
                    <Layers size={13} aria-hidden />
                    <span>Mais páginas</span>
                  </button>
                )}
              </div>

              <div className="fg-toolbar-modern__search">
                <Search size={15} aria-hidden />
                <input
                  type="search"
                  className="fg-input"
                  placeholder="Data (24/11/2026), DOM #3622, DOL 140, protocolo, lei ou hash..."
                  value={buscaDiario}
                  onChange={(e) => {
                    setBuscaDiario(e.target.value);
                    setPagDiario(1);
                  }}
                />
              </div>
            </div>

            <div className="fg-toolbar-summary">
              <span>
                Registros encontrados: <strong>{inteiro(acervoUnificadoFiltrado.length)}</strong>
              </span>
              <span className="fg-cell-sub">
                DOM #{RESUMO_VALIDACAO_ACERVO.executivo.menorCodigoDom}–#{RESUMO_VALIDACAO_ACERVO.executivo.maiorCodigoDom}{' '}
                · DOL nº {RESUMO_VALIDACAO_ACERVO.legislativo.menorNumeroDol}–
                {RESUMO_VALIDACAO_ACERVO.legislativo.maiorNumeroDol}
              </span>
            </div>
          </div>

          {/* Lista / Grade Moderna de Diários e Leis */}
          <div className="fg-grid-2">
            {acervoVisivel.map((item) => {
              if (item.tipo === 'EXECUTIVO') {
                const ed = item.ed;
                const decretosDia = decretosPorDataIso.get(ed.dataPublicacao) ?? [];
                const leisDia = leisPorDataIso.get(ed.dataPublicacao) ?? [];
                const dolDia = dolPorDataIso.get(ed.dataPublicacao) ?? [];
                const somaDecDia = decretosDia.reduce((s, d) => s + d.valor, 0);

                return (
                  <article key={ed.id} className="fg-clean-card fg-clean-card--exec">
                    <div className="fg-clean-card__top">
                      <div className="fg-clean-card__badges">
                        <span className="fg-badge fg-badge--navy">Executivo · DOM #{ed.codigoDom}</span>
                        <span className="fg-badge fg-badge--blue">{ed.dataBr}</span>
                        <span className="fg-tag">
                          {ed.totalPaginas} págs · {formatarBytes(ed.tamanhoTotalBytes)}
                        </span>
                      </div>
                    </div>

                    <h3 className="fg-clean-card__title">
                      Diário Oficial do Município de Guarulhos — {ed.dataBr}
                    </h3>

                    {/* Cruzamentos do dia */}
                    {(decretosDia.length > 0 || leisDia.length > 0 || dolDia.length > 0) && (
                      <div className="fg-dual-day__chips">
                        {dolDia.map((dl) => (
                          <a
                            key={dl.id}
                            href={dl.documentoUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="fg-mini-chip"
                          >
                            Câmara no mesmo dia: DOL nº {dl.numeroEdicao}
                          </a>
                        ))}
                        {leisDia.slice(0, 3).map((l) => (
                          <a
                            key={l.numero}
                            href={l.pdfUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="fg-mini-chip fg-mini-chip--blue"
                            title={l.ementa}
                          >
                            Lei nº {l.numeroFmt}
                          </a>
                        ))}
                        {decretosDia.length > 0 && (
                          <span className="fg-mini-chip fg-mini-chip--amber">
                            {decretosDia.length} decreto(s) · {brlCompacto(somaDecDia)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Cadernos da Edição */}
                    <div className="fg-clean-cadernos">
                      {ed.cadernos.map((cad, cIdx) => (
                        <div key={cIdx} className="fg-clean-caderno">
                          <div style={{ minWidth: 0 }}>
                            <div className="fg-clean-caderno__name">
                              <FileText size={14} aria-hidden />
                              <span>{cad.rotulo}</span>
                            </div>
                            <div className="fg-cell-sub">
                              {formatarBytes(cad.tamanhoBytes)}
                              {cad.sha256 ? ` · sha256:${cad.sha256.slice(0, 14)}…` : ''}
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            {cad.sha256 && (
                              <button
                                type="button"
                                className="fg-btn fg-btn--sm"
                                title="Copiar hash SHA-256 completo"
                                onClick={() => copiarHash(cad.sha256!)}
                              >
                                {hashCopiado === cad.sha256 ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
                              </button>
                            )}
                            <button
                              type="button"
                              className="fg-btn fg-btn--sm"
                              onClick={() =>
                                setPdfPreview({
                                  titulo: `DOM-GRU #${ed.codigoDom} — ${ed.dataBr}`,
                                  subtitulo: `${cad.rotulo} · ${formatarBytes(cad.tamanhoBytes)}`,
                                  url: cad.pdfUrl,
                                  sha256: cad.sha256,
                                })
                              }
                            >
                              <Eye size={13} aria-hidden />
                              <span>Ler</span>
                            </button>
                            <a
                              href={cad.pdfUrl}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="fg-btn fg-btn--primary fg-btn--sm"
                            >
                              <span>PDF</span>
                              <ArrowUpRight size={12} aria-hidden />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              }

              if (item.tipo === 'LEGISLATIVO') {
                const dol = item.dol;
                const domNoMesmoDia = domPorDataIso.get(dol.dataPublicacao);

                return (
                  <article key={dol.id} className="fg-clean-card fg-clean-card--leg">
                    <div className="fg-clean-card__top">
                      <div className="fg-clean-card__badges">
                        <span className="fg-badge fg-badge--amber">
                          Legislativo · DOL nº {dol.numeroEdicao ?? dol.documentoId}
                        </span>
                        <span className="fg-badge fg-badge--blue">{dol.dataBr}</span>
                        {dol.protocolo && <span className="fg-tag">Prot. {dol.protocolo}</span>}
                      </div>
                      <span className="fg-badge fg-badge--emerald">{dol.situacao}</span>
                    </div>

                    <h3 className="fg-clean-card__title">{dol.titulo} — Câmara Municipal de Guarulhos</h3>

                    <p className="fg-clean-card__text">
                      Edição oficial do Poder Legislativo protocolada em {dol.dataProtocolo} sob o nº{' '}
                      <strong>{dol.protocolo ?? 'oficial'}</strong>. Contém pautas, atas, expedientes de sessão e atos
                      legislativos da Câmara Municipal.
                    </p>

                    {domNoMesmoDia && (
                      <div className="fg-dual-day__chips">
                        <button
                          type="button"
                          className="fg-mini-chip fg-mini-chip--blue"
                          onClick={() =>
                            setPdfPreview({
                              titulo: `DOM-GRU #${domNoMesmoDia.codigoDom} (${domNoMesmoDia.dataBr})`,
                              subtitulo: `Edição do Executivo publicada na mesma data do DOL nº ${dol.numeroEdicao}`,
                              url: domNoMesmoDia.pdfPrincipalUrl,
                              sha256: domNoMesmoDia.sha256Principal,
                            })
                          }
                        >
                          Executivo no mesmo dia: DOM #{domNoMesmoDia.codigoDom} ({domNoMesmoDia.totalPaginas} págs)
                        </button>
                      </div>
                    )}

                    <div className="fg-clean-card__foot">
                      <span className="fg-cell-sub">Catálogo validado HTTP 200 · CAPTCHA no download</span>
                      <a
                        href={dol.documentoUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="fg-btn fg-btn--primary fg-btn--sm"
                      >
                        <span>Abrir no portal da Câmara</span>
                        <ExternalLink size={13} aria-hidden />
                      </a>
                    </div>
                  </article>
                );
              }

              if (item.tipo === 'CONTRATO') {
                const ext = item.ext;
                const termoBuscaForn = ext.contratada
                  .replace(/\b(LTDA|S\/A|S\.A\.|EPP|ME|EIRELI)\b/gi, '')
                  .trim()
                  .split(/\s+/)
                  .slice(0, 3)
                  .join(' ');
                return (
                  <article key={ext.id} className="fg-clean-card">
                    <div className="fg-clean-card__top">
                      <div className="fg-clean-card__badges">
                        <span className="fg-badge fg-badge--amber">{ext.tipo}</span>
                        <span className="fg-badge fg-badge--blue">{ext.dataBr}</span>
                        <span className="fg-badge fg-badge--navy">DOM #{ext.codigoDom} · Pág. {ext.pagina}</span>
                      </div>
                      {ext.valor && <strong className="fg-clean-card__amount">{brl(ext.valor)}</strong>}
                    </div>

                    <h3 className="fg-clean-card__title">{nomeLegivel(ext.contratada)}</h3>
                    <p className="fg-clean-card__text">{ext.objeto}</p>

                    <div className="fg-clean-card__foot">
                      <Link
                        to={`/despesas?ano=todos&q=${encodeURIComponent(termoBuscaForn)}`}
                        className="fg-link-inline"
                      >
                        <span>Cruzar pagamentos no TCE-SP</span>
                        <ArrowRight size={13} aria-hidden />
                      </Link>
                      <div className="fg-clean-card__actions">
                        <button
                          type="button"
                          className="fg-btn fg-btn--sm"
                          onClick={() =>
                            setPdfPreview({
                              titulo: `${ext.tipo} — ${nomeLegivel(ext.contratada)}`,
                              subtitulo: `DOM #${ext.codigoDom} (${ext.dataBr}) · Página ${ext.pagina}${ext.valorFmt ? ` · ${ext.valorFmt}` : ''}`,
                              url: ext.pdfUrl,
                              sha256: ext.sha256Pdf,
                            })
                          }
                        >
                          <Eye size={13} aria-hidden />
                          <span>Ler no PDF</span>
                        </button>
                        <a
                          href={ext.pdfUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-btn fg-btn--primary fg-btn--sm"
                        >
                          <span>Abrir PDF</span>
                          <ArrowUpRight size={13} aria-hidden />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              }

              const lei = item.lei;
              return (
                <article key={`lei-${lei.numero}`} className="fg-clean-card">
                  <div className="fg-clean-card__top">
                    <div className="fg-clean-card__badges">
                      <span className="fg-badge fg-badge--blue">{lei.tema || 'Lei Municipal'}</span>
                      <span className="fg-cell-sub">
                        Lei nº <strong>{lei.numeroFmt}</strong> · {lei.dataBr}
                      </span>
                    </div>
                    {lei.projetoOrigem && <span className="fg-tag">{lei.projetoOrigem}</span>}
                  </div>

                  <h3 className="fg-clean-card__title">
                    {lei.tituloSimples || `Lei Municipal nº ${lei.numeroFmt}`}
                  </h3>

                  <p className="fg-clean-card__summary-box">
                    {lei.oQueMuda || lei.ementa}
                  </p>

                  <div className="fg-clean-card__foot">
                    <span className="fg-cell-sub">
                      Autoria: <strong>{lei.autorLimpo || lei.autoria}</strong> · DOM #{lei.codigoDom}
                    </span>
                    <div className="fg-clean-card__actions">
                      <button
                        type="button"
                        className="fg-btn fg-btn--primary fg-btn--sm"
                        onClick={() => setLeiRaioX(lei)}
                      >
                        <BookOpen size={13} aria-hidden />
                        <span>Ler lei inteira</span>
                      </button>
                      <a
                        href={lei.pdfUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="fg-btn fg-btn--sm"
                      >
                        <span>PDF</span>
                        <ArrowUpRight size={13} aria-hidden />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="fg-card" style={{ marginTop: 18, padding: 0, overflow: 'hidden' }}>
            <PaginacaoModerna
              pagina={pagDiario}
              totalItens={acervoUnificadoFiltrado.length}
              itensPorPagina={LIMIT_DIARIOS}
              rotuloItem="publicações oficiais"
              onMudarPagina={setPagDiario}
            />
          </div>
        </section>
      )}

      {/* ====================================================================
          ABA 5: FONTES VALIDADAS E TELEMETRIA SHA-256
          ==================================================================== */}
      {abaAtiva === 'fontes_tempo_real' && (
        <section aria-label="Validação das fontes oficiais e integridade SHA-256">
          <div className="fg-audit-explainer">
            <div className="fg-audit-explainer__icon">
              <HardDrive size={20} aria-hidden />
            </div>
            <div
              className="fg-audit-explainer__content"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <strong>Validação das 7 fontes oficiais e verificação SHA-256 dos arquivos</strong>
                <p>
                  Última aferição em{' '}
                  <strong>{relatorioTempoReal ? dataHoraBr(relatorioTempoReal.verificadoEmIso) : 'agora'}</strong> ·{' '}
                  {QTD_PDFS_EXECUTIVO} PDFs do Executivo ({TAMANHO_ACERVO_MB.toLocaleString('pt-BR')} MB) verificados
                  sem falhas.
                </p>
              </div>
              <button
                type="button"
                className="fg-btn fg-btn--primary"
                onClick={() => setCicloVerificacao((c) => c + 1)}
                disabled={verificandoFontes}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <RefreshCw size={14} className={verificandoFontes ? 'fg-spin' : ''} aria-hidden />
                <span>Revalidar fontes</span>
              </button>
            </div>
          </div>

          <div className="fg-table-wrap">
            <div className="fg-table-scroll">
              <table className="fg-table fg-table--cards">
                <thead>
                  <tr>
                    <th>Fonte Oficial</th>
                    <th>Status</th>
                    <th className="num">Resposta</th>
                    <th className="num">Registros</th>
                    <th>Extração e Hash</th>
                    <th style={{ textAlign: 'right' }}>Conferir</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioTempoReal?.fontes.map((f) => (
                    <tr key={f.id}>
                      <td data-label="Fonte">
                        <div className="fg-cell-name">{f.nomeOficial}</div>
                        <div style={{ fontSize: '0.78rem', color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                          {f.escopoAuditado}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2, maxWidth: 460 }}>
                          {f.descricaoTecnica}
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className="fg-badge fg-badge--emerald">
                          <CheckCircle2 size={12} aria-hidden />
                          Validada
                        </span>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 4 }}>
                          Até {dataBr(f.ultimaDataBase)}
                        </div>
                      </td>
                      <td data-label="Resposta" className="num" style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {f.latenciaMs} ms
                      </td>
                      <td data-label="Registros" className="num fg-money" style={{ fontFamily: 'var(--font-mono)' }}>
                        {inteiro(f.registrosConfirmados)}
                      </td>
                      <td data-label="Protocolo">
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>
                          {f.protocoloExtracao}
                        </div>
                        <div className="fg-cell-sub" style={{ marginTop: 2 }}>
                          {f.hashAuditoria}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={f.portalHumanoUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="fg-btn fg-btn--sm"
                        >
                          <Database size={13} aria-hidden />
                          <span>{f.portalHumanoLabel}</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ====================================================================
          MODAL: LEITOR INTEGRADO DE PDF (COM HASH SHA-256)
          ==================================================================== */}
      {pdfPreview && (
        <div
          className="fg-modal"
          role="dialog"
          aria-modal="true"
          aria-label={pdfPreview.titulo}
          onClick={() => setPdfPreview(null)}
        >
          <div className="fg-modal__dialog fg-modal__dialog--pdf" onClick={(e) => e.stopPropagation()}>
            <div className="fg-modal__head" style={{ alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <strong className="fg-modal__title" style={{ display: 'block' }}>
                  {pdfPreview.titulo}
                </strong>
                <span className="fg-modal__sub">{pdfPreview.subtitulo}</span>
                {pdfPreview.sha256 && (
                  <div style={{ fontSize: '0.7rem', color: '#6ee7b7', fontFamily: 'var(--font-mono)', marginTop: 3 }}>
                    Integridade verificada: {pdfPreview.sha256}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                <a
                  href={pdfPreview.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="fg-btn-audit-live"
                  style={{ padding: '7px 12px', fontSize: '0.78rem' }}
                >
                  <span>Abrir em nova aba</span>
                  <ArrowUpRight size={14} aria-hidden />
                </a>
                <button
                  type="button"
                  className="fg-modal__close"
                  onClick={() => setPdfPreview(null)}
                  aria-label="Fechar visualizador"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>
            <div className="fg-pdf-mobile-tip">
              No celular, caso o leitor embutido não exiba todas as páginas, toque em <strong>“Abrir em nova aba”</strong>.
            </div>
            {urlPdfOficialSegura(pdfPreview.url) ? (
              <iframe
                src={urlPdfOficialSegura(pdfPreview.url)!}
                title={pdfPreview.titulo}
                referrerPolicy="no-referrer"
                style={{ width: '100%', flex: 1, border: 0, background: '#f1f5f9' }}
              />
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#475569' }}>
                Link fora do domínio oficial validado. Use “Abrir em nova aba”.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Ficha Técnica do Decreto */}
      {decretoSelecionado && (
        <div
          className="fg-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes do ${decretoSelecionado.numeroDecreto}`}
          onClick={() => setDecretoSelecionado(null)}
        >
          <div className="fg-modal__dialog" onClick={(e) => e.stopPropagation()}>
            <div className="fg-modal__head">
              <div>
                <span className="fg-badge fg-badge--emerald" style={{ marginBottom: 6 }}>
                  <CheckCircle2 size={12} aria-hidden />
                  Publicado no Diário Oficial de Guarulhos
                </span>
                <h2 className="fg-modal__title">
                  {decretoSelecionado.numeroDecreto} — {decretoSelecionado.edicaoDiarioOficial}
                </h2>
                <div className="fg-modal__sub">Base legal: {decretoSelecionado.baseLegal}</div>
              </div>
              <button
                type="button"
                className="fg-modal__close"
                onClick={() => setDecretoSelecionado(null)}
                aria-label="Fechar detalhes"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            <div className="fg-modal__body" style={{ display: 'grid', gap: 14 }}>
              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', marginBottom: 4 }}>
                  Conferência documental
                </div>
                <div style={{ fontSize: '0.88rem', color: '#064e3b', lineHeight: 1.55 }}>
                  {decretoSelecionado.parecerAuditoriaTecnica}
                </div>
              </div>

              <div style={{ padding: '12px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                  Assinatura e referência do PDF oficial
                </div>
                <code style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#0f172a', wordBreak: 'break-all' }}>
                  {decretoSelecionado.hashIntegridadeSha256 ?? decretoSelecionado.urlDiarioOficial}
                </code>
              </div>
            </div>

            <div className="fg-modal__foot">
              <a
                href={decretoSelecionado.urlDiarioOficial}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-btn fg-btn--primary"
                style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>Abrir PDF oficial ({decretoSelecionado.paginaDiario})</span>
                <ArrowUpRight size={14} aria-hidden />
              </a>
              <button type="button" className="fg-btn" onClick={() => setDecretoSelecionado(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gaveta Raio-X: Conteúdo Completo e Explicado de Qualquer um dos 843 Decretos */}
      <PainelRaioX
        aberto={Boolean(decretoCatalogoRaioX)}
        onFechar={() => setDecretoCatalogoRaioX(null)}
        eyebrow={
          decretoCatalogoRaioX
            ? `${decretoCatalogoRaioX.modalidade === 'REMANEJAMENTO' ? 'Remanejamento (Art. 6º LOA)' : 'Crédito Adicional Suplementar'} · ${decretoCatalogoRaioX.dataBr}`
            : undefined
        }
        titulo={decretoCatalogoRaioX ? `Decreto nº ${decretoCatalogoRaioX.numeroFmt}` : ''}
        subtitulo={
          decretoCatalogoRaioX
            ? `Valor movimentado: ${brl(decretoCatalogoRaioX.valor)}${decretoCatalogoRaioX.codigoDom ? ` · DOM #${decretoCatalogoRaioX.codigoDom} (Pág. ${decretoCatalogoRaioX.pagina})` : ''}`
            : undefined
        }
        rodape={
          decretoCatalogoRaioX ? (
            <>
              <button
                type="button"
                className="fg-btn fg-btn--sm"
                onClick={() => {
                  const d = decretoCatalogoRaioX;
                  setDecretoCatalogoRaioX(null);
                  setPdfPreview({
                    titulo: `Decreto nº ${d.numeroFmt} (${d.dataBr})`,
                    subtitulo: `Página ${d.pagina} de ${d.totalPaginas} · ${brl(d.valor)}`,
                    url: d.pdfUrl,
                  });
                }}
              >
                <Eye size={13} aria-hidden />
                <span>Ver página no leitor PDF</span>
              </button>
              <a
                href={decretoCatalogoRaioX.pdfUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-btn fg-btn--primary fg-btn--sm"
              >
                <span>Abrir PDF oficial ↗</span>
              </a>
            </>
          ) : undefined
        }
      >
        {decretoCatalogoRaioX && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="fg-sheet-section">
              <div className="fg-sheet-section__head">
                <Scale size={14} aria-hidden />
                <span>Em linguagem simples: o que este decreto fez?</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.92rem', color: '#0f172a', fontWeight: 700, lineHeight: 1.55 }}>
                {decretoCatalogoRaioX.explicacaoSimples || decretoCatalogoRaioX.trecho}
              </p>
              {decretoCatalogoRaioX.processoSei && (
                <div className="fg-cell-sub" style={{ fontFamily: 'var(--font-mono)' }}>
                  Processo administrativo nº {decretoCatalogoRaioX.processoSei}
                </div>
              )}
            </div>

            <div className="fg-flow-mini">
              <div className="fg-flow-mini__row fg-flow-mini__row--out">
                <span>De onde saiu (Art. 2º):</span>
                <strong>{decretoCatalogoRaioX.origemResumo || decretoCatalogoRaioX.tipoFonteOrigem}</strong>
              </div>
              <div className="fg-flow-mini__row fg-flow-mini__row--in">
                <span>Para onde foi (Art. 1º):</span>
                <strong>{decretoCatalogoRaioX.destinoResumo || 'Dotação suplementada no orçamento'}</strong>
              </div>
            </div>

            <div className="fg-sheet-section">
              <div className="fg-sheet-section__head">
                <FileText size={14} aria-hidden />
                <span>Texto oficial completo extraído do Diário Oficial</span>
              </div>
              <p className="fg-fulltext-box">
                {decretoCatalogoRaioX.textoIntegral || decretoCatalogoRaioX.trecho}
              </p>
            </div>
          </div>
        )}
      </PainelRaioX>

      {/* Gaveta Raio-X: Conteúdo Completo e Explicado de Qualquer uma das 197 Leis */}
      <PainelRaioX
        aberto={Boolean(leiRaioX)}
        onFechar={() => setLeiRaioX(null)}
        eyebrow={leiRaioX ? `${leiRaioX.tema || 'Lei Municipal'} · DOM #${leiRaioX.codigoDom} (${leiRaioX.dataBr})` : undefined}
        titulo={leiRaioX ? `Lei Municipal nº ${leiRaioX.numeroFmt}` : ''}
        subtitulo={
          leiRaioX
            ? `Autoria: ${leiRaioX.autorLimpo || leiRaioX.autoria}${leiRaioX.projetoOrigem ? ` · Origem: ${leiRaioX.projetoOrigem}` : ''}`
            : undefined
        }
        rodape={
          leiRaioX ? (
            <>
              <button
                type="button"
                className="fg-btn fg-btn--sm"
                onClick={() => {
                  const l = leiRaioX;
                  setLeiRaioX(null);
                  setPdfPreview({
                    titulo: `Lei Municipal nº ${l.numeroFmt} (${l.dataBr})`,
                    subtitulo: `${l.autorLimpo || l.autoria} · DOM #${l.codigoDom}`,
                    url: l.pdfUrl,
                    sha256: l.sha256Pdf,
                  });
                }}
              >
                <Eye size={13} aria-hidden />
                <span>Ver página no leitor PDF</span>
              </button>
              <a
                href={leiRaioX.pdfUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="fg-btn fg-btn--primary fg-btn--sm"
              >
                <span>Abrir PDF oficial ↗</span>
              </a>
            </>
          ) : undefined
        }
      >
        {leiRaioX && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div className="fg-sheet-section">
              <div className="fg-sheet-section__head">
                <Scale size={14} aria-hidden />
                <span>O que esta lei faz na prática</span>
              </div>
              <strong style={{ fontSize: '0.98rem', color: '#09152b', lineHeight: 1.35 }}>
                {leiRaioX.tituloSimples || `Lei nº ${leiRaioX.numeroFmt}`}
              </strong>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#334155', lineHeight: 1.55 }}>
                {leiRaioX.oQueMuda || leiRaioX.ementa}
              </p>
            </div>

            <div className="fg-sheet-section">
              <div className="fg-sheet-section__head">
                <BookOpen size={14} aria-hidden />
                <span>Texto oficial extraído do Diário Oficial</span>
              </div>
              <p className="fg-fulltext-box">
                {leiRaioX.textoIntegral || `${leiRaioX.autoria}\n\n${leiRaioX.ementa}`}
              </p>
              {leiRaioX.sha256Pdf && (
                <div className="fg-cell-sub" style={{ fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                  SHA-256 do PDF: {leiRaioX.sha256Pdf}
                </div>
              )}
            </div>
          </div>
        )}
      </PainelRaioX>
    </div>
  );
}
