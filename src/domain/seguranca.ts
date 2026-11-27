/**
 * ============================================================================
 * CAMADA DE SEGURANÇA DO FRONT-END — FISCALIZA GUARULHOS
 * ============================================================================
 * - Lista branca (allowlist) estrita para URLs exibidas em <iframe> de PDF.
 * - Proteção contra CSV Formula Injection (OWASP) na exportação de planilhas.
 * - Hash determinístico de shard (0..f) para carregamento mínimo sob demanda.
 * ============================================================================
 */

const HOSTS_PDF_OFICIAIS = new Set([
  'diariooficial.guarulhos.sp.gov.br',
  'www.guarulhos.sp.gov.br',
  'guarulhos.sp.gov.br',
  'www.guarulhos.sp.leg.br',
  'guarulhos.sp.leg.br',
]);

/** Valida que a URL do leitor de PDF pertence estritamente a um domínio oficial HTTPS. */
export function urlPdfOficialSegura(raw?: string | null): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    if (!HOSTS_PDF_OFICIAIS.has(u.hostname.toLowerCase())) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/**
 * Neutraliza CSV Formula Injection (OWASP): valores iniciados por =, +, -, @,
 * tab ou quebra de linha recebem prefixo ' antes de ir para o Excel/LibreOffice.
 */
export function sanitizarCelulaCsv(valor: unknown): string {
  let s = String(valor ?? '')
    .replace(/\r?\n/g, ' ')
    .trim();
  if (/^[=+\-@\t\r]/.test(s)) {
    // Permite números negativos puros (ex: -1200,50) em colunas monetárias; neutraliza fórmulas
    if (!/^-\d+([.,]\d+)?$/.test(s)) {
      s = `'${s}`;
    }
  }
  if (s.includes(';') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Calcula o shard hexadecimal (0..f) de forma idêntica no gerador Node e no navegador. */
export function shardHexDaChave(chave: string): string {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) & 0xf).toString(16);
}
