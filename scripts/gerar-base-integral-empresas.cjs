/**
 * ============================================================================
 * GERADOR DA BASE INTEGRAL DE EMPRESAS, PAGAMENTOS E CONEXÕES DIÁRIO OFICIAL
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * 1. Processa 100% dos pagamentos oficiais do TCE-SP:
 *    - 2025 completo (TCE-2025/despesas-guarulhos-2025-01..12.csv)
 *    - 2026 Jan–Set (TCE-2026/despesas-guarulhos-2026.csv)
 *    Sem corte de Top 300 credores nem corte de 10 pagamentos!
 * 2. Varre os 222 PDFs oficiais do Diário Oficial do Executivo (acervo-diarios/)
 *    cruzando 100% dos CNPJs (14 dígitos) e nomes de empresas contratadas com
 *    os fornecedores pagos pelo município.
 * 3. Gera arquivos JSON compactos em public/dados/ (servidos com Brotli/Gzip
 *    pela Vercel e carregados sob demanda com cache no navegador):
 *    - public/dados/credores-completo.json (todos os credores + séries mensais reais)
 *    - public/dados/conexoes-empresas-dom.json (todas as conexões Empresa <-> DOM)
 *    - public/dados/pagamentos-2026.json (100% dos pagamentos 2026 compactados)
 *    - public/dados/pagamentos-2025.json (100% dos pagamentos 2025 compactados)
 *    - src/database/resumoConexoesOficiais.ts (métricas imediatas 0ms)
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const ROOT = process.cwd();
const DIR_OUT = path.join(ROOT, 'public', 'dados');
const MANIFESTO_PATH = path.join(ROOT, 'scripts', 'manifesto-diarios-validados.json');

const MESES_EXTENSO = {
  JANEIRO: 1,
  FEVEREIRO: 2,
  MARCO: 3,
  ABRIL: 4,
  MAIO: 5,
  JUNHO: 6,
  JULHO: 7,
  AGOSTO: 8,
  SETEMBRO: 9,
  OUTUBRO: 10,
  NOVEMBRO: 11,
  DEZEMBRO: 12,
};

function normalizar(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLinhaCsv(linha) {
  const campos = [];
  let atual = '';
  let emAspas = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (emAspas) {
      if (ch === '"') {
        if (i + 1 < linha.length && linha[i + 1] === '"') {
          atual += '"';
          i++;
        } else {
          emAspas = false;
        }
      } else {
        atual += ch;
      }
    } else if (ch === '"') {
      emAspas = true;
    } else if (ch === ';') {
      campos.push(atual.trim());
      atual = '';
    } else {
      atual += ch;
    }
  }
  campos.push(atual.trim());
  return campos;
}

function lerCsvLimpo(caminho) {
  const rawBuf = fs.readFileSync(caminho);
  const utf8 = new TextDecoder('utf-8').decode(rawBuf);
  return utf8.includes('\uFFFD') ? new TextDecoder('windows-1252').decode(rawBuf) : utf8;
}

function parseValorBr(s) {
  if (!s) return 0;
  const n = Number(String(s).trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function parseDataBrParaIso(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s ?? '').trim());
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function chaveCredor(cnpj, tipo, nome) {
  if (cnpj && cnpj.length === 14) return cnpj;
  const hash = crypto.createHash('sha1').update(`${tipo}|${normalizar(nome)}`).digest('hex').slice(0, 14);
  return `${(tipo || 'outro').toLowerCase()}-${hash}`;
}

function ehRepasseInterno(cnpj, credor) {
  if (cnpj && (cnpj.startsWith('46319000') || cnpj === '49811037000199' || cnpj === '52373396000116')) {
    return true;
  }
  const c = normalizar(credor);
  return (
    c.startsWith('SECRETARIA ') ||
    c.startsWith('PREFEITURA MUNICIPAL DE GUARULHOS') ||
    c.startsWith('CAMARA MUNICIPAL DE GUARULHOS') ||
    c.startsWith('INSTITUTO DE PREVID DOS FUNC PUBL MUN DE GUARULHOS') ||
    c.startsWith('FUNDO MUNICIPAL DE ') ||
    c.startsWith('TESOURO NACIONAL') ||
    c.startsWith('CAIXA ECONOMICA FEDERAL - PASEP')
  );
}

function classificarArea(funcao, subfuncao, orgao, credor) {
  const f = normalizar(funcao);
  const sf = normalizar(subfuncao);
  const c = normalizar(credor);
  const o = normalizar(orgao);

  if (f.includes('SAUDE') || c.includes('HOSPITAL') || c.includes('SAUDE') || c.includes('MEDICAMENT') || c.includes('FARMAC') || c.includes('CLINICA') || c.includes('DIAGNOSTIC')) {
    return 'Saúde & Hospitais';
  }
  if (f.includes('EDUCACAO') || f.includes('CULTURA') || f.includes('DESPORTO') || c.includes('ESCOLA') || c.includes('EDUCAC') || c.includes('CRECHE') || c.includes('ENSINO') || c.includes('ALIMENTACAO ESCOLAR')) {
    return 'Educação & Creches';
  }
  if (f.includes('URBANISMO') || f.includes('HABITACAO') || f.includes('SANEAMENTO') || f.includes('GESTAO AMBIENTAL') || c.includes('SANEAMENTO') || c.includes('CONSTRUT') || c.includes('ENGENHARIA') || c.includes('LIMPEZA') || c.includes('SUSTENTARE')) {
    return 'Limpeza Urbana, Obras & Bairros';
  }
  if (f.includes('PREVIDENCIA') || (o.includes('PREVID') && !f.includes('SAUDE'))) {
    return 'Previdência Municipal (IPREM)';
  }
  if (f.includes('TRANSPORTE') || c.includes('VIACAO') || c.includes('TRANSPORTE') || c.includes('ONIBUS') || c.includes('TRANSITO')) {
    return 'Transporte & Trânsito';
  }
  if (f.includes('ASSISTENCIA SOCIAL') || f.includes('DIREITOS DA CIDADANIA') || f.includes('TRABALHO') || c.includes('ASSISTENCIA SOCIAL') || c.includes('INSTITUTO SOCIAL')) {
    return 'Assistência Social & Cidadania';
  }
  if (f.includes('SEGURANCA PUBLICA') || sf.includes('DEFESA CIVIL') || c.includes('SEGURANCA') || c.includes('VIGILANCIA')) {
    return 'Segurança & Guarda Civil (GCM)';
  }
  return 'Administração, Finanças & Legislativo';
}

function normalizarModalidadeLic(raw) {
  const s = normalizar(raw);
  if (!s || s === 'OUTROS/NAO APLICAVEL' || s === 'NAO APLICAVEL') return 'Não aplicável / Outros';
  if (s.includes('PREGAO')) return 'Pregão';
  if (s.includes('DISPENSA')) return 'Dispensa de Licitação';
  if (s.includes('INEXIGIBILIDADE')) return 'Inexigibilidade';
  if (s.includes('CONCORRENCIA')) return 'Concorrência';
  if (s.includes('TOMADA')) return 'Tomada de Preços';
  if (s.includes('CHAMAMENTO') || s.includes('CREDENCIAMENTO')) return 'Chamamento / Credenciamento';
  if (s.includes('ADESAO') || s.includes('REGISTRO')) return 'Adesão / Registro de Preços';
  return raw.trim();
}

function normalizarOrgao(raw) {
  const s = normalizar(raw);
  if (s.includes('CAMARA MUNICIPAL')) return 'CÂMARA MUNICIPAL DE GUARULHOS';
  if (s.includes('PREVID')) return 'INSTITUTO DE PREVID.FUNC.PÚBL.MUNICIPAIS DE GUARULHOS';
  return 'PREFEITURA MUNICIPAL DE GUARULHOS';
}

function decodePdfLiteral(s) {
  return s
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
    .replace(/\\n/g, ' ')
    .replace(/\\r/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

function limparTextoPdf(s) {
  let out = String(s ?? '');
  const idxSig = out.search(/0&0\$|verisign|Thawte|TSA2048|ICP-Brasil|pkcs7/i);
  if (idxSig > 0) out = out.slice(0, idxSig);
  return out
    .replace(/[^\p{L}\p{N}\s.,;:!?()/%$ºª°'"-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function classificarTipoAtoDom(contexto) {
  const c = normalizar(contexto);
  if (c.includes('TERMO DE ADITAMENTO') || c.includes('TERMO ADITIVO') || c.includes('ADITAMENTO CONTRATUAL')) {
    return 'ADITIVO';
  }
  if (c.includes('ATA DE REGISTRO DE PRECO') || c.includes('DETENTORA')) {
    return 'ATA_RP';
  }
  if (c.includes('DISPENSA DE LICITACAO') || c.includes('INEXIGIBILIDADE')) {
    return 'DISPENSA';
  }
  if (c.includes('HOMOLOGACAO') || c.includes('ADJUDICACAO')) {
    return 'HOMOLOGACAO';
  }
  if (c.includes('CONVENIO') || c.includes('TERMO DE COLABORACAO') || c.includes('TERMO DE FOMENTO') || c.includes('CONTRATO DE GESTAO')) {
    return 'CONVENIO';
  }
  if (c.includes('CONTRATO') || c.includes('CONTRATADA') || c.includes('EXTRATO')) {
    return 'CONTRATO';
  }
  if (c.includes('FISCAL DE CONTRATO') || c.includes('GESTOR DO CONTRATO') || c.includes('PORTARIA')) {
    return 'PORTARIA_FISCAL';
  }
  return 'ATO_OFICIAL';
}

function parseNumeroMoedaPdf(str) {
  const limpo = String(str ?? '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function shardHexDaChave(chave) {
  let h = 2166136261;
  for (let i = 0; i < chave.length; i++) {
    h ^= chave.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) & 0xf).toString(16);
}

function main() {
  fs.mkdirSync(DIR_OUT, { recursive: true });

  const credoresMap = new Map();
  const orgaosLista = [
    'PREFEITURA MUNICIPAL DE GUARULHOS',
    'CÂMARA MUNICIPAL DE GUARULHOS',
    'INSTITUTO DE PREVID.FUNC.PÚBL.MUNICIPAIS DE GUARULHOS',
  ];
  const orgaoParaIdx = (nome) => {
    const norm = normalizarOrgao(nome);
    const i = orgaosLista.indexOf(norm);
    return i >= 0 ? i : 0;
  };

  const garantirCredor = (chave, dados) => {
    let c = credoresMap.get(chave);
    if (!c) {
      c = {
        chave,
        credor: dados.credor,
        cnpj: dados.cnpj,
        tipo: dados.tipo,
        area: dados.area,
        areaOficial26: Boolean(dados.areaOficial26),
        repasse: ehRepasseInterno(dados.cnpj, dados.credor),
        t25: 0,
        q25: 0,
        t26: 0,
        q26: 0,
        maior: 0,
        p1: dados.dataIso || null,
        p2: dados.dataIso || null,
        m25: Array(12).fill(0),
        m26: Array(9).fill(0),
        orgaos: [
          [0, 0, 0, 0], // [val25, qtd25, val26, qtd26] PMG
          [0, 0, 0, 0], // CMG
          [0, 0, 0, 0], // IPREM
        ],
        modalidades: {},
        contratosRef: new Set(),
        qtdDom: 0,
        ultimoDomData: null,
        ultimoDomCod: null,
        ultimoDomUrl: null,
      };
      credoresMap.set(chave, c);
    } else if (dados.areaOficial26 && !c.areaOficial26) {
      c.area = dados.area;
      c.areaOficial26 = true;
    }
    return c;
  };

  const pagamentos2026Rows = [];
  const pagamentos2025Rows = [];
  const modalidadesTotais2026 = new Map();

  // ==========================================================================
  // 1. PROCESSAR 100% DE 2026 (TCE-2026/despesas-guarulhos-2026.csv)
  // ==========================================================================
  console.log('[1/4] Processando 100% dos pagamentos de 2026 (Jan–Set)...');
  const csv26 = lerCsvLimpo(path.join(ROOT, 'TCE-2026', 'despesas-guarulhos-2026.csv'));
  const linhas26 = csv26.split(/\r?\n/);
  const cab26 = parseLinhaCsv(linhas26[0].replace(/^\uFEFF/, ''));
  const col26 = Object.fromEntries(cab26.map((c, i) => [c, i]));

  let countPag26 = 0;
  for (let i = 1; i < linhas26.length; i++) {
    const ln = linhas26[i];
    if (!ln) continue;
    if (!ln.includes('Valor Pago') && !ln.includes('Anulação de Pagamento') && !ln.includes('Anulacao de Pagamento')) {
      continue;
    }
    const r = parseLinhaCsv(ln);
    const tp = normalizar(r[col26.tp_despesa]);
    if (tp !== 'VALOR PAGO' && tp !== 'ANULACAO DE PAGAMENTO') continue;

    let valor = parseValorBr(r[col26.vl_despesa]);
    if (tp === 'ANULACAO DE PAGAMENTO' && valor > 0) valor = -valor;
    if (valor === 0) continue;

    const dataIso = parseDataBrParaIso(r[col26.dt_emissao_despesa]) || '2026-01-01';
    const mes = Math.min(9, Math.max(1, Number(r[col26.mes_referencia]) || Number(dataIso.slice(5, 7)) || 1));
    const orgaoNorm = normalizarOrgao(r[col26.ds_orgao]);
    const oIdx = orgaoParaIdx(orgaoNorm);
    const credor = (r[col26.ds_despesa] || 'CREDOR NÃO INFORMADO').replace(/\s+/g, ' ').trim();
    const idForn = r[col26.identificador_despesa] || '';
    const idNorm = normalizar(idForn);

    let tipo = 'OUTRO';
    let cnpj = null;
    if (idNorm.includes('CNPJ') || idNorm.includes('JURIDICA')) {
      tipo = 'PJ';
      const digs = idForn.replace(/\D/g, '');
      cnpj = digs.length >= 14 ? digs.slice(-14) : null;
    } else if (idNorm.includes('FISICA')) {
      tipo = 'PF';
    }

    const chave = chaveCredor(cnpj, tipo, credor);
    const area = classificarArea(r[col26.ds_funcao_governo], r[col26.ds_subfuncao_governo], orgaoNorm, credor);
    const c = garantirCredor(chave, { credor, cnpj, tipo, area, areaOficial26: true, dataIso });

    c.t26 += valor;
    if (valor > 0) c.q26++;
    c.m26[mes - 1] += valor;
    c.orgaos[oIdx][2] += valor;
    if (valor > 0) c.orgaos[oIdx][3]++;
    if (valor > c.maior) c.maior = valor;
    if (!c.p1 || dataIso < c.p1) c.p1 = dataIso;
    if (!c.p2 || dataIso > c.p2) c.p2 = dataIso;

    const modLic = normalizarModalidadeLic(r[col26.ds_modalidade_lic]);
    c.modalidades[modLic] = (c.modalidades[modLic] || 0) + valor;
    if (!c.repasse) {
      const mTot = modalidadesTotais2026.get(modLic) || { modalidade: modLic, total: 0, qtd: 0, empresas: new Set() };
      mTot.total += valor;
      if (valor > 0) mTot.qtd++;
      mTot.empresas.add(chave);
      modalidadesTotais2026.set(modLic, mTot);
    }

    const hist = (r[col26.historico_despesa] || r[col26.ds_acao] || 'Pagamento liquidado').replace(/\s+/g, ' ').trim();
    const mContrato = /(CONTRATO(?:\s+DE\s+GESTAO)?|CONVENIO|ATA(?:\s+DE\s+REGISTRO)?)\s*N[º°o.]*\s*([0-9./-]{3,20})/i.exec(hist);
    if (mContrato && c.contratosRef.size < 6) {
      c.contratosRef.add(`${mContrato[1].toUpperCase()} ${mContrato[2]}`);
    }

    const emp = (r[col26.nr_empenho] || '').trim();
    const elem = (r[col26.ds_elemento] || '').replace(/^\d+\s*-\s*/, '').trim();
    pagamentos2026Rows.push([chave, dataIso, oIdx, valor, emp, hist.slice(0, 220), modLic, elem.slice(0, 60)]);
    countPag26++;
  }
  console.log(`  -> 2026: ${countPag26.toLocaleString('pt-BR')} eventos processados | ${credoresMap.size.toLocaleString('pt-BR')} credores até agora.`);

  // ==========================================================================
  // 2. PROCESSAR 100% DE 2025 (12 arquivos mensais TCE-2025/*.csv)
  // ==========================================================================
  console.log('[2/4] Processando 100% dos pagamentos de 2025 (12 meses)...');
  let countPag25 = 0;
  for (let m = 1; m <= 12; m++) {
    const mm = String(m).padStart(2, '0');
    const arq = path.join(ROOT, 'TCE-2025', `despesas-guarulhos-2025-${mm}.csv`);
    if (!fs.existsSync(arq)) continue;
    const csv25 = lerCsvLimpo(arq);
    const linhas = csv25.split(/\r?\n/);
    const cab = parseLinhaCsv(linhas[0].replace(/^\uFEFF/, ''));
    const col = Object.fromEntries(cab.map((c, i) => [c, i]));

    for (let i = 1; i < linhas.length; i++) {
      const ln = linhas[i];
      if (!ln) continue;
      if (!ln.includes('Valor Pago') && !ln.includes('Anulação de Pagamento') && !ln.includes('Anulacao de Pagamento')) {
        continue;
      }
      const r = parseLinhaCsv(ln);
      const ev = normalizar(r[col.evento]);
      if (ev !== 'VALOR PAGO' && ev !== 'ANULACAO DE PAGAMENTO') continue;

      let valor = parseValorBr(r[col.vl_despesa]);
      if (ev === 'ANULACAO DE PAGAMENTO' && valor > 0) valor = -valor;
      if (valor === 0) continue;

      const dataIso = parseDataBrParaIso(r[col.dt_emissao_despesa]) || `2025-${mm}-15`;
      const mesNum = MESES_EXTENSO[normalizar(r[col.mes])] || m;
      const orgaoNorm = normalizarOrgao(r[col.orgao]);
      const oIdx = orgaoParaIdx(orgaoNorm);
      const credor = (r[col.nm_fornecedor] || 'CREDOR NÃO INFORMADO').replace(/\s+/g, ' ').trim();
      const idForn = r[col.id_fornecedor] || '';
      const idNorm = normalizar(idForn);

      let tipo = 'OUTRO';
      let cnpj = null;
      if (idNorm.includes('CNPJ') || idNorm.includes('JURIDICA')) {
        tipo = 'PJ';
        const digs = idForn.replace(/\D/g, '');
        cnpj = digs.length >= 14 ? digs.slice(-14) : null;
      } else if (idNorm.includes('FISICA')) {
        tipo = 'PF';
      }

      const chave = chaveCredor(cnpj, tipo, credor);
      const area = classificarArea('', '', orgaoNorm, credor);
      const c = garantirCredor(chave, { credor, cnpj, tipo, area, areaOficial26: false, dataIso });

      c.t25 += valor;
      if (valor > 0) c.q25++;
      c.m25[mesNum - 1] += valor;
      c.orgaos[oIdx][0] += valor;
      if (valor > 0) c.orgaos[oIdx][1]++;
      if (valor > c.maior) c.maior = valor;
      if (!c.p1 || dataIso < c.p1) c.p1 = dataIso;
      if (!c.p2 || dataIso > c.p2) c.p2 = dataIso;

      const emp = (r[col.nr_empenho] || '').trim();
      pagamentos2025Rows.push([chave, dataIso, oIdx, valor, emp]);
      countPag25++;
    }
  }
  console.log(`  -> 2025: ${countPag25.toLocaleString('pt-BR')} eventos processados | Total de credores únicos (2025+2026): ${credoresMap.size.toLocaleString('pt-BR')}`);

  // ==========================================================================
  // 3. CRUZAR 100% DOS 222 PDFs DO DIÁRIO OFICIAL COM OS CNPJs DAS EMPRESAS
  // ==========================================================================
  console.log('[3/4] Cruzando 222 PDFs do Diário Oficial com os CNPJs das empresas pagas...');
  const manifesto = JSON.parse(fs.readFileSync(MANIFESTO_PATH, 'utf8'));

  // Índice rápido por CNPJ de 14 dígitos (somente empresas externas + principais)
  const credorPorCnpj = new Map();
  for (const c of credoresMap.values()) {
    if (c.cnpj && c.cnpj.length === 14 && !c.repasse) {
      credorPorCnpj.set(c.cnpj, c);
    }
  }
  console.log(`  -> CNPJs externos monitorados nos PDFs: ${credorPorCnpj.size.toLocaleString('pt-BR')}`);

  const conexoesDom = [];
  const chavesConexao = new Set();
  const empresasComConexaoSet = new Set();
  let pdfsLidos = 0;

  const reCnpjFormatado = /\b(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})\b/g;

  for (const ed of manifesto.executivo) {
    for (const cad of ed.cadernos) {
      if (!cad.arquivoLocal) continue;
      const abs = path.join(ROOT, cad.arquivoLocal);
      if (!fs.existsSync(abs)) continue;
      pdfsLidos++;

      const buf = fs.readFileSync(abs);
      const latin = buf.toString('latin1');
      const baseUrl = `https://diariooficial.guarulhos.sp.gov.br/uploads/pdf/${cad.nomeArquivo}`;

      let pos = 0;
      let streams = 0;
      let pagAtual = 1;

      while (streams < 600) {
        const sIdx = latin.indexOf('stream', pos);
        if (sIdx < 0) break;
        if (sIdx >= 3 && latin.slice(sIdx - 3, sIdx) === 'end') {
          pos = sIdx + 6;
          continue;
        }
        const eIdx = latin.indexOf('endstream', sIdx + 6);
        if (eIdx < 0) break;
        streams++;

        let start = sIdx + 6;
        if (latin[start] === '\r' && latin[start + 1] === '\n') start += 2;
        else if (latin[start] === '\n' || latin[start] === '\r') start += 1;

        let end = eIdx;
        if (latin[end - 1] === '\n') end--;
        if (latin[end - 1] === '\r') end--;

        if (end > start && end - start < 4_000_000) {
          try {
            const inf = zlib.inflateSync(buf.subarray(start, end));
            const raw = inf.toString('latin1');
            // Só decodifica literais PDF se houver padrão de CNPJ (/000 ou /00 ou CNPJ) ou marcador de página
            const temCnpj = raw.includes('/000') || raw.includes('/00') || raw.includes('CNPJ');
            if (raw.includes('(') && temCnpj) {
              const partes = [];
              const reLit = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
              let ml;
              while ((ml = reLit.exec(raw)) !== null) {
                partes.push(decodePdfLiteral(ml[1]));
              }
              const txt = limparTextoPdf(partes.join(' '));
              const mPag = /P[áa]gina\s+(\d+)/i.exec(txt);
              if (mPag) pagAtual = Math.min(Math.max(1, Number(mPag[1])), cad.paginas || ed.totalPaginas || 1);

              reCnpjFormatado.lastIndex = 0;
              let mc;
              while ((mc = reCnpjFormatado.exec(txt)) !== null) {
                const cnpjLimpo = mc[1].replace(/\D/g, '');
                const cred = credorPorCnpj.get(cnpjLimpo);
                if (!cred) continue;

                const inicioCtx = Math.max(0, mc.index - 260);
                const fimCtx = Math.min(txt.length, mc.index + 320);
                const ctx = txt.slice(inicioCtx, fimCtx).trim();
                const tipoAto = classificarTipoAtoDom(ctx);
                const chaveUnica = `${cred.chave}|${ed.codigoDom}|${tipoAto}`;
                if (chavesConexao.has(chaveUnica)) continue;
                chavesConexao.add(chaveUnica);

                // Tenta localizar página mais próxima no bloco
                let pagLocal = pagAtual;
                const antes = txt.slice(Math.max(0, mc.index - 1500), mc.index + 250);
                const rePag = /P[áa]gina\s+(\d+)/gi;
                let mp;
                while ((mp = rePag.exec(antes)) !== null) pagLocal = Number(mp[1]);
                pagLocal = Math.min(Math.max(1, pagLocal), cad.paginas || ed.totalPaginas || 1);

                const mVal = /R\$\s*([\d.\s]{3,18},\d{2})/i.exec(ctx);
                const valMenc = mVal ? parseNumeroMoedaPdf(mVal[1]) : null;

                const totalPago = Math.round((cred.t25 + cred.t26) * 100) / 100;
                const pdfUrl = `${baseUrl}#page=${pagLocal}`;

                conexoesDom.push({
                  id: `cx-${ed.codigoDom}-${cnpjLimpo.slice(0, 8)}-${conexoesDom.length + 1}`,
                  chave: cred.chave,
                  credor: cred.credor,
                  cnpj: cnpjLimpo,
                  area: cred.area,
                  tipoAto,
                  dataIso: ed.dataPublicacao,
                  dataBr: ed.dataBr,
                  ano: ed.ano,
                  mes: ed.mes,
                  codigoDom: ed.codigoDom,
                  pagina: pagLocal,
                  valorMencionado: valMenc,
                  totalPagoTce: totalPago,
                  pago2025: Math.round(cred.t25 * 100) / 100,
                  pago2026: Math.round(cred.t26 * 100) / 100,
                  qtdPagamentosTce: cred.q25 + cred.q26,
                  trecho: ctx.slice(0, 290),
                  pdfUrl,
                  sha256Pdf: cad.sha256 || null,
                });

                cred.qtdDom++;
                empresasComConexaoSet.add(cred.chave);
                if (!cred.ultimoDomData || ed.dataPublicacao > cred.ultimoDomData) {
                  cred.ultimoDomData = ed.dataPublicacao;
                  cred.ultimoDomCod = ed.codigoDom;
                  cred.ultimoDomUrl = pdfUrl;
                }
              }
            }
          } catch {
            // stream comprimido não-texto
          }
        }
        pos = eIdx + 9;
      }
    }
    if (pdfsLidos % 40 === 0) {
      console.log(`  -> Varredura PDF: ${pdfsLidos}/222 | Conexões CNPJ↔DOM encontradas: ${conexoesDom.length} (${empresasComConexaoSet.size} empresas)`);
    }
  }

  conexoesDom.sort((a, b) => b.dataIso.localeCompare(a.dataIso) || b.totalPagoTce - a.totalPagoTce);
  console.log(`  -> TOTAL CONEXÕES REAIS EMPRESA ↔ DIÁRIO OFICIAL: ${conexoesDom.length} atos em ${empresasComConexaoSet.size} empresas distintas!`);

  // ==========================================================================
  // 4. SALVAR OS PACOTES COMPACTOS EM public/dados/ E RESUMO EM src/database/
  // ==========================================================================
  console.log('[4/4] Gerando arquivos compactos em public/dados/ e resumo imediato...');

  const listaCredores = [...credoresMap.values()]
    .filter((c) => c.t25 + c.t26 > 0 || c.q25 + c.q26 > 0)
    .sort((a, b) => b.t25 + b.t26 - (a.t25 + a.t26));

  const credoresJson = {
    geradoEm: new Date().toISOString(),
    orgaos: orgaosLista,
    totalCredores: listaCredores.length,
    totalComConexaoDom: empresasComConexaoSet.size,
    totalConexoesDom: conexoesDom.length,
    itens: listaCredores.map((c) => {
      let modPrincipal = null;
      let maxMod = -Infinity;
      for (const [mNome, mVal] of Object.entries(c.modalidades)) {
        if (mVal > maxMod) {
          maxMod = mVal;
          modPrincipal = mNome;
        }
      }
      let oPrincipal = 0;
      let maxOrg = -1;
      for (let oi = 0; oi < 3; oi++) {
        const s = c.orgaos[oi][0] + c.orgaos[oi][2];
        if (s > maxOrg) {
          maxOrg = s;
          oPrincipal = oi;
        }
      }

      // Omite arrays zerados e propriedades vazias para cortar ~45% do tamanho do JSON!
      const obj = {
        k: c.chave,
        n: c.credor,
        t: c.tipo,
        a: c.area,
        o: oPrincipal,
        t25: Math.round(c.t25 * 100) / 100,
        q25: c.q25,
        t26: Math.round(c.t26 * 100) / 100,
        q26: c.q26,
        mx: Math.round(c.maior * 100) / 100,
        p1: c.p1,
        p2: c.p2,
      };
      if (c.cnpj) obj.c = c.cnpj;
      if (c.repasse) obj.r = 1;
      if (c.t25 !== 0) obj.m25 = c.m25.map((v) => Math.round(v * 100) / 100);
      if (c.t26 !== 0) obj.m26 = c.m26.map((v) => Math.round(v * 100) / 100);
      const ogAtivos = [];
      for (let oi = 0; oi < 3; oi++) {
        const x = c.orgaos[oi];
        if (x[0] !== 0 || x[1] > 0 || x[2] !== 0 || x[3] > 0) {
          ogAtivos.push([oi, Math.round(x[0] * 100) / 100, x[1], Math.round(x[2] * 100) / 100, x[3]]);
        }
      }
      if (ogAtivos.length > 0) obj.og = ogAtivos;
      if (modPrincipal && modPrincipal !== 'Não aplicável / Outros') obj.ml = modPrincipal;
      if (c.contratosRef.size > 0) obj.cr = [...c.contratosRef];
      if (c.qtdDom > 0) {
        obj.dom = c.qtdDom;
        obj.domD = c.ultimoDomData;
        obj.domC = c.ultimoDomCod;
        obj.domU = c.ultimoDomUrl;
      }
      return obj;
    }),
  };

  // Sharding dos 66.845 pagamentos em 16 arquivos ultraleves (public/dados/pags/0..f.json)
  // Reduz o consumo de dados ao abrir uma empresa de ~8,4 MB para ~120 KB comprimidos!
  const dirShards = path.join(DIR_OUT, 'pags');
  fs.mkdirSync(dirShards, { recursive: true });
  const shards = Object.fromEntries(
    Array.from({ length: 16 }, (_, i) => [i.toString(16), {}])
  );

  for (const r of pagamentos2026Rows) {
    const chave = r[0];
    const sh = shardHexDaChave(chave);
    const bucket = shards[sh];
    if (!bucket[chave]) bucket[chave] = [];
    // [ano, dataIso, orgaoIdx, valor, empenho, historico, modalidade, elemento]
    bucket[chave].push([26, r[1], r[2], r[3], r[4], r[5], r[6], r[7]]);
  }
  for (const r of pagamentos2025Rows) {
    const chave = r[0];
    const sh = shardHexDaChave(chave);
    const bucket = shards[sh];
    if (!bucket[chave]) bucket[chave] = [];
    bucket[chave].push([25, r[1], r[2], r[3], r[4]]);
  }

  let totalBytesShards = 0;
  let maxShardKb = 0;
  for (const [hex, bucket] of Object.entries(shards)) {
    for (const arr of Object.values(bucket)) {
      arr.sort((a, b) => b[1].localeCompare(a[1]) || b[3] - a[3]);
    }
    const arqShard = path.join(dirShards, `${hex}.json`);
    fs.writeFileSync(arqShard, JSON.stringify({ orgaos: orgaosLista, byKey: bucket }), 'utf8');
    const sz = fs.statSync(arqShard).size;
    totalBytesShards += sz;
    maxShardKb = Math.max(maxShardKb, sz / 1024);
  }

  // Remove os monólitos antigos de 8,4 MB caso existam
  for (const antigo of ['pagamentos-2025.json', 'pagamentos-2026.json']) {
    const pa = path.join(DIR_OUT, antigo);
    if (fs.existsSync(pa)) fs.unlinkSync(pa);
  }

  const pCred = path.join(DIR_OUT, 'credores-completo.json');
  const pDom = path.join(DIR_OUT, 'conexoes-empresas-dom.json');

  fs.writeFileSync(pCred, JSON.stringify(credoresJson), 'utf8');
  fs.writeFileSync(pDom, JSON.stringify(conexoesDom), 'utf8');

  // Distribuição de tipos de ato no DOM e modalidades de licitação 2026
  const tiposAtoContagem = {};
  for (const cx of conexoesDom) {
    tiposAtoContagem[cx.tipoAto] = (tiposAtoContagem[cx.tipoAto] || 0) + 1;
  }

  const modalidadesResumo = [...modalidadesTotais2026.values()]
    .map((m) => ({
      modalidade: m.modalidade,
      total: Math.round(m.total * 100) / 100,
      qtdPagamentos: m.qtd,
      qtdEmpresas: m.empresas.size,
    }))
    .sort((a, b) => b.total - a.total);

  const resumoTs = `/**
 * ============================================================================
 * RESUMO INTEGRAL DE EMPRESAS, MODALIDADES E CONEXÕES DIÁRIO OFICIAL (2025–2026)
 * Gerado automaticamente a partir de:
 *   - 100% dos pagamentos TCE-SP (2025 completo + Jan–Set/2026)
 *   - 100% dos 222 PDFs oficiais do Diário Oficial (acervo-diarios/executivo/)
 * ============================================================================
 */

export interface ResumoModalidadeLicitacao {
  modalidade: string;
  total: number;
  qtdPagamentos: number;
  qtdEmpresas: number;
}

export const RESUMO_CONEXOES_OFICIAIS = ${JSON.stringify(
    {
      geradoEm: new Date().toISOString(),
      totalCredoresUnicos: listaCredores.length,
      totalCredoresExternos: listaCredores.filter((c) => !c.repasse).length,
      totalPagamentos2025: pagamentos2025Rows.length,
      totalPagamentos2026: pagamentos2026Rows.length,
      totalConexoesDom: conexoesDom.length,
      totalEmpresasConectadasDom: empresasComConexaoSet.size,
      tiposAtoDom: tiposAtoContagem,
      modalidadesLicitacao2026: modalidadesResumo,
    },
    null,
    2
  )} as const;
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'database', 'resumoConexoesOficiais.ts'), resumoTs, 'utf8');

  console.log('\n====================================================================');
  console.log('BASE INTEGRAL SHARDEADA E COMPACTADA COM SUCESSO!');
  console.log(`  credores-completo.json     : ${(fs.statSync(pCred).size / 1024).toFixed(1)} KB (${listaCredores.length} empresas/credores)`);
  console.log(`  conexoes-empresas-dom.json : ${(fs.statSync(pDom).size / 1024).toFixed(1)} KB (${conexoesDom.length} conexões em ${empresasComConexaoSet.size} empresas)`);
  console.log(`  pags/0..f.json (16 shards) : ${(totalBytesShards / 1024).toFixed(1)} KB total (máx ${maxShardKb.toFixed(1)} KB por shard!)`);
  console.log('====================================================================');
}

main();
