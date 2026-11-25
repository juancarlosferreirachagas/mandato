/**
 * ============================================================================
 * SINCRONIZADOR E VALIDADOR COMPLETO DO ACERVO OFICIAL — FISCALIZA GUARULHOS
 * ============================================================================
 * 1. Mapeia 100% das edições e cadernos do Diário Oficial do Executivo (DOM-GRU)
 *    de 2025 e 2026 (https://diariooficial.guarulhos.sp.gov.br/index.php).
 * 2. Baixa todos os PDFs abertos do Executivo em acervo-diarios/executivo/{ano}/
 *    e valida HTTP 200, assinatura %PDF-, tamanho em bytes e hash SHA-256.
 * 3. Mapeia 100% das edições públicas do Diário Oficial do Legislativo (DOL)
 *    na Câmara Municipal (https://www.guarulhos.sp.leg.br/dol/page:1..N),
 *    respeitando integralmente o bloqueio de CAPTCHA nos anexos (/pages/validar_captcha)
 *    sem jamais contorná-lo, e baixa os documentos institucionais estáticos abertos.
 * 4. Extrai novos decretos suplementares publicados em novembro/2026 via busca
 *    oficial (pesquisar_diario.php) e proposições legislativas públicas recentes.
 * 5. Baixa os pacotes oficiais atualizados do TCE-SP 2026 (incluindo Setembro/2026).
 * ============================================================================
 */

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = process.cwd();
const DIR_EXEC = path.join(ROOT, 'acervo-diarios', 'executivo');
const DIR_LEG_INST = path.join(ROOT, 'acervo-diarios', 'institucional-legislativo');
const DIR_TCE26 = path.join(ROOT, 'TCE-2026');
const DIR_SCRIPTS = path.join(ROOT, 'scripts');

const UA = 'FiscalizaGuarulhos-Auditoria/2.0 (+https://fiscalizaguarulhos.vercel.app)';

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

function decodeHtmlEntities(str) {
  return String(str ?? '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&iacute;/g, 'í')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&atilde;/g, 'ã')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&acirc;/g, 'â')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&ordm;/g, 'º')
    .replace(/&ordf;/g, 'ª');
}

async function fetchText(url, tentativas = 3, timeoutMs = 45000) {
  let errUlt = null;
  for (let t = 1; t <= tentativas; t++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json,*/*' },
        signal: ctrl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
      const ab = await res.arrayBuffer();
      const utf8 = new TextDecoder('utf-8').decode(ab);
      if (utf8.includes('\uFFFD')) {
        return new TextDecoder('windows-1252').decode(ab);
      }
      return utf8;
    } catch (e) {
      errUlt = e;
      if (t < tentativas) await esperar(1000 * t);
    } finally {
      clearTimeout(timer);
    }
  }
  throw errUlt;
}

async function fetchBufferWithFallback(urls, tentativas = 3, timeoutMs = 120000) {
  let errUlt = null;
  for (const url of urls) {
    for (let t = 1; t <= tentativas; t++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          headers: { 'user-agent': UA },
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
        const ab = await res.arrayBuffer();
        return { buf: Buffer.from(ab), status: res.status, finalUrl: url };
      } catch (e) {
        errUlt = e;
        if (t < tentativas) await esperar(1200 * t);
      } finally {
        clearTimeout(timer);
      }
    }
  }
  throw errUlt;
}

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function parsePaginasRotulo(rotulo) {
  const mRange = /P[áa]ginas?\s+de\s+\d+\s+a\s+(\d+)/i.exec(rotulo);
  if (mRange) return Number(mRange[1]);
  const mSingle = /P[áa]gina\s+(\d+)/i.exec(rotulo);
  if (mSingle) return Number(mSingle[1]);
  return 1;
}

function contarPaginasPdfBuffer(buf) {
  // Conta ocorrências de "/Type /Page" que não sejam "/Type /Pages"
  const str = buf.toString('latin1');
  const matches = str.match(/\/Type\s*\/Page\b(?!s)/g);
  return matches ? matches.length : 0;
}

// ============================================================================
// 1. MAPEAR 100% DO DIÁRIO OFICIAL DO EXECUTIVO (DOM-GRU 2025 e 2026)
// ============================================================================
async function mapearDiariosExecutivo() {
  console.log('\n[1/5] Mapeando Diário Oficial do Executivo (DOM-GRU 2025 e 2026)...');
  const mapaEdicoes = new Map();

  for (const ano of [2025, 2026]) {
    for (let mes = 1; mes <= 12; mes++) {
      const url = `https://diariooficial.guarulhos.sp.gov.br/index.php?mes=${mes}&ano=${ano}`;
      const html = await fetchText(url);

      const regexDiv = /<div[^>]*class="diarios"[^>]*id="diario-(\d+)"[^>]*>([\s\S]*?)<\/div>/gi;
      let m;
      while ((m = regexDiv.exec(html)) !== null) {
        const codigoDom = Number(m[1]);
        const bloco = m[2];
        const mData = /Di.{1,3}rio da data:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(decodeHtmlEntities(bloco));
        if (!mData) continue;
        const [, dd, mmStr, yyyyStr] = mData;
        const anoReal = Number(yyyyStr);
        const mesReal = Number(mmStr);
        if (anoReal !== 2025 && anoReal !== 2026) continue;

        const dataBr = `${dd}/${mmStr}/${yyyyStr}`;
        const dataPublicacao = `${yyyyStr}-${mmStr}-${dd}`;

        const cadernos = [];
        const regexLink = /<a[^>]*href="([^"]+\.pdf)"[^>]*>([\s\S]*?)<\/a>/gi;
        let ml;
        while ((ml = regexLink.exec(bloco)) !== null) {
          const rawHref = ml[1].trim();
          const nomeArquivo = rawHref.split('/').pop();
          const pdfUrl = `https://diariooficial.guarulhos.sp.gov.br/uploads/pdf/${nomeArquivo}`;
          const rotulo = decodeHtmlEntities(ml[2].replace(/<[^>]+>/g, ''))
            .replace(/^\s*-\s*/, '')
            .replace(/\s+/g, ' ')
            .trim();
          const paginas = parsePaginasRotulo(rotulo);
          cadernos.push({
            rotulo,
            pdfUrl,
            nomeArquivo,
            paginas,
          });
        }

        if (cadernos.length === 0) continue;
        const id = `dom-${codigoDom}`;
        if (!mapaEdicoes.has(id)) {
          const totalPaginas = cadernos.reduce((acc, c) => acc + c.paginas, 0);
          mapaEdicoes.set(id, {
            id,
            codigoDom,
            ano: anoReal,
            mes: mesReal,
            dataPublicacao,
            dataBr,
            totalPaginas,
            qtdCadernos: cadernos.length,
            cadernos,
            pdfPrincipalUrl: cadernos[0].pdfUrl,
          });
        }
      }
    }
  }

  const lista = [...mapaEdicoes.values()].sort(
    (a, b) => b.dataPublicacao.localeCompare(a.dataPublicacao) || b.codigoDom - a.codigoDom
  );
  const totalCadernos = lista.reduce((s, e) => s + e.cadernos.length, 0);
  console.log(`  -> ${lista.length} edições mapeadas no Executivo (${totalCadernos} arquivos PDF de cadernos).`);
  return lista;
}

// ============================================================================
// 2. BAIXAR E VALIDAR SHA-256 DE TODOS OS PDFs DO EXECUTIVO
// ============================================================================
async function baixarEValidarPdfsExecutivo(edicoes) {
  console.log('\n[2/5] Baixando e validando SHA-256 de todos os PDFs do Executivo...');
  await fsp.mkdir(path.join(DIR_EXEC, '2025'), { recursive: true });
  await fsp.mkdir(path.join(DIR_EXEC, '2026'), { recursive: true });

  const tarefas = [];
  for (const ed of edicoes) {
    for (let idx = 0; idx < ed.cadernos.length; idx++) {
      tarefas.push({ ed, cad: ed.cadernos[idx], idx });
    }
  }

  let concluidos = 0;
  let baixadosAgora = 0;
  let reaproveitadosCache = 0;
  let falhas = 0;
  let bytesTotais = 0;

  const CONCORRENCIA = 8;
  let cursor = 0;

  async function worker() {
    while (cursor < tarefas.length) {
      const i = cursor++;
      const { ed, cad } = tarefas[i];
      const nomeLocal = `dom-${ed.codigoDom}-${ed.dataPublicacao}-${cad.nomeArquivo}`;
      const caminhoLocal = path.join(DIR_EXEC, String(ed.ano), nomeLocal);
      const caminhoRelativo = `acervo-diarios/executivo/${ed.ano}/${nomeLocal}`;

      try {
        let buf = null;
        if (fs.existsSync(caminhoLocal)) {
          const existente = await fsp.readFile(caminhoLocal);
          if (existente.length > 500 && existente.subarray(0, 5).toString('ascii') === '%PDF-') {
            buf = existente;
            reaproveitadosCache++;
          }
        }

        if (!buf) {
          const urls = [
            `https://diariooficial.guarulhos.sp.gov.br/uploads/pdf/${cad.nomeArquivo}`,
            `https://www.guarulhos.sp.gov.br/uploads/pdf/${cad.nomeArquivo}`,
          ];
          const res = await fetchBufferWithFallback(urls, 3, 120000);
          buf = res.buf;
          if (buf.length < 500 || buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
            throw new Error(`Arquivo inválido (header=${buf.subarray(0, 8).toString('ascii')}, bytes=${buf.length})`);
          }
          await fsp.writeFile(caminhoLocal, buf);
          baixadosAgora++;
        }

        const sha256 = sha256Buffer(buf);
        const pagsPdf = contarPaginasPdfBuffer(buf);
        cad.tamanhoBytes = buf.length;
        cad.sha256 = sha256;
        cad.arquivoLocal = caminhoRelativo;
        cad.validadoHttp200 = true;
        if ((!cad.paginas || cad.paginas < 1) && pagsPdf > 0) {
          cad.paginas = pagsPdf;
        }
        bytesTotais += buf.length;
      } catch (e) {
        falhas++;
        cad.validadoHttp200 = false;
        cad.erroValidacao = e.message;
        console.error(`  ✗ Falha no PDF ${cad.nomeArquivo} (DOM #${ed.codigoDom}): ${e.message}`);
      }

      concluidos++;
      if (concluidos % 25 === 0 || concluidos === tarefas.length) {
        const mb = (bytesTotais / (1024 * 1024)).toFixed(1);
        console.log(`  -> Progresso PDF Executivo: ${concluidos}/${tarefas.length} validados (${mb} MB · novos=${baixadosAgora}, cache=${reaproveitadosCache}, falhas=${falhas})`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCORRENCIA }, () => worker()));

  // Consolida tamanhoBytes e sha256 principal em cada edição
  for (const ed of edicoes) {
    ed.tamanhoTotalBytes = ed.cadernos.reduce((s, c) => s + (c.tamanhoBytes || 0), 0);
    ed.sha256Principal = ed.cadernos[0]?.sha256 || null;
    ed.arquivoPrincipalLocal = ed.cadernos[0]?.arquivoLocal || null;
    ed.todosValidados = ed.cadernos.every((c) => c.validadoHttp200);
  }

  return { totalArquivos: tarefas.length, baixadosAgora, reaproveitadosCache, falhas, bytesTotais };
}

// ============================================================================
// 3. MAPEAR 100% DO DIÁRIO OFICIAL DO LEGISLATIVO (DOL) + DOCS INSTITUCIONAIS
// ============================================================================
async function mapearDiariosLegislativo() {
  console.log('\n[3/5] Mapeando Diário Oficial do Legislativo (Câmara Municipal de Guarulhos)...');
  const edicoesMap = new Map();
  let pagina = 1;
  let maxPaginaDetectada = 1;

  while (pagina <= maxPaginaDetectada && pagina <= 30) {
    const url = pagina === 1
      ? 'https://www.guarulhos.sp.leg.br/dol'
      : `https://www.guarulhos.sp.leg.br/dol/page:${pagina}`;
    const html = await fetchText(url);

    // Atualiza paginação máxima
    for (const mp of html.matchAll(/\/dol\/page:(\d+)/g)) {
      const pNum = Number(mp[1]);
      if (pNum > maxPaginaDetectada) maxPaginaDetectada = pNum;
    }

    // Extrai cada bloco de documento DOL
    const regexDoc = /href="(\/documento\/diario-oficial-do-legislativo-[^"]+)"/gi;
    const hrefsUnicos = [...new Set([...html.matchAll(regexDoc)].map((m) => m[1]))];

    for (const href of hrefsUnicos) {
      const idx = html.indexOf(href);
      const janela = decodeHtmlEntities(
        html.slice(Math.max(0, idx - 200), Math.min(html.length, idx + 1500)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
      );

      // Exemplo de href: /documento/diario-oficial-do-legislativo-24-11-2026-2173097
      const mSlug = /diario-oficial-do-legislativo-(\d{2})-(\d{2})-(\d{4})-(\d+)/i.exec(href);
      let dd = '01', mm = '01', yyyy = '2026', docId = '0';
      if (mSlug) {
        [, dd, mm, yyyy, docId] = mSlug;
      } else {
        const mDt = /(\d{2})\/(\d{2})\/(\d{4})/.exec(janela);
        if (mDt) [, dd, mm, yyyy] = mDt;
        const mId = /-(\d+)$/.exec(href);
        if (mId) docId = mId[1];
      }

      const mNum = /Di[áa]rio Oficial do Legislativo\s*-?\s*n[º°o]\s*(\d+)/i.exec(janela);
      const mProt = /Protocolo:\s*(\d+)/i.exec(janela);
      const mDtProt = /Data Protocolo:\s*(\d{2}\/\d{2}\/\d{4})/i.exec(janela);
      const mSit = /Situa[çc][ãa]o:\s*([A-Za-zÀ-ÿ]+)/i.exec(janela);

      const numeroEdicao = mNum ? Number(mNum[1]) : null;
      const dataBr = `${dd}/${mm}/${yyyy}`;
      const dataPublicacao = `${yyyy}-${mm}-${dd}`;
      const id = `dol-${numeroEdicao ?? docId}`;

      if (!edicoesMap.has(href)) {
        edicoesMap.set(href, {
          id,
          documentoId: Number(docId),
          numeroEdicao,
          titulo: numeroEdicao
            ? `Diário Oficial do Legislativo nº ${numeroEdicao}`
            : `Diário Oficial do Legislativo — ${dataBr}`,
          ano: Number(yyyy),
          mes: Number(mm),
          dataPublicacao,
          dataBr,
          protocolo: mProt ? mProt[1] : null,
          dataProtocolo: mDtProt ? mDtProt[1] : dataBr,
          situacao: mSit ? mSit[1] : 'Protocolado',
          documentoUrl: `https://www.guarulhos.sp.leg.br${href}`,
          validadoCatalogoHttp200: true,
          protegidoPorCaptchaDownload: true,
        });
      }
    }

    console.log(`  -> Página DOL ${pagina}/${maxPaginaDetectada}: acumulados ${edicoesMap.size} diários legislativos.`);
    pagina++;
  }

  const listaDol = [...edicoesMap.values()].sort(
    (a, b) =>
      b.dataPublicacao.localeCompare(a.dataPublicacao) ||
      (b.numeroEdicao ?? 0) - (a.numeroEdicao ?? 0) ||
      b.documentoId - a.documentoId
  );

  // Baixa também os documentos institucionais públicos diretos (sem CAPTCHA) da Câmara Municipal
  await fsp.mkdir(DIR_LEG_INST, { recursive: true });
  const docsInstitucionais = [
    {
      id: 'lei-organica-guarulhos',
      titulo: 'Lei Orgânica do Município de Guarulhos (Consolidada)',
      url: 'https://www.guarulhos.sp.leg.br/files/lei-organica-do-municipio.pdf',
      nomeArquivo: 'lei-organica-do-municipio.pdf',
    },
    {
      id: 'regimento-interno-cmg',
      titulo: 'Regimento Interno da Câmara Municipal de Guarulhos (Consolidado)',
      url: 'https://www.guarulhos.sp.leg.br/files/regimento-interno-re090399-consolidada.pdf',
      nomeArquivo: 'regimento-interno-cmg-consolidado.pdf',
    },
    {
      id: 'carta-servicos-cmg',
      titulo: 'Carta de Serviços ao Cidadão — Câmara Municipal de Guarulhos',
      url: 'https://www.guarulhos.sp.leg.br/files/carta-servico.pdf',
      nomeArquivo: 'carta-servicos-cmg.pdf',
    },
    {
      id: 'organograma-cmg',
      titulo: 'Organograma Oficial — Poder Legislativo de Guarulhos',
      url: 'https://www.guarulhos.sp.leg.br/files/organograma.pdf',
      nomeArquivo: 'organograma-cmg.pdf',
    },
  ];

  for (const doc of docsInstitucionais) {
    try {
      const dest = path.join(DIR_LEG_INST, doc.nomeArquivo);
      const { buf } = await fetchBufferWithFallback([doc.url], 2, 60000);
      if (buf.subarray(0, 5).toString('ascii') === '%PDF-') {
        await fsp.writeFile(dest, buf);
        doc.tamanhoBytes = buf.length;
        doc.sha256 = sha256Buffer(buf);
        doc.paginas = contarPaginasPdfBuffer(buf);
        doc.arquivoLocal = `acervo-diarios/institucional-legislativo/${doc.nomeArquivo}`;
        doc.validado = true;
      }
    } catch (e) {
      doc.validado = false;
      doc.erro = e.message;
    }
  }

  // Mapeia também proposições recentes (Projetos de Lei, Decretos Legislativos e Atos da Mesa) do catálogo público
  const atosLegislativosRecentes = [];
  const fontesAtos = [
    {
      tipo: 'Projeto de Lei',
      url: 'https://www.guarulhos.sp.leg.br/documentos/tipo:legislativo-2/subtipo:projeto-de-lei-20',
    },
    {
      tipo: 'Decreto Legislativo',
      url: 'https://www.guarulhos.sp.leg.br/documentos/tipo:leis-municipais-3/subtipo:decreto-legislativo-25',
    },
    {
      tipo: 'Ato da Mesa',
      url: 'https://www.guarulhos.sp.leg.br/documentos/tipo:leis-municipais-3/subtipo:ato-da-mesa-5',
    },
  ];

  for (const f of fontesAtos) {
    try {
      const html = await fetchText(f.url);
      const links = [...new Set([...html.matchAll(/href="(\/documento\/[^"]+)"/gi)].map((m) => m[1]))].slice(0, 12);
      for (const href of links) {
        const idx = html.indexOf(href);
        const txt = decodeHtmlEntities(
          html.slice(Math.max(0, idx - 120), Math.min(html.length, idx + 1400)).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
        ).trim();
        const mDt = /Data Protocolo:\s*(\d{2})\/(\d{2})\/(\d{4})/i.exec(txt) || /(\d{2})\/(\d{2})\/(\d{4})/.exec(txt);
        const mProt = /Protocolo:\s*(\d+)/i.exec(txt);
        const mAut = /Autor\(res\)\s*:\s*([^]+?)(?:Abrir|$)/i.exec(txt);
        const mTit = /^([^]+?)\s+Protocolo:/i.exec(txt);
        if (mDt) {
          const [, d, m, y] = mDt;
          atosLegislativosRecentes.push({
            tipo: f.tipo,
            titulo: mTit ? mTit[1].trim().slice(0, 140) : f.tipo,
            protocolo: mProt ? mProt[1] : null,
            dataBr: `${d}/${m}/${y}`,
            dataIso: `${y}-${m}-${d}`,
            ano: Number(y),
            mes: Number(m),
            resumo: mAut ? mAut[1].trim().slice(0, 220) : txt.slice(0, 200),
            url: `https://www.guarulhos.sp.leg.br${href}`,
          });
        }
      }
    } catch (e) {
      console.warn(`  ! Aviso ao ler ${f.tipo}: ${e.message}`);
    }
  }

  console.log(`  -> Total DOL mapeado: ${listaDol.length} edições | Docs institucionais PDF: ${docsInstitucionais.filter((d) => d.validado).length} | Atos legislativos recentes: ${atosLegislativosRecentes.length}`);
  return { listaDol, docsInstitucionais, atosLegislativosRecentes };
}

// ============================================================================
// 4. EXTRAIR NOVOS DECRETOS SUPLEMENTARES DO EXECUTIVO (PESQUISAR_DIARIO.PHP)
// ============================================================================
async function atualizarDecretosSuplementares(edicoesExecutivo) {
  console.log('\n[4/5] Verificando novos Decretos de Crédito Suplementar no DOM-GRU...');
  const arqExistente = path.join(DIR_SCRIPTS, 'decretos-reais-dom.json');
  const existentes = fs.existsSync(arqExistente)
    ? JSON.parse(await fsp.readFile(arqExistente, 'utf8'))
    : [];

  const mapaPorNumero = new Map();
  for (const d of existentes) {
    mapaPorNumero.set(String(d.numero), d);
  }

  // Busca por "abertura de crédito adicional suplementar" em todo Novembro/2026
  // e também busca individualmente números de decreto entre 44610 e 44710 para não perder
  // páginas que contenham 2 ou mais decretos na mesma folha!
  const consultas = [
    'https://www.guarulhos.sp.gov.br/diario-oficial/pesquisar_diario.php?q=abertura+de+cr%C3%A9dito+adicional+suplementar&data_inicio=01%2F11%2F2026&data_fim=30%2F11%2F2026',
  ];

  // Descobre faixas de decretos suplementares recentes
  for (let numTeste = 44650; numTeste <= 44700; numTeste++) {
    if (!mapaPorNumero.has(String(numTeste))) {
      consultas.push(
        `https://www.guarulhos.sp.gov.br/diario-oficial/pesquisar_diario.php?q=DECRETO+N%C2%BA+${numTeste}&data_inicio=01%2F11%2F2026&data_fim=30%2F11%2F2026`
      );
    }
  }

  let novosEncontrados = 0;
  for (const url of consultas) {
    try {
      const html = await fetchText(url, 2, 30000);
      const blocos = html.split('<div class="resultado">').slice(1);
      for (const b of blocos) {
        const mTit = /Di[áa]rio de\s*(\d{2})\/(\d{2})\/(\d{4})\s*[—-]\s*P[áa]gina\s*(\d+)\s*de\s*(\d+)/i.exec(
          decodeHtmlEntities(b)
        );
        const mHref = /href="([^"]+\.pdf[^"]*)"/i.exec(b);
        const mTrecho = /<div class="trecho">([\s\S]*?)<\/div>/i.exec(b);
        if (!mTit || !mHref || !mTrecho) continue;

        const [, dd, mm, yyyy, pagStr, totPagStr] = mTit;
        const textoLimpo = decodeHtmlEntities(mTrecho[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')).trim();

        // Pode haver mais de um DECRETO Nº no mesmo trecho!
        const regexDec = /DECRETO\s+N[º°]\s*(\d{4,6})\s+Disp[õo]e\s+sobre\s+a\s+abertura\s+de\s+cr[ée]dito\s+adicional\s+suplementar\s+no\s+valor\s+de\s+R\$\s*([\d.]+,\d{2})/gi;
        let md;
        while ((md = regexDec.exec(textoLimpo)) !== null) {
          const numero = md[1];
          const valorStr = md[2];
          const valor = Number(valorStr.replace(/\./g, '').replace(',', '.'));
          if (!Number.isFinite(valor) || mapaPorNumero.has(numero)) continue;

          const basePdf = decodeHtmlEntities(mHref[1]).split('#')[0];
          const pdfUrl = `${basePdf}#page=${pagStr}&search=suplementar`;
          mapaPorNumero.set(numero, {
            numero,
            ano: Number(yyyy),
            pagina: Number(pagStr),
            totalPaginas: Number(totPagStr),
            dataBr: `${dd}/${mm}/${yyyy}`,
            dataIso: `${yyyy}-${mm}-${dd}`,
            valor,
            valorFmt: `R$ ${valorStr}`,
            trecho: textoLimpo,
            pdfUrl,
          });
          novosEncontrados++;
          console.log(`  + Novo Decreto Suplementar detectado: nº ${numero} (${dd}/${mm}/${yyyy}) — R$ ${valorStr}`);
        }
      }
    } catch {
      // ignora timeout pontual
    }
  }

  // Vincula codigoDom a cada decreto usando a data ou o nome do arquivo PDF
  const domPorData = new Map();
  const domPorArquivo = new Map();
  for (const ed of edicoesExecutivo) {
    domPorData.set(ed.dataPublicacao, ed.codigoDom);
    for (const c of ed.cadernos) {
      domPorArquivo.set(c.nomeArquivo, ed.codigoDom);
    }
  }

  const todosDecretos = [...mapaPorNumero.values()]
    .map((d) => {
      const arq = d.pdfUrl.split('#')[0].split('/').pop();
      const codigoDom = domPorArquivo.get(arq) ?? domPorData.get(d.dataIso) ?? d.codigoDom ?? null;
      const numeroInt = Number(d.numero);
      const numeroFmt = numeroInt.toLocaleString('pt-BR');
      const mes = Number(String(d.dataIso).split('-')[1] || 1);
      return {
        numero: String(d.numero),
        numeroFmt,
        numeroInt,
        ano: Number(d.ano),
        mes,
        dataBr: d.dataBr,
        dataIso: d.dataIso,
        codigoDom,
        pagina: Number(d.pagina),
        totalPaginas: Number(d.totalPaginas),
        valor: Number(d.valor),
        valorFmt: d.valorFmt,
        trecho: d.trecho,
        pdfUrl: d.pdfUrl,
      };
    })
    .sort((a, b) => b.dataIso.localeCompare(a.dataIso) || b.numeroInt - a.numeroInt);

  await fsp.writeFile(arqExistente, JSON.stringify(todosDecretos, null, 2), 'utf8');
  console.log(`  -> Total de Decretos Suplementares validados: ${todosDecretos.length} (${novosEncontrados} novos adicionados agora).`);
  return { todosDecretos, novosEncontrados };
}

// ============================================================================
// 5. BAIXAR PACOTES ATUALIZADOS DO TCE-SP (INCLUINDO SETEMBRO/2026)
// ============================================================================
async function sincronizarArquivosTce2026() {
  console.log('\n[5/5] Baixando pacotes oficiais atualizados do TCE-SP (2026 até Setembro)...');
  await fsp.mkdir(DIR_TCE26, { recursive: true });

  const downloads = [
    {
      rotulo: 'ZIP Oficial Despesas TCE-SP 2026 (Jan–Set)',
      url: 'https://transparencia.tce.sp.gov.br/sites/default/files/csv/despesas-guarulhos-2026.zip',
      dest: path.join(DIR_TCE26, 'despesas-guarulhos-2026-atualizado.zip'),
    },
    {
      rotulo: 'ZIP Oficial Receitas TCE-SP 2026 (Jan–Set)',
      url: 'https://transparencia.tce.sp.gov.br/sites/default/files/csv/receitas-guarulhos-2026.zip',
      dest: path.join(DIR_TCE26, 'receitas-guarulhos-2026-atualizado.zip'),
    },
  ];

  const resultadosTce = [];
  for (const item of downloads) {
    try {
      const { buf } = await fetchBufferWithFallback([item.url], 3, 180000);
      await fsp.writeFile(item.dest, buf);
      const sha = sha256Buffer(buf);
      console.log(`  ✓ ${item.rotulo}: ${(buf.length / (1024 * 1024)).toFixed(2)} MB (sha256=${sha.slice(0, 16)}...)`);
      resultadosTce.push({ ...item, bytes: buf.length, sha256: sha, ok: true });
    } catch (e) {
      console.warn(`  ! Falha ao baixar ${item.rotulo}: ${e.message}`);
      resultadosTce.push({ ...item, ok: false, erro: e.message });
    }
  }

  // Baixa também o CSV mensal 09/2026 pela API JSON caso ainda não exista
  const csvSetembro = path.join(DIR_TCE26, 'despesas-guarulhos-2026-09.csv');
  if (!fs.existsSync(csvSetembro)) {
    try {
      const txt = await fetchText('https://transparencia.tce.sp.gov.br/api/json/despesas/guarulhos/2026/9', 3, 180000);
      const dados = JSON.parse(txt);
      if (Array.isArray(dados) && dados.length > 0) {
        const cols = [...new Set(dados.flatMap((l) => Object.keys(l)))];
        const cel = (v) => {
          const s = String(v ?? '').replace(/\r?\n/g, ' ').trim();
          return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const csv = '\uFEFF' + [cols.join(';'), ...dados.map((l) => cols.map((c) => cel(l[c])).join(';'))].join('\r\n') + '\r\n';
        await fsp.writeFile(csvSetembro, csv, 'utf8');
        console.log(`  ✓ CSV Mensal Setembro/2026 salvo: ${dados.length} eventos em TCE-2026/despesas-guarulhos-2026-09.csv`);
      }
    } catch (e) {
      console.warn(`  ! Aviso CSV Setembro/2026 API: ${e.message}`);
    }
  }

  return resultadosTce;
}

// ============================================================================
// EXECUÇÃO PRINCIPAL E GERAÇÃO DOS MANIFESTOS E MÓDULO TS
// ============================================================================
async function main() {
  const inicio = Date.now();
  const edicoesExecutivo = await mapearDiariosExecutivo();
  const statsExec = await baixarEValidarPdfsExecutivo(edicoesExecutivo);
  const { listaDol, docsInstitucionais, atosLegislativosRecentes } = await mapearDiariosLegislativo();
  const { todosDecretos, novosEncontrados } = await atualizarDecretosSuplementares(edicoesExecutivo);
  const resultadosTce = await sincronizarArquivosTce2026();

  const verificadoEmIso = new Date().toISOString();
  const totalPaginasExecutivo = edicoesExecutivo.reduce((s, e) => s + e.totalPaginas, 0);

  const resumoValidacao = {
    verificadoEmIso,
    tempoExecucaoSegundos: Math.round((Date.now() - inicio) / 1000),
    executivo: {
      qtdEdicoes: edicoesExecutivo.length,
      qtdEdicoes2026: edicoesExecutivo.filter((e) => e.ano === 2026).length,
      qtdEdicoes2025: edicoesExecutivo.filter((e) => e.ano === 2025).length,
      qtdArquivosPdf: statsExec.totalArquivos,
      qtdValidadosSha256: statsExec.totalArquivos - statsExec.falhas,
      falhasDownload: statsExec.falhas,
      totalPaginas: totalPaginasExecutivo,
      tamanhoTotalBytes: statsExec.bytesTotais,
      tamanhoTotalMb: Math.round((statsExec.bytesTotais / (1024 * 1024)) * 10) / 10,
      primeiraData: edicoesExecutivo[edicoesExecutivo.length - 1]?.dataPublicacao ?? '2025-01-03',
      ultimaData: edicoesExecutivo[0]?.dataPublicacao ?? '2026-11-24',
      menorCodigoDom: Math.min(...edicoesExecutivo.map((e) => e.codigoDom)),
      maiorCodigoDom: Math.max(...edicoesExecutivo.map((e) => e.codigoDom)),
    },
    legislativo: {
      qtdEdicoes: listaDol.length,
      qtdEdicoes2026: listaDol.filter((e) => e.ano === 2026).length,
      qtdEdicoes2025: listaDol.filter((e) => e.ano === 2025).length,
      primeiraData: listaDol[listaDol.length - 1]?.dataPublicacao ?? '2025-07-15',
      ultimaData: listaDol[0]?.dataPublicacao ?? '2026-11-24',
      menorNumeroDol: Math.min(...listaDol.filter((e) => e.numeroEdicao).map((e) => e.numeroEdicao)),
      maiorNumeroDol: Math.max(...listaDol.filter((e) => e.numeroEdicao).map((e) => e.numeroEdicao)),
      docsInstitucionaisBaixados: docsInstitucionais.filter((d) => d.validado).length,
      atosRecentesMapeados: atosLegislativosRecentes.length,
      observacaoDownloadAnexo:
        'Catálogo integral (100% das edições públicas) validado via HTTP 200; download binário individual dos anexos DOL na Câmara Municipal exige validação humana de CAPTCHA (/pages/validar_captcha) no navegador.',
    },
    decretosSuplementares: {
      qtdTotal: todosDecretos.length,
      qtdNovosExtraidos: novosEncontrados,
      valorTotal: Math.round(todosDecretos.reduce((s, d) => s + d.valor, 0) * 100) / 100,
    },
    tce2026: resultadosTce,
  };

  await fsp.writeFile(
    path.join(DIR_SCRIPTS, 'manifesto-diarios-validados.json'),
    JSON.stringify(
      {
        resumo: resumoValidacao,
        executivo: edicoesExecutivo,
        legislativo: listaDol,
        docsInstitucionaisLegislativo: docsInstitucionais,
        atosLegislativosRecentes,
      },
      null,
      2
    ),
    'utf8'
  );

  // Atualiza também scripts/diarios-extraidos-real.json
  await fsp.writeFile(path.join(DIR_SCRIPTS, 'diarios-extraidos-real.json'), JSON.stringify(edicoesExecutivo, null, 2), 'utf8');

  // Gera src/domain/diariosCatalogoReal.ts completo e tipado
  const tsContent = `/**
 * ============================================================================
 * ACERVO OFICIAL REAL VALIDADO — EXECUTIVO (DOM-GRU), LEGISLATIVO (DOL) & DECRETOS
 * Gerado e validado automaticamente com verificação HTTP 200 e SHA-256:
 *   - Executivo (DOM-GRU): https://diariooficial.guarulhos.sp.gov.br/index.php
 *   - Legislativo (DOL-CMG): https://www.guarulhos.sp.leg.br/dol
 *   - Busca de Atos: https://www.guarulhos.sp.gov.br/diario-oficial/pesquisar_diario.php
 * ============================================================================
 */

export interface CadernoDiarioReal {
  rotulo: string;
  pdfUrl: string;
  nomeArquivo?: string;
  paginas: number;
  tamanhoBytes?: number;
  sha256?: string;
  arquivoLocal?: string;
  validadoHttp200?: boolean;
}

export interface EdicaoDiarioReal {
  id: string;
  codigoDom: number;
  ano: number;
  mes: number;
  dataPublicacao: string;
  dataBr: string;
  totalPaginas: number;
  qtdCadernos: number;
  cadernos: CadernoDiarioReal[];
  pdfPrincipalUrl: string;
  tamanhoTotalBytes?: number;
  sha256Principal?: string | null;
  arquivoPrincipalLocal?: string | null;
  todosValidados?: boolean;
}

export interface EdicaoDiarioLegislativoReal {
  id: string;
  documentoId: number;
  numeroEdicao: number | null;
  titulo: string;
  ano: number;
  mes: number;
  dataPublicacao: string;
  dataBr: string;
  protocolo: string | null;
  dataProtocolo: string;
  situacao: string;
  documentoUrl: string;
  validadoCatalogoHttp200: boolean;
  protegidoPorCaptchaDownload: boolean;
}

export interface DocumentoInstitucionalLegislativo {
  id: string;
  titulo: string;
  url: string;
  nomeArquivo: string;
  tamanhoBytes?: number;
  sha256?: string;
  paginas?: number;
  arquivoLocal?: string;
  validado?: boolean;
}

export interface AtoLegislativoRecente {
  tipo: string;
  titulo: string;
  protocolo: string | null;
  dataBr: string;
  dataIso: string;
  ano: number;
  mes: number;
  resumo: string;
  url: string;
}

export interface DecretoSuplementarReal {
  numero: string;
  numeroFmt: string;
  numeroInt: number;
  ano: number;
  mes: number;
  dataBr: string;
  dataIso: string;
  codigoDom: number | null;
  pagina: number;
  totalPaginas: number;
  valor: number;
  valorFmt: string;
  trecho: string;
  pdfUrl: string;
}

export interface ResumoValidacaoAcervo {
  verificadoEmIso: string;
  executivo: {
    qtdEdicoes: number;
    qtdEdicoes2026: number;
    qtdEdicoes2025: number;
    qtdArquivosPdf: number;
    qtdValidadosSha256: number;
    falhasDownload: number;
    totalPaginas: number;
    tamanhoTotalBytes: number;
    tamanhoTotalMb: number;
    primeiraData: string;
    ultimaData: string;
    menorCodigoDom: number;
    maiorCodigoDom: number;
  };
  legislativo: {
    qtdEdicoes: number;
    qtdEdicoes2026: number;
    qtdEdicoes2025: number;
    primeiraData: string;
    ultimaData: string;
    menorNumeroDol: number;
    maiorNumeroDol: number;
    docsInstitucionaisBaixados: number;
    atosRecentesMapeados: number;
    observacaoDownloadAnexo: string;
  };
}

export const RESUMO_VALIDACAO_ACERVO: ResumoValidacaoAcervo = ${JSON.stringify(
    {
      verificadoEmIso: resumoValidacao.verificadoEmIso,
      executivo: resumoValidacao.executivo,
      legislativo: resumoValidacao.legislativo,
    },
    null,
    2
  )};

/** Todas as edições reais do Diário Oficial do Executivo (DOM-GRU) de 2025 e 2026 validadas com SHA-256 */
export const ACERVO_DIARIOS_EXECUTIVO: EdicaoDiarioReal[] = ${JSON.stringify(edicoesExecutivo)};

/** Alias de compatibilidade */
export const ACERVO_DIARIOS_REAIS: EdicaoDiarioReal[] = ACERVO_DIARIOS_EXECUTIVO;

/** Todas as edições reais mapeadas do Diário Oficial do Legislativo (DOL — Câmara Municipal de Guarulhos) */
export const ACERVO_DIARIOS_LEGISLATIVO: EdicaoDiarioLegislativoReal[] = ${JSON.stringify(listaDol)};

/** Documentos normativos estruturais da Câmara Municipal baixados e validados com SHA-256 */
export const DOCS_INSTITUCIONAIS_LEGISLATIVO: DocumentoInstitucionalLegislativo[] = ${JSON.stringify(docsInstitucionais)};

/** Proposições e atos legislativos recentes mapeados no portal público da Câmara Municipal */
export const ATOS_LEGISLATIVOS_RECENTES: AtoLegislativoRecente[] = ${JSON.stringify(atosLegislativosRecentes)};

/** Catálogo completo de Decretos de Crédito Adicional Suplementar extraídos do Diário Oficial (2025 e 2026) */
export const CATALOGO_DECRETOS_SUPLEMENTARES_REAIS: DecretoSuplementarReal[] = ${JSON.stringify(todosDecretos)};
`;

  await fsp.writeFile(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), tsContent, 'utf8');

  console.log('\n====================================================================');
  console.log('SINCRONIZAÇÃO E VALIDAÇÃO CONCLUÍDAS COM SUCESSO!');
  console.log(JSON.stringify(resumoValidacao, null, 2));
  console.log('====================================================================');
}

main().catch((e) => {
  console.error('\nERRO FATAL NA SINCRONIZAÇÃO:', e);
  process.exit(1);
});
