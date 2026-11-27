/**
 * ============================================================================
 * TRADUTOR DE LINGUAGEM CIDADÃ & FORMATADOR DE HISTÓRICOS DE AUDITORIA
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * Transforma textos técnicos em CAIXA ALTA do TCE-SP e do Diário Oficial em
 * frases limpas, fáceis de ler e com metadados contratuais destacados em tags,
 * preservando sempre 100% do texto original para conferência integral.
 * ============================================================================
 */

export interface HistoricoTraduzido {
  resumoLimpo: string;
  tags: string[];
  temMaisConteudo: boolean;
}

const DICIONARIO_RESTAURACAO: [RegExp, string][] = [
  [/\bEXECUCAO\b/gi, 'execução'],
  [/\bSERVICOS\b/gi, 'serviços'],
  [/\bACOES\b/gi, 'ações'],
  [/\bSAUDE\b/gi, 'saúde'],
  [/\bEDUCACAO\b/gi, 'educação'],
  [/\bALIMENTACAO\b/gi, 'alimentação'],
  [/\bATENCAO\b/gi, 'atenção'],
  [/\bBASICA\b/gi, 'básica'],
  [/\bURGENCIA\b/gi, 'urgência'],
  [/\bURGENCIAS\b/gi, 'urgências'],
  [/\bMANUTENCAO\b/gi, 'manutenção'],
  [/\bLOCACAO\b/gi, 'locação'],
  [/\bIMOVEL\b/gi, 'imóvel'],
  [/\bIMOVEIS\b/gi, 'imóveis'],
  [/\bAQUISICAO\b/gi, 'aquisição'],
  [/\bPRESTACAO\b/gi, 'prestação'],
  [/\bGESTAO\b/gi, 'gestão'],
  [/\bCONVENIO\b/gi, 'convênio'],
  [/\bPRORROGACAO\b/gi, 'prorrogação'],
  [/\bADEQUACAO\b/gi, 'adequação'],
  [/\bDOTACAO\b/gi, 'dotação'],
  [/\bVIGENCIA\b/gi, 'vigência'],
  [/\bAUXILIO\b/gi, 'auxílio'],
  [/\bMEDICOS\b/gi, 'médicos'],
  [/\bMUNICIPIO\b/gi, 'Município'],
  [/\bPOPULACAO\b/gi, 'população'],
  [/\bPUBLICA\b/gi, 'pública'],
  [/\bPUBLICO\b/gi, 'público'],
  [/\bAGUA\b/gi, 'água'],
  [/\bPOTAVEL\b/gi, 'potável'],
  [/\bATRAVES\b/gi, 'por meio'],
  [/\bINSTALACAO\b/gi, 'instalação'],
  [/\bCONSTRUCAO\b/gi, 'construção'],
  [/\bPAVIMENTACAO\b/gi, 'pavimentação'],
  [/\bILUMINACAO\b/gi, 'iluminação'],
  [/\bRESIDUOS\b/gi, 'resíduos'],
  [/\bSOLIDOS\b/gi, 'sólidos'],
  [/\bTRANSPORTE\b/gi, 'transporte'],
  [/\bONIBUS\b/gi, 'ônibus'],
  [/\bINDENIZACAO\b/gi, 'indenização'],
  [/\bPRECATORIOS\b/gi, 'precatórios'],
];

const SIGLAS_MAIUSCULAS = new Set([
  'UBS', 'UPA', 'HMU', 'HMC', 'CAPS', 'SAMU', 'SUS', 'FMS', 'FUNDEB',
  'IPREM', 'CMG', 'PMG', 'GCM', 'EPG', 'EMEI', 'CEU', 'CRAS', 'CREAS',
  'CNPJ', 'CPF', 'SP', 'GRU', 'TI', 'LAI', 'LRF', 'TCE', 'TJSP', 'INSS', 'FGTS', 'PASEP',
]);

function paraFraseHumana(textoMaiusculo: string): string {
  let s = textoMaiusculo.replace(/\s+/g, ' ').trim();
  if (!s) return 'Pagamento liquidado conforme empenho.';

  // Se já tem minúsculas normais, apenas limpa espaços
  const qtdMin = (s.match(/[a-záéíóúãõç]/g) || []).length;
  const qtdMai = (s.match(/[A-ZÁÉÍÓÚÃÕÇ]/g) || []).length;
  if (qtdMin > qtdMai * 0.4) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  s = s.toLowerCase();
  for (const [re, sub] of DICIONARIO_RESTAURACAO) {
    s = s.replace(re, sub);
  }

  // Restaura siglas conhecidas
  s = s.replace(/\b([a-z]{2,6})\b/g, (m) => {
    const up = m.toUpperCase();
    return SIGLAS_MAIUSCULAS.has(up) ? up : m;
  });

  // Capitaliza primeira letra
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Separa metadados técnicos (Contrato, Convênio, Aditivo, Vigência, Lei) em tags
 * curtas e devolve um resumo limpo e legível da finalidade do gasto.
 */
export function traduzirHistoricoPagamento(bruto?: string | null): HistoricoTraduzido {
  const original = String(bruto ?? '').replace(/\s+/g, ' ').trim();
  if (!original) {
    return {
      resumoLimpo: 'Pagamento liquidado e registrado no TCE-SP.',
      tags: [],
      temMaisConteudo: false,
    };
  }

  const tags: string[] = [];

  const mContrato = /\b(CONTRATO(?:\s+DE\s+GEST[ÃA]O|\s+DE\s+LOCA[ÇC][ÃA]O)?|CONV[ÊE]NIO|ATA)\s*N[º°o.]*\s*([\d./-]{3,18})/i.exec(original);
  if (mContrato) {
    const tipo = mContrato[1].toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    tags.push(`${tipo} ${mContrato[2]}`);
  }

  const mAdit = /\bTERMO\s+DE\s+(?:ADITAMENTO|ADITIVO)[^0-9]{0,25}?N[º°o.]*\s*([\d./-]{1,14})/i.exec(original);
  if (mAdit) {
    tags.push(`Aditivo ${mAdit[1]}`);
  }

  const mVig = /\bVIG[ÊE]NCIA\s*:\s*(\d{2}\/\d{2}\/\d{4}\s*A\s*\d{2}\/\d{2}\/\d{4})/i.exec(original);
  if (mVig) {
    tags.push(`Vigência ${mVig[1].toLowerCase()}`);
  }

  const mLei = /\bLEI(?:\s+MUNICIPAL)?\s*N[º°o.]*\s*(\d[\d.\s]{2,7}\/\d{4})/i.exec(original);
  if (mLei) {
    tags.push(`Lei ${mLei[1].replace(/\s+/g, '.')}`);
  }

  // Corta o bloco técnico de contratos/aditivos do final para deixar a frase principal limpa
  let nucleo = original
    .replace(/\b(CONTRATO\s+DE\s+GEST[ÃA]O|CONTRATO\s+DE\s+LOCA[ÇC][ÃA]O|CONTRATO\s+N|CONV[ÊE]NIO\s+N|TERMO\s+DE\s+ADITAMENTO|TERMO\s+DE\s+APOSTILAMENTO|AUTORIZADO\s+ATRAV[ÉE]S\s+DA\s+LEI)[\s\S]*$/i, '')
    .replace(/[,;:\s-]+$/, '')
    .trim();

  if (nucleo.length < 18) nucleo = original;

  let resumoLimpo = paraFraseHumana(nucleo);
  const temMaisConteudo = original.length > 135;
  if (resumoLimpo.length > 155) {
    resumoLimpo = resumoLimpo.slice(0, 152).replace(/\s+\S*$/, '') + '…';
  } else if (!resumoLimpo.endsWith('.')) {
    resumoLimpo += '.';
  }

  return { resumoLimpo, tags: tags.slice(0, 3), temMaisConteudo };
}
