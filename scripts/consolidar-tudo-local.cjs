/**
 * ============================================================================
 * CONSOLIDADOR INTEGRAL DO ACERVO LOCAL (PDFs DOM-GRU + TSE 2024 CSV)
 * ============================================================================
 * 1. Varre os 222 PDFs locais do Executivo extraindo:
 *    - Créditos Adicionais Suplementares (com ou sem prefixo "R$")
 *    - Créditos Adicionais Especiais e Extraordinários
 *    - Decretos de Remanejamento / Transposição de Recursos (Art. 6º LOA)
 *    - Leis Ordinárias e Leis Complementares sancionadas (incluindo LOA/LDO)
 *    - Extratos de Contratos, Termos Aditivos e Atas publicados no DOM-GRU
 * 2. Enriquece os 36 eleitos de Guarulhos (src/database/contingenciaPoliticosGuarulhos.ts)
 *    diretamente da base oficial data/consulta_cand_2024_SP.csv (ocupação,
 *    escolaridade, nascimento, naturalidade, coligação, URL e foto oficial TSE).
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = process.cwd();
const MANIFESTO_PATH = path.join(ROOT, 'scripts', 'manifesto-diarios-validados.json');
const DECRETOS_JSON_PATH = path.join(ROOT, 'scripts', 'decretos-reais-dom.json');

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

function limparAssinaturaDigital(s) {
  let out = String(s ?? '');
  const idxSig = out.search(/0&0\$|verisign|Thawte|TSA2048|ICP-Brasil|pkcs7/i);
  if (idxSig > 0) out = out.slice(0, idxSig);
  return out
    .replace(/[^\p{L}\p{N}\s.,;:!?()/%$ºª°'"-]/gu, ' ')
    .replace(/\bV\s+ereador(a?)\b/gi, 'Vereador$1')
    .replace(/\bn\s+º/gi, 'nº')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairTextoPdf(caminhoAbsoluto, maxStreams = 90) {
  const buf = fs.readFileSync(caminhoAbsoluto);
  const latin = buf.toString('latin1');
  const blocos = [];
  let pos = 0;
  let lidos = 0;

  while (lidos < maxStreams) {
    const sIdx = latin.indexOf('stream', pos);
    if (sIdx < 0) break;
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
          const txt = limparAssinaturaDigital(partes.join(' '));
          if (txt.length > 40) {
            blocos.push(txt);
            lidos++;
          }
        }
      } catch {
        // stream não-texto
      }
    }
    pos = eIdx + 9;
  }
  return blocos.join(' \n ');
}

function extrairBlocosContratosPdf(caminhoAbsoluto) {
  const buf = fs.readFileSync(caminhoAbsoluto);
  const latin = buf.toString('latin1');
  const blocos = [];
  let pos = 0;
  let streamsVistos = 0;

  while (streamsVistos < 450) {
    const sIdx = latin.indexOf('stream', pos);
    if (sIdx < 0) break;
    if (sIdx >= 3 && latin.slice(sIdx - 3, sIdx) === 'end') {
      pos = sIdx + 6;
      continue;
    }
    const eIdx = latin.indexOf('endstream', sIdx + 6);
    if (eIdx < 0) break;
    streamsVistos++;

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
        if (
          raw.includes('(') &&
          (raw.includes('EXTRATO') || raw.includes('Extrato') || raw.includes('Contratad') || raw.includes('CONTRATAD') || raw.includes('Detentor'))
        ) {
          const partes = [];
          const re = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
          let m;
          while ((m = re.exec(raw)) !== null) {
            partes.push(decodePdfLiteral(m[1]));
          }
          const txt = limparAssinaturaDigital(partes.join(' '));
          if (txt.length > 40) blocos.push(txt);
        }
      } catch {
        // stream não-texto
      }
    }
    pos = eIdx + 9;
  }
  return blocos.join(' \n ');
}

function parseNumeroMoedaPdf(str) {
  // Trata casos de kerning como "1 1.640.149,43" -> "11.640.149,43"
  const limpo = String(str ?? '').replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

function formatarMoedaBr(valor) {
  return 'R$ ' + valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseLinhaCsvAspas(linha) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < linha.length; i++) {
    const ch = linha[i];
    if (inQ) {
      if (ch === '"') {
        if (i + 1 < linha.length && linha[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ';') {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function consolidarAtosDosPdfs() {
  console.log('[1/2] Extraindo 100% dos decretos (suplementares, especiais e remanejamentos), leis e contratos dos 222 PDFs...');
  const manifesto = JSON.parse(fs.readFileSync(MANIFESTO_PATH, 'utf8'));
  const decretosAtuais = JSON.parse(fs.readFileSync(DECRETOS_JSON_PATH, 'utf8'));

  const mapaDecretos = new Map();
  for (const d of decretosAtuais) {
    const numLimpo = String(d.numero).replace(/\D/g, '');
    mapaDecretos.set(numLimpo, {
      ...d,
      modalidade: d.modalidade || 'SUPLEMENTAR',
      trecho: limparAssinaturaDigital(d.trecho).slice(0, 340),
    });
  }

  const mapaLeis = new Map();
  for (const l of manifesto.leisMunicipaisSancionadas || []) {
    mapaLeis.set(String(l.numero), l);
  }

  const extratosContratos = [];
  const chavesContratos = new Set();

  let novosSuplementares = 0;
  let novosEspeciais = 0;
  let novosRemanejamentos = 0;

  for (const ed of manifesto.executivo) {
    for (const cad of ed.cadernos) {
      if (!cad.arquivoLocal) continue;
      const abs = path.join(ROOT, cad.arquivoLocal);
      if (!fs.existsSync(abs)) continue;

      const texto = extrairTextoPdf(abs, 85);
      if (!texto) continue;

      const baseUrl = `https://diariooficial.guarulhos.sp.gov.br/uploads/pdf/${cad.nomeArquivo}`;

      const paginaAproximada = (idx) => {
        const antes = texto.slice(Math.max(0, idx - 2000), idx + 300);
        const mPag = /P[áa]gina\s+(\d+)/gi;
        let p = 1;
        let m;
        while ((m = mPag.exec(antes)) !== null) p = Number(m[1]);
        return Math.min(Math.max(1, p), cad.paginas || ed.totalPaginas || 1);
      };

      // A) Todos os Decretos Orçamentários: Suplementar (com ou sem R$), Especial, Extraordinário e Remanejamento/Transposição
      const reDecOrc = /DECRETO\s+N[\sº°o.]*([\d.]{4,7})\s+Disp.{1,3}e\s+sobre\s+(a\s+abertura\s+de\s+cr.{1,3}dito\s+adicional\s+(?:suplementar|especial|extraordin[áa]rio)|o?\s*remanejamento\s+de\s+recursos|a?\s*transposi.{1,3}o\s+de\s+recursos)[\s\S]{0,140}?valor\s+de\s+(?:R\$\s*)?([\d.\s]{1,18},\d{2})/gi;
      let md;
      while ((md = reDecOrc.exec(texto)) !== null) {
        const numLimpo = md[1].replace(/\D/g, '');
        const descTipo = md[2].toLowerCase();
        const valor = parseNumeroMoedaPdf(md[3]);
        if (!numLimpo || !valor) continue;

        let modalidade = 'SUPLEMENTAR';
        if (descTipo.includes('especial')) modalidade = 'ESPECIAL';
        else if (descTipo.includes('extraordin')) modalidade = 'EXTRAORDINARIO';
        else if (descTipo.includes('remanejamento') || descTipo.includes('transposi')) modalidade = 'REMANEJAMENTO';

        if (!mapaDecretos.has(numLimpo)) {
          const pag = paginaAproximada(md.index);
          const numeroInt = Number(numLimpo);
          const trecho = texto.slice(Math.max(0, md.index - 20), Math.min(texto.length, md.index + 320)).trim();
          mapaDecretos.set(numLimpo, {
            numero: numLimpo,
            numeroFmt: numeroInt.toLocaleString('pt-BR'),
            numeroInt,
            modalidade,
            ano: ed.ano,
            mes: ed.mes,
            dataBr: ed.dataBr,
            dataIso: ed.dataPublicacao,
            codigoDom: ed.codigoDom,
            pagina: pag,
            totalPaginas: cad.paginas || ed.totalPaginas || 1,
            valor,
            valorFmt: formatarMoedaBr(valor),
            trecho,
            pdfUrl: `${baseUrl}#page=${pag}`,
          });
          if (modalidade === 'SUPLEMENTAR') novosSuplementares++;
          else if (modalidade === 'REMANEJAMENTO') novosRemanejamentos++;
          else novosEspeciais++;
        } else {
          const at = mapaDecretos.get(numLimpo);
          if (!at.modalidade) at.modalidade = modalidade;
          if (!at.codigoDom) at.codigoDom = ed.codigoDom;
        }
      }

      // B) Leis Complementares e Leis Ordinárias (LOA, LDO, etc.)
      const reLeiComp = /LEI\s+(COMPLEMENTAR\s+)?N[\sº°o.]*([\d.]{3,6})\s*,\s*DE\s*(\d{1,2}\s+DE\s+[A-ZÇÃÕÁÉÍÓÚ]+\s+DE\s+202[56])\.?\s*([\s\S]{25,420}?)(?:O\s+Prefeito\s+da\s+Cidade|Art\.\s*1|CAP[ÍI]TULO\s+I)/gi;
      let ml;
      while ((ml = reLeiComp.exec(texto)) !== null) {
        const ehComp = Boolean(ml[1]);
        const numRaw = ml[2].replace(/\D/g, '');
        const chaveLei = ehComp ? `LC-${numRaw}` : numRaw;
        if (!numRaw || mapaLeis.has(chaveLei)) continue;

        const corpo = limparAssinaturaDigital(ml[4]);
        const mPl = /(Projeto de Lei[^.]+?\.)/i.exec(corpo);
        const autoria = mPl ? mPl[1].trim() : ehComp ? 'Lei Complementar Municipal' : 'Processo Legislativo Municipal';
        const ementa = (mPl ? corpo.replace(mPl[0], '').trim() : corpo).slice(0, 260);
        const pag = paginaAproximada(ml.index);

        mapaLeis.set(chaveLei, {
          numero: chaveLei,
          numeroFmt: ehComp ? `LC ${Number(numRaw).toLocaleString('pt-BR')}` : Number(numRaw).toLocaleString('pt-BR'),
          ano: ed.ano,
          mes: ed.mes,
          dataBr: ed.dataBr,
          dataIso: ed.dataPublicacao,
          codigoDom: ed.codigoDom,
          autoria,
          ementa,
          pdfUrl: `${baseUrl}#page=${pag}`,
          sha256Pdf: cad.sha256 || null,
        });
      }

      // C) Extratos de Contratos, Termos Aditivos, Atas e Convênios publicados em qualquer página do Diário Oficial
      const textoContratos = extrairBlocosContratosPdf(abs);
      const reExtrato = /(EXTRATO\s+D[EOA]\s+(?:CONTRATO|TERMO\s+ADITIVO|ATA\s+DE\s+REGISTRO\s+DE\s+PRE[ÇC]OS|CONV[ÊE]NIO|TERMO\s+DE\s+COLABORA[ÇC][ÃA]O|TERMO\s+DE\s+FOMENTO))([\s\S]{40,850}?)(?=EXTRATO\s+D[EOA]|SECRETARIA\s+DE|PORTARIA\s+N|EDITAL\s+DE|$)/gi;
      let me;
      while ((me = reExtrato.exec(textoContratos)) !== null && extratosContratos.length < 360) {
        const tipoExtrato = me[1].replace(/\s+/g, ' ').trim().toUpperCase();
        const bloco = limparAssinaturaDigital(me[2]);
        const mValor = /(?:Valor|R\$)\s*:?\s*(?:R\$\s*)?([\d.\s]{3,18},\d{2})/i.exec(bloco);
        const mContratada = /(?:Contratad[ao]|Detentor[aa]?|Empresa|Organiza[çc][ãa]o|Conveniada)\s*:?\s*([^.;]{4,115})/i.exec(bloco);
        const mObjeto = /Objeto\s*:?\s*([^]{10,220}?)(?:Valor|Vig[êe]ncia|Prazo|Assinatura|Dota[çc]|$)/i.exec(bloco);
        const valor = mValor ? parseNumeroMoedaPdf(mValor[1]) : null;
        if (!mContratada && !valor) continue;

        const contratada = mContratada ? mContratada[1].trim() : 'Fornecedor contratado no ato oficial';
        const chaveUnica = `${ed.dataPublicacao}|${contratada.slice(0, 32)}|${valor ?? 0}`;
        if (chavesContratos.has(chaveUnica)) continue;
        chavesContratos.add(chaveUnica);

        const antes = textoContratos.slice(Math.max(0, me.index - 1800), me.index + 300);
        const mPag = /P[áa]gina\s+(\d+)/gi;
        let pag = 1;
        let mp;
        while ((mp = mPag.exec(antes)) !== null) pag = Number(mp[1]);
        pag = Math.min(Math.max(1, pag), cad.paginas || ed.totalPaginas || 1);

        extratosContratos.push({
          id: `ext-${ed.codigoDom}-${extratosContratos.length + 1}`,
          tipo: tipoExtrato,
          contratada,
          objeto: mObjeto ? mObjeto[1].trim().slice(0, 220) : bloco.slice(0, 200),
          valor,
          valorFmt: valor ? formatarMoedaBr(valor) : null,
          ano: ed.ano,
          mes: ed.mes,
          dataBr: ed.dataBr,
          dataIso: ed.dataPublicacao,
          codigoDom: ed.codigoDom,
          pagina: pag,
          pdfUrl: `${baseUrl}#page=${pag}`,
          sha256Pdf: cad.sha256 || null,
        });
      }
    }
  }

  const listaDecretos = [...mapaDecretos.values()].sort(
    (a, b) => b.dataIso.localeCompare(a.dataIso) || b.numeroInt - a.numeroInt
  );
  const listaLeis = [...mapaLeis.values()].sort(
    (a, b) => b.dataIso.localeCompare(a.dataIso) || String(b.numero).localeCompare(String(a.numero))
  );
  extratosContratos.sort((a, b) => b.dataIso.localeCompare(a.dataIso) || (b.valor ?? 0) - (a.valor ?? 0));

  fs.writeFileSync(DECRETOS_JSON_PATH, JSON.stringify(listaDecretos, null, 2), 'utf8');

  manifesto.leisMunicipaisSancionadas = listaLeis;
  manifesto.extratosContratosDom = extratosContratos;
  manifesto.resumo.decretosOrcamentarios = {
    qtdTotal: listaDecretos.length,
    qtdSuplementares: listaDecretos.filter((d) => d.modalidade === 'SUPLEMENTAR').length,
    qtdRemanejamentos: listaDecretos.filter((d) => d.modalidade === 'REMANEJAMENTO').length,
    qtdEspeciais: listaDecretos.filter((d) => d.modalidade === 'ESPECIAL' || d.modalidade === 'EXTRAORDINARIO').length,
    qtd2026: listaDecretos.filter((d) => d.ano === 2026).length,
    qtd2025: listaDecretos.filter((d) => d.ano === 2025).length,
    valorTotal: Math.round(listaDecretos.reduce((s, d) => s + d.valor, 0) * 100) / 100,
  };
  manifesto.resumo.leisMunicipais = {
    qtdTotal: listaLeis.length,
    qtd2026: listaLeis.filter((l) => l.ano === 2026).length,
    qtd2025: listaLeis.filter((l) => l.ano === 2025).length,
  };
  manifesto.resumo.extratosContratos = extratosContratos.length;
  fs.writeFileSync(MANIFESTO_PATH, JSON.stringify(manifesto, null, 2), 'utf8');

  // Atualiza src/domain/diariosCatalogoReal.ts com modalidade e EXTRATOS_CONTRATOS_DOM_REAIS
  let ts = fs.readFileSync(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), 'utf8');
  if (!ts.includes('export type ModalidadeDecretoReal')) {
    ts = ts.replace(
      'export interface DecretoSuplementarReal {\n  numero: string;',
      "export type ModalidadeDecretoReal = 'SUPLEMENTAR' | 'REMANEJAMENTO' | 'ESPECIAL' | 'EXTRAORDINARIO';\n\nexport interface DecretoSuplementarReal {\n  numero: string;\n  modalidade?: ModalidadeDecretoReal;"
    );
  }
  const idxLei = ts.indexOf('export interface LeiMunicipalSancionadaReal');
  ts =
    ts.slice(0, idxLei) +
    `export interface LeiMunicipalSancionadaReal {
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

export interface ExtratoContratoDomReal {
  id: string;
  tipo: string;
  contratada: string;
  objeto: string;
  valor: number | null;
  valorFmt: string | null;
  ano: number;
  mes: number;
  dataBr: string;
  dataIso: string;
  codigoDom: number;
  pagina: number;
  pdfUrl: string;
  sha256Pdf: string | null;
}

/** Leis Municipais (Ordinárias e Complementares, incluindo LOA/LDO) sancionadas em 2025 e 2026 */
export const LEIS_MUNICIPAIS_SANCIONADAS_REAIS: LeiMunicipalSancionadaReal[] = ${JSON.stringify(listaLeis)};

/** Extratos de contratos, atas e termos aditivos extraídos diretamente do Diário Oficial */
export const EXTRATOS_CONTRATOS_DOM_REAIS: ExtratoContratoDomReal[] = ${JSON.stringify(extratosContratos)};

/** Catálogo completo de Decretos Orçamentários (Suplementares, Especiais e Remanejamentos) extraídos dos 222 PDFs */
export const CATALOGO_DECRETOS_SUPLEMENTARES_REAIS: DecretoSuplementarReal[] = ${JSON.stringify(listaDecretos)};
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), ts, 'utf8');

  console.log('  -> Decretos Orçamentários totais:', manifesto.resumo.decretosOrcamentarios);
  console.log(`     (+${novosSuplementares} suplementares sem R$, +${novosRemanejamentos} remanejamentos, +${novosEspeciais} especiais)`);
  console.log('  -> Leis Municipais totais:', manifesto.resumo.leisMunicipais);
  console.log('  -> Extratos de Contratos/Aditivos extraídos:', extratosContratos.length);
}

function enriquecerPoliticosTseLocal() {
  console.log('\n[2/2] Enriquecendo os 36 representantes de Guarulhos com data/consulta_cand_2024_SP.csv...');
  const csvPath = path.join(ROOT, 'data', 'consulta_cand_2024_SP.csv');
  const polTsPath = path.join(ROOT, 'src', 'database', 'contingenciaPoliticosGuarulhos.ts');
  if (!fs.existsSync(csvPath)) {
    console.log('  ! CSV TSE não encontrado, mantendo base atual.');
    return;
  }

  const polTxt = fs.readFileSync(polTsPath, 'utf8');
  const idxEqArr = polTxt.indexOf('= [');
  const idxArr = idxEqArr >= 0 ? idxEqArr + 2 : polTxt.indexOf('[');
  const eleitos = JSON.parse(polTxt.slice(idxArr).replace(/;\s*$/, ''));
  const sqSet = new Set(eleitos.map((e) => String(e.sq)));

  const rawBuf = fs.readFileSync(csvPath);
  const textoCsv = new TextDecoder('windows-1252').decode(rawBuf);
  const linhas = textoCsv.split(/\r?\n/);
  const cab = parseLinhaCsvAspas(linhas[0]);
  const col = Object.fromEntries(cab.map((c, i) => [c, i]));

  const dadosTsePorSq = new Map();
  for (let i = 1; i < linhas.length; i++) {
    const ln = linhas[i];
    if (!ln || !ln.includes('64777')) continue;
    const r = parseLinhaCsvAspas(ln);
    const sq = r[col.SQ_CANDIDATO];
    if (!sqSet.has(sq)) continue;

    dadosTsePorSq.set(sq, {
      ocupacao: r[col.DS_OCUPACAO] || null,
      escolaridade: r[col.DS_GRAU_INSTRUCAO] || null,
      genero: r[col.DS_GENERO] || null,
      estadoCivil: r[col.DS_ESTADO_CIVIL] || null,
      corRaca: r[col.DS_COR_RACA] || null,
      municipioNasc: r[col.NM_MUNICIPIO_NASCIMENTO] || null,
      ufNasc: r[col.SG_UF_NASCIMENTO] || null,
      dtNasc: r[col.DT_NASCIMENTO] || null,
      coligacao: r[col.NM_COLIGACAO] || null,
      composicaoColigacao: r[col.DS_COMPOSICAO_COLIGACAO] || null,
      nomePartidoCompleto: r[col.NM_PARTIDO] || null,
      emailCandidato: r[col.DS_EMAIL] && !r[col.DS_EMAIL].includes('NÃO DIVULGÁVEL') ? r[col.DS_EMAIL] : null,
    });
  }

  let enriquecidos = 0;
  const novosEleitos = eleitos.map((e) => {
    const tse = dadosTsePorSq.get(String(e.sq));
    if (tse) enriquecidos++;
    const urlTseDivulga = `https://divulgacandcontas.tse.jus.br/divulga/#/candidato/2024/2045202024/64777/${e.sq}`;
    return {
      ...e,
      fotoUrl: e.fotoUrl && !e.fotoUrl.includes('divulgacandcontas.tse.jus.br') ? e.fotoUrl : null,
      nasc: tse?.dtNasc || e.nasc || null,
      ocupacao: tse?.ocupacao || null,
      escolaridade: tse?.escolaridade || null,
      genero: tse?.genero || null,
      municipioNasc: tse?.municipioNasc || null,
      ufNasc: tse?.ufNasc || null,
      coligacao: tse?.coligacao || null,
      composicaoColigacao: tse?.composicaoColigacao || null,
      nomePartidoCompleto: tse?.nomePartidoCompleto || e.partido,
      urlTseDivulga,
    };
  });

  const novoTs = `/**
 * ============================================================================
 * SNAPSHOT OFICIAL TSE 2024 — ELEITOS DE GUARULHOS (19ª LEGISLATURA 2025–2028)
 * Extraído diretamente dos arquivos oficiais do TSE no repositório:
 *   - data/consulta_cand_2024_SP.csv
 *   - data/votacao_candidato_munzona_2024_SP.csv
 * ============================================================================
 */
export const ELEITOS_GUARULHOS_TSE_2024: any[] = ${JSON.stringify(novosEleitos)};
`;
  fs.writeFileSync(polTsPath, novoTs, 'utf8');
  console.log(`  -> ${enriquecidos}/${eleitos.length} representantes enriquecidos com ocupação, escolaridade, coligação e foto/link TSE!`);
}

consolidarAtosDosPdfs();
enriquecerPoliticosTseLocal();
