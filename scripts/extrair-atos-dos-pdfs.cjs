/**
 * ============================================================================
 * EXTRATOR DIRETO DOS 222 PDFs LOCAIS DO EXECUTIVO (DOM-GRU 2025 E 2026)
 * ============================================================================
 * Varre diretamente os fluxos comprimidos (FlateDecode) dos 222 PDFs oficiais
 * baixados em acervo-diarios/executivo/{2025,2026}/ para garantir que NENHUM
 * decreto de crédito adicional suplementar (mesmo quando há 3 ou 4 decretos
 * na mesma página do PDF!) nem leis municipais sancionadas fiquem de fora.
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = process.cwd();
const MANIFESTO_PATH = path.join(ROOT, 'scripts', 'manifesto-diarios-validados.json');
const DECRETOS_JSON_PATH = path.join(ROOT, 'scripts', 'decretos-reais-dom.json');

/** Decodifica escapes octais e parênteses de strings literais PDF (...) */
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

/** Extrai o texto das páginas iniciais (Atos Oficiais: Leis e Decretos ficam sempre no início do caderno Legal) */
function extrairTextoAtosPdf(caminhoAbsoluto, maxStreams = 60) {
  const buf = fs.readFileSync(caminhoAbsoluto);
  const latin = buf.toString('latin1');
  const paginasTexto = [];
  let pos = 0;
  let streamsLidos = 0;

  while (streamsLidos < maxStreams) {
    const sIdx = latin.indexOf('stream', pos);
    if (sIdx < 0) break;
    // Garante que não é 'endstream'
    if (sIdx >= 3 && latin.slice(sIdx - 3, sIdx) === 'end') {
      pos = sIdx + 6;
      continue;
    }
    const eIdx = latin.indexOf('endstream', sIdx + 6);
    if (eIdx < 0) break;

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
        if (raw.includes('(')) {
          const partes = [];
          const re = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
          let m;
          while ((m = re.exec(raw)) !== null) {
            partes.push(decodePdfLiteral(m[1]));
          }
          const txt = partes
            .join(' ')
            .replace(/[^\x20-\x7E\xA0-\xFF]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (txt.length > 40) {
            paginasTexto.push(txt);
            streamsLidos++;
          }
        }
      } catch {
        // stream de imagem/fonte não-Flate padrão: ignora
      }
    }
    pos = eIdx + 9;
  }

  return paginasTexto;
}

function formatarMoedaBr(valor) {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function main() {
  const manifesto = JSON.parse(fs.readFileSync(MANIFESTO_PATH, 'utf8'));
  const decretosAtuais = JSON.parse(fs.readFileSync(DECRETOS_JSON_PATH, 'utf8'));

  const mapaDecretos = new Map();
  for (const d of decretosAtuais) {
    mapaDecretos.set(String(d.numero).replace(/\D/g, ''), d);
  }

  const leisMunicipais = new Map();
  let pdfsVarridos = 0;
  let novosDecretosPdf = 0;
  const detalhesGrandesNovembro = [];

  for (const ed of manifesto.executivo) {
    for (const cad of ed.cadernos) {
      if (!cad.arquivoLocal) continue;
      const abs = path.join(ROOT, cad.arquivoLocal);
      if (!fs.existsSync(abs)) continue;

      // Leis e decretos saem no caderno Legal / 1º caderno
      const streams = extrairTextoAtosPdf(abs, 55);
      pdfsVarridos++;
      if (streams.length === 0) continue;

      const textoCompleto = streams.join(' \n ');

      // 1. Extrai TODOS os Decretos de Crédito Adicional Suplementar (tratando kerning de PDF como "N º" ou "N ")
      const reDec = /DECRETO\s+N[\sº°o.]*([\d.]{4,7})\s+Disp.{1,3}e\s+sobre\s+a\s+abertura\s+de\s+cr.{1,3}dito\s+adicional\s+suplementar[\s\S]{0,120}?R\$\s*([\d.]+,\d{2})/gi;
      let md;
      while ((md = reDec.exec(textoCompleto)) !== null) {
        const numLimpo = md[1].replace(/\D/g, '');
        const valorStr = md[2];
        const valor = Number(valorStr.replace(/\./g, '').replace(',', '.'));
        if (!numLimpo || !Number.isFinite(valor) || valor <= 0) continue;

        // Tenta descobrir a página aproximada pelo cabeçalho "Página X" anterior ao match
        const antes = textoCompleto.slice(Math.max(0, md.index - 1800), md.index + 400);
        const mPag = /P[áa]gina\s+(\d+)/gi;
        let pagDetectada = 1;
        let mp;
        while ((mp = mPag.exec(antes)) !== null) {
          pagDetectada = Number(mp[1]);
        }

        const trecho = textoCompleto
          .slice(Math.max(0, md.index - 60), Math.min(textoCompleto.length, md.index + 320))
          .replace(/\s+/g, ' ')
          .trim();

        if (!mapaDecretos.has(numLimpo)) {
          const numeroInt = Number(numLimpo);
          const baseUrl = `https://www.guarulhos.sp.gov.br/uploads/pdf/${cad.nomeArquivo}`;
          mapaDecretos.set(numLimpo, {
            numero: numLimpo,
            numeroFmt: numeroInt.toLocaleString('pt-BR'),
            numeroInt,
            ano: ed.ano,
            mes: ed.mes,
            dataBr: ed.dataBr,
            dataIso: ed.dataPublicacao,
            codigoDom: ed.codigoDom,
            pagina: Math.min(Math.max(1, pagDetectada), cad.paginas || ed.totalPaginas || 1),
            totalPaginas: cad.paginas || ed.totalPaginas || 1,
            valor,
            valorFmt: formatarMoedaBr(valor),
            trecho,
            pdfUrl: `${baseUrl}#page=${Math.max(1, pagDetectada)}&search=suplementar`,
          });
          novosDecretosPdf++;
        } else {
          // Garante codigoDom preenchido
          const ex = mapaDecretos.get(numLimpo);
          if (!ex.codigoDom) ex.codigoDom = ed.codigoDom;
        }

        if (ed.ano === 2026 && ed.mes === 11 && valor >= 5_000_000) {
          detalhesGrandesNovembro.push({
            numero: numLimpo,
            dataBr: ed.dataBr,
            codigoDom: ed.codigoDom,
            valor,
            contexto: textoCompleto.slice(md.index, Math.min(textoCompleto.length, md.index + 2400)),
          });
        }
      }

      // 2. Extrai Leis Municipais Sancionadas no Diário Oficial (2025 e 2026)
      const reLei = /LEI\s+N[º°o.]?\s*(8\.\d{3}|8\d{3})\s*,\s*DE\s*(\d{1,2}\s+DE\s+[A-ZÇÃÕÁÉÍÓÚ]+\s+DE\s+202[56])\.?\s*([\s\S]{30,420}?)(?:O\s+Prefeito\s+da\s+Cidade|Art\.\s*1|CAP[ÍI]TULO\s+I)/gi;
      let ml;
      while ((ml = reLei.exec(textoCompleto)) !== null) {
        const numLeiRaw = ml[1].replace(/\D/g, '');
        if (!numLeiRaw || leisMunicipais.has(numLeiRaw)) continue;
        const numLeiFmt = Number(numLeiRaw).toLocaleString('pt-BR');
        const corpo = ml[3]
          .replace(/\bV\s+ereador(a?)\b/gi, 'Vereador$1')
          .replace(/\bn\s+º/gi, 'nº')
          .replace(/\s+/g, ' ')
          .trim();
        const mPl = /(Projeto de Lei[^.]+?\.)/i.exec(corpo);
        const autoria = mPl ? mPl[1].trim() : 'Processo Legislativo Municipal';
        const ementa = (mPl ? corpo.replace(mPl[0], '').trim() : corpo).slice(0, 260);
        const baseUrl = `https://diariooficial.guarulhos.sp.gov.br/uploads/pdf/${cad.nomeArquivo}`;

        leisMunicipais.set(numLeiRaw, {
          numero: numLeiRaw,
          numeroFmt: numLeiFmt,
          ano: ed.ano,
          mes: ed.mes,
          dataBr: ed.dataBr,
          dataIso: ed.dataPublicacao,
          codigoDom: ed.codigoDom,
          autoria,
          ementa,
          pdfUrl: `${baseUrl}#page=1`,
          sha256Pdf: cad.sha256 || null,
        });
      }
    }
  }

  const listaDecretosFinal = [...mapaDecretos.values()].sort(
    (a, b) => b.dataIso.localeCompare(a.dataIso) || b.numeroInt - a.numeroInt
  );
  const listaLeisFinal = [...leisMunicipais.values()].sort(
    (a, b) => b.dataIso.localeCompare(a.dataIso) || Number(b.numero) - Number(a.numero)
  );

  // Atualiza scripts/decretos-reais-dom.json e manifesto
  fs.writeFileSync(DECRETOS_JSON_PATH, JSON.stringify(listaDecretosFinal, null, 2), 'utf8');
  manifesto.leisMunicipaisSancionadas = listaLeisFinal;
  manifesto.resumo.decretosSuplementares = {
    qtdTotal: listaDecretosFinal.length,
    qtd2026: listaDecretosFinal.filter((d) => d.ano === 2026).length,
    qtd2025: listaDecretosFinal.filter((d) => d.ano === 2025).length,
    valorTotal: Math.round(listaDecretosFinal.reduce((s, d) => s + d.valor, 0) * 100) / 100,
  };
  manifesto.resumo.leisMunicipais = {
    qtdTotal: listaLeisFinal.length,
    qtd2026: listaLeisFinal.filter((l) => l.ano === 2026).length,
    qtd2025: listaLeisFinal.filter((l) => l.ano === 2025).length,
  };
  fs.writeFileSync(MANIFESTO_PATH, JSON.stringify(manifesto, null, 2), 'utf8');

  // Regenera src/domain/diariosCatalogoReal.ts incluindo também LEIS_MUNICIPAIS_SANCIONADAS_REAIS
  const tsAtual = fs.readFileSync(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), 'utf8');
  const idxCat = tsAtual.indexOf('/** Catálogo completo de Decretos de Crédito Adicional Suplementar');
  const cabecalhoTs = tsAtual.slice(0, idxCat);

  const novoFinalTs = `${cabecalhoTs}export interface LeiMunicipalSancionadaReal {
  numero: string;
  numeroFmt: string;
  ano: number;
  mes: number;
  dataBr: string;
  dataIso: string;
  codigoDom: number;
  autoria: string;
  ementa: string;
  pdfUrl: string;
  sha256Pdf: string | null;
}

/** Leis Municipais sancionadas e publicadas no Diário Oficial de Guarulhos (2025 e 2026) */
export const LEIS_MUNICIPAIS_SANCIONADAS_REAIS: LeiMunicipalSancionadaReal[] = ${JSON.stringify(listaLeisFinal)};

/** Catálogo completo de Decretos de Crédito Adicional Suplementar extraídos diretamente dos PDFs do Diário Oficial (2025 e 2026) */
export const CATALOGO_DECRETOS_SUPLEMENTARES_REAIS: DecretoSuplementarReal[] = ${JSON.stringify(listaDecretosFinal)};
`;

  fs.writeFileSync(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), novoFinalTs, 'utf8');

  console.log(`PDFs varridos localmente: ${pdfsVarridos}`);
  console.log(`Decretos Suplementares totais agora: ${listaDecretosFinal.length} (+${novosDecretosPdf} ocultos em páginas multi-decreto!)`);
  console.log(`Valor total suplementado (2025+2026): ${formatarMoedaBr(manifesto.resumo.decretosSuplementares.valorTotal)}`);
  console.log(`Leis Municipais Sancionadas extraídas (2025+2026): ${listaLeisFinal.length}`);
  console.log('Amostra de Leis Municipais recentes:', listaLeisFinal.slice(0, 5));
  console.log('\n=== GRANDES DECRETOS DE NOVEMBRO/2026 (>= R$ 5M) ===');
  for (const g of detalhesGrandesNovembro) {
    console.log(`\n[Decreto ${g.numero} · ${g.dataBr} · DOM #${g.codigoDom} · ${formatarMoedaBr(g.valor)}]`);
    console.log(g.contexto.slice(0, 1200));
  }
}

main();
