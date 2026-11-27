/**
 * ============================================================================
 * PROCESSADOR DE LINGUAGEM CLARA & AUDITORIA ESTRUTURADA (222 PDFs LOCAIS)
 * Projeto: Fiscaliza Guarulhos (IBGE 3518800)
 * ============================================================================
 * 1. Corrige o kerning quebrado das fontes dos PDFs ("CONTRA T ADA" -> "CONTRATADA",
 *    "T O T A L" -> "TOTAL", "V ereador" -> "Vereador", "1 1" -> "11").
 * 2. Extrai o conteúdo COMPLETO e ESTRUTURADO dos 843 Decretos Orçamentários:
 *    - Para onde foi o dinheiro (Art. 1º: Secretaria + Ação Programática)
 *    - De onde saiu o dinheiro (Art. 2º: Anulação de qual ação / Excesso / Superávit)
 *    - Título claro em português simples + Texto integral limpo sem lixo anterior
 * 3. Traduz as 197 Leis Sancionadas em Título Simples, Autor Limpo, Tema,
 *    "O que muda na prática" e Texto Integral dos primeiros artigos.
 * 4. Limpa e reclassifica as 1.071 Conexões Empresa <-> Diário Oficial com
 *    Resumo Simples e Texto Completo sem palavras cortadas no meio.
 * 5. Calcula os Indicadores Oficiais de Auditoria Profissional (Curva ABC,
 *    Contratações Diretas, Fluxo de Decretos por Secretaria).
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const ROOT = process.cwd();
const MANIFESTO_PATH = path.join(ROOT, 'scripts', 'manifesto-diarios-validados.json');
const DECRETOS_JSON_PATH = path.join(ROOT, 'scripts', 'decretos-reais-dom.json');
const CREDORES_JSON_PATH = path.join(ROOT, 'public', 'dados', 'credores-completo.json');
const CONEXOES_JSON_PATH = path.join(ROOT, 'public', 'dados', 'conexoes-empresas-dom.json');

/** Mapa oficial dos códigos de Órgão / Secretaria da LOA de Guarulhos (validado nos PDFs do DOM) */
const ORGAOS_CODIGO_GUARULHOS = {
  '01': 'Câmara Municipal',
  '02': 'Casa Civil / Articulação Institucional',
  '03': 'Governo Municipal',
  '04': 'Desenvolvimento Urbano',
  '05': 'Secretaria da Fazenda',
  '06': 'Justiça e Procuradoria',
  '07': 'Secretaria da Saúde',
  '08': 'Secretaria de Educação',
  '09': 'Obras e Infraestrutura',
  '10': 'Transporte e Mobilidade Urbana',
  '11': 'Gestão e Recursos Humanos',
  '12': 'Secretaria de Cultura',
  '13': 'Desenvolvimento Econômico e Trabalho',
  '14': 'Esporte e Lazer',
  '15': 'Meio Ambiente',
  '16': 'Desenvolvimento Social e Defesa Civil',
  '17': 'Ciência, Tecnologia e Inovação',
  '18': 'Proteção Animal',
  '19': 'Administração Regional',
  '20': 'Segurança Pública (GCM)',
  '21': 'Secretaria de Habitação',
  '27': 'Fundo Social de Solidariedade',
  '34': 'Procon Guarulhos',
  '35': 'Direitos Humanos',
  '36': 'Controladoria Geral do Município',
  '37': 'Zeladoria e Administrações Regionais',
  '38': 'Serviços Públicos',
  '80': 'Encargos Gerais e Precatórios',
  '85': 'IPREF (Previdência Municipal)',
};

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

/** Corrige espaçamentos residuais de fontes dos PDFs do Diário Oficial */
function desfazerKerningPdf(s) {
  let out = String(s ?? '');
  const idxSig = out.search(/0&0\$|verisign|Thawte|TSA2048|ICP-Brasil|pkcs7/i);
  if (idxSig > 0) out = out.slice(0, idxSig);

  out = out
    .replace(/[^\p{L}\p{N}\s.,;:!?()/%$ºª°'"-]/gu, ' ')
    // Consoante maiúscula isolada antes de minúsculas por quebra de Tj ("T ecnologia" -> "Tecnologia", "V ereador" -> "Vereador")
    .replace(/\b([BCDFGHJKLMNPQRSTVWXYZÇ])\s+([a-záéíóúâêôãõç]{2,})\b/g, '$1$2')
    .replace(/\bT\s*O\s*T\s*A\s*L\b/g, 'TOTAL')
    .replace(/\bCONTRA\s*T\s*ANTE\b/gi, 'CONTRATANTE')
    .replace(/\bCONTRA\s*T\s*AD([AO]S?)\b/gi, 'CONTRATAD$1')
    .replace(/\bADIT\s*AMENT\s*O\b/gi, 'ADITAMENTO')
    .replace(/\bLICIT\s*A[ÇC][ÃA]O\b/gi, 'LICITAÇÃO')
    .replace(/\bDECRET\s*O\b/gi, 'DECRETO')
    .replace(/\bDECRET\s*A\b/g, 'DECRETA')
    .replace(/\bRESOL\s*VE\b/g, 'RESOLVE')
    .replace(/\bL\s*TDA\b/gi, 'LTDA')
    .replace(/\bS\s*\/\s*A\b/gi, 'S/A')
    .replace(/\bMan\s+uten[çc][ãa]o\b/gi, 'Manutenção')
    .replace(/\bEven\s+tos\b/gi, 'Eventos')
    .replace(/\bPrim[áa]ri\s+a\b/gi, 'Primária')
    .replace(/\bESP\s*A[ÇC]O\b/gi, 'ESPAÇO')
    .replace(/\bEVENT\s*OS\b/gi, 'EVENTOS')
    .replace(/\bPERSPECTIV\s*A\b/gi, 'PERSPECTIVA')
    .replace(/\bVENCIMENT\s*O\s*S?\b/gi, 'VENCIMENTOS')
    .replace(/\bT\s+ABELA\b/gi, 'TABELA')
    .replace(/\bn\s+º/gi, 'nº')
    // Separa palavras coladas tipo "ManutençãodoSistemade"
    .replace(/([a-záéíóúãõç])(do|da|de)([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1 $2 $3')
    .replace(/([a-záéíóúãõç])([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}

function extrairTextoCompletoPdf(caminhoAbsoluto, maxStreams = 800) {
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
    lidos++;

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
          const re = /\(([^()\\]*(?:\\.[^()\\]*)*)\)/g;
          let m;
          let prevEnd = 0;
          let acc = '';
          while ((m = re.exec(raw)) !== null) {
            if (prevEnd > 0) {
              const between = raw.slice(prevEnd, m.index).trim();
              // Dentro de um array [...]TJ do PDF, entre ")" e "(" há apenas o ajuste de kerning numérico
              if (/^-?\d+(?:\.\d+)?$/.test(between)) {
                if (parseFloat(between) < -160) acc += ' ';
              } else {
                acc += ' ';
              }
            }
            acc += decodePdfLiteral(m[1]);
            prevEnd = re.lastIndex;
          }
          const txt = desfazerKerningPdf(acc);
          if (txt.length > 25) blocos.push(txt);
        }
      } catch {
        // stream de imagem/fonte
      }
    }
    pos = eIdx + 9;
  }
  return blocos.join(' \n ');
}

function nomeOrgaoPorDotacao(codDotacao) {
  const prefixo2 = String(codDotacao ?? '').trim().slice(0, 2);
  return ORGAOS_CODIGO_GUARULHOS[prefixo2] || null;
}

function limparNomeAcao(acaoRaw) {
  return String(acaoRaw ?? '')
    .replace(/^[\d.\s-]+/, '')
    .replace(/[\s-]+$/, '')
    .replace(/\s+[\d.,]+$/, '')
    .replace(/\b(TOTAL|Suplementa[çc][ãa]o|Redu[çc][ãa]o|Classifica[çc][ãa]o|Or[çc]ament[áa]ria|Descri[çc][ãa]o da A[çc][ãa]o|R\$)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extrairAcoesDeBlocoArtigo(bloco) {
  if (!bloco) return [];
  const achados = [];
  const vistos = new Set();
  // Exemplo real no PDF: 1710.1912600512.157.01.1100000.339040.0000 Manutenção e Atualização de Infraestrutura 1.616.646,00
  const reLinha = /\b(\d{4})\.[\d.]{16,46}?\.\d{4}\s+([^\d]{4,140}?)\s+[\d.]+,\d{2}/gu;
  let m;
  while ((m = reLinha.exec(bloco)) !== null && achados.length < 5) {
    const orgao = nomeOrgaoPorDotacao(m[1]);
    const acao = limparNomeAcao(m[2]);
    if (acao.length < 4) continue;
    const chave = `${orgao || ''}|${acao.toLowerCase()}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    achados.push({ orgao, acao });
  }
  return achados;
}

function parseDecretoEstruturado(blocoCompleto, modalidade, valorFmt) {
  const mProc = /processo(?:\s+administrativo|\s+SEI)?\s+nº\s*([\d./-]{8,25})/i.exec(blocoCompleto);
  const processoSei = mProc ? mProc[1].trim() : null;

  const idxArt1 = blocoCompleto.search(/Art\.\s*1[º°]/i);
  const idxArt2 = blocoCompleto.search(/Art\.\s*2[º°]/i);
  const idxArt3 = blocoCompleto.search(/Art\.\s*3[º°]/i);

  const blocoArt1 =
    idxArt1 >= 0
      ? blocoCompleto.slice(idxArt1, idxArt2 > idxArt1 ? idxArt2 : idxArt3 > idxArt1 ? idxArt3 : idxArt1 + 1200)
      : '';
  const blocoArt2 =
    idxArt2 >= 0
      ? blocoCompleto.slice(idxArt2, idxArt3 > idxArt2 ? idxArt3 : idxArt2 + 1200)
      : '';

  const destinos = extrairAcoesDeBlocoArtigo(blocoArt1);
  const origens = extrairAcoesDeBlocoArtigo(blocoArt2);

  let tipoFonteOrigem = 'Anulação de dotação';
  if (/excesso de arrecada[çc][ãa]o/i.test(blocoArt2 || blocoCompleto)) {
    tipoFonteOrigem = 'Excesso de arrecadação';
  } else if (/super[áa]vit financeiro/i.test(blocoArt2 || blocoCompleto)) {
    tipoFonteOrigem = 'Superávit financeiro';
  } else if (modalidade === 'REMANEJAMENTO' || /remanejamento|transposi[çc][ãa]o/i.test(blocoCompleto)) {
    tipoFonteOrigem = 'Remanejamento interno (Art. 6º LOA)';
  }

  const destPrincipal = destinos[0];
  const origPrincipal = origens[0];

  const destinoResumo = destPrincipal
    ? `${destPrincipal.orgao ? `${destPrincipal.orgao} — ` : ''}${destPrincipal.acao}${destinos.length > 1 ? ` (+${destinos.length - 1})` : ''}`
    : modalidade === 'REMANEJAMENTO'
    ? 'Adequação entre dotações de secretarias municipais'
    : 'Reforço de dotação do orçamento vigente';

  const origemResumo = origPrincipal
    ? `${origPrincipal.orgao ? `${origPrincipal.orgao} — ` : ''}${origPrincipal.acao}${origens.length > 1 ? ` (+${origens.length - 1})` : ''}`
    : tipoFonteOrigem === 'Excesso de arrecadação'
    ? 'Receita arrecadada acima do previsto no exercício'
    : tipoFonteOrigem === 'Superávit financeiro'
    ? 'Saldo positivo em caixa do exercício anterior'
    : 'Redução/anulação de dotações previstas no Art. 2º';

  const tituloSimples = destPrincipal
    ? `Verba para ${destPrincipal.acao}${destPrincipal.orgao ? ` (${destPrincipal.orgao})` : ''}`
    : modalidade === 'REMANEJAMENTO'
    ? `Remanejamento orçamentário de ${valorFmt}`
    : `Suplementação orçamentária de ${valorFmt}`;

  const explicacaoSimples =
    destPrincipal && origPrincipal
      ? `Direcionou ${valorFmt} para "${destPrincipal.acao}" (${destPrincipal.orgao || 'Município'}), retirando recursos de "${origPrincipal.acao}" (${origPrincipal.orgao || 'dotação anulada'}).`
      : destPrincipal
      ? `Direcionou ${valorFmt} para "${destPrincipal.acao}"${destPrincipal.orgao ? ` na ${destPrincipal.orgao}` : ''}, com recursos de ${tipoFonteOrigem.toLowerCase()}.`
      : `Movimentou ${valorFmt} no orçamento municipal por ${tipoFonteOrigem.toLowerCase()}.`;

  return {
    tituloSimples: tituloSimples.slice(0, 140),
    destinoResumo: destinoResumo.slice(0, 160),
    origemResumo: origemResumo.slice(0, 160),
    orgaoDestino: destPrincipal?.orgao || null,
    orgaoOrigem: origPrincipal?.orgao || null,
    tipoFonteOrigem,
    processoSei,
    explicacaoSimples,
    textoIntegral: blocoCompleto.slice(0, 2200),
  };
}

function classificarTemaLei(texto) {
  const t = texto.toLowerCase();
  if (/sa[úu]de|hospital|m[ée]dic|ubs|upa|autis|vacina|farm[áa]cia|maternidade|obst[ée]trica|doen[çc]a/.test(t)) return 'Saúde';
  if (/educa[çc][ãa]o|escola|alfabetiza|leia|creche|professor|estudante|ensino/.test(t)) return 'Educação';
  if (/cargo|carreira|sal[áa]rio|vencimento|servidor|estatut|quadro permanente|assistente de gest/.test(t)) return 'Servidores e Gestão';
  if (/or[çc]ament|diretrizes or[çc]ament|cr[ée]dito|tribut|imposto|iptu|iss|taxa|isenc/.test(t)) return 'Orçamento e Impostos';
  if (/utilidade p[úu]blica|associa[çc][ãa]o|instituto/.test(t)) return 'Utilidade Pública';
  if (/animal|ambiental|parque|[áa]rvore|res[íi]duo|saneamento|clima/.test(t)) return 'Meio Ambiente e Animais';
  if (/transporte|tr[âa]nsito|vi[áa]ria|[ôo]nibus|estacionamento|mobilidade/.test(t)) return 'Transporte e Trânsito';
  if (/denomina|rua |pra[çc]a |viela |logradouro|bairro|habita[çc][ãa]o|urbana|obras/.test(t)) return 'Bairros e Cidade';
  if (/calend[áa]rio|dia municipal|semana municipal|encontro|cultura|esport|evento|homenage/.test(t)) return 'Cultura e Calendário';
  return 'Regras Municipais';
}

function traduzirLeiEmLinguagemSimples(ementaBruta, autoriaBruta) {
  const em = desfazerKerningPdf(ementaBruta);
  const aut = desfazerKerningPdf(autoriaBruta);

  // Extrai autor limpo e PL
  const mPl = /Projeto de Lei(?:\s+Complementar)?\s*nº\s*([\d/]+)/i.exec(aut);
  const projetoOrigem = mPl ? `PL ${mPl[1]}` : null;
  let autorLimpo = 'Processo Legislativo';
  if (/Poder Executivo/i.test(aut)) {
    autorLimpo = 'Prefeito (Poder Executivo)';
  } else {
    const mVer = /autoria\s+d[oa]s?\s+(.+?)\.?$/i.exec(aut);
    if (mVer) autorLimpo = mVer[1].trim();
  }

  // Limpa jargão jurídico da ementa para gerar um Título Simples e "O que muda"
  let limpo = em
    .replace(/,?\s*no [âa]mbito do Munic[íi]pio de Guarulhos,?/gi, '')
    .replace(/,?\s*e d[áa] outras provid[êe]ncias\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  let tituloSimples = limpo;
  if (/^Disp[õo]e sobre reconhecimento de Utilidade P[úu]blica d[aoe]\s+(.+)/i.test(limpo)) {
    tituloSimples = `Declara de Utilidade Pública: ${RegExp.$1.replace(/\.$/, '')}`;
  } else if (/^Disp[õo]e sobre a?o?\s*(.+)/i.test(limpo)) {
    const r = RegExp.$1.replace(/\.$/, '');
    tituloSimples = r.charAt(0).toUpperCase() + r.slice(1);
  } else if (/^Institui a?o?\s*(.+)/i.test(limpo)) {
    tituloSimples = `Cria ${RegExp.$1.replace(/\.$/, '')}`;
  } else if (/^Estabelece a?o?\s*(.+)/i.test(limpo)) {
    tituloSimples = `Define ${RegExp.$1.replace(/\.$/, '')}`;
  } else if (/^Altera a Lei[^,]+,?(?:\s*de [^,]+,)?\s*para\s+(.+)/i.test(limpo)) {
    const ac = RegExp.$1.replace(/^fazer constar\s+/i, 'incluir ').replace(/\.$/, '');
    tituloSimples = ac.charAt(0).toUpperCase() + ac.slice(1);
  } else if (/^Denomina\s+(.+)/i.test(limpo)) {
    tituloSimples = `Dá nome oficial a espaço público: ${RegExp.$1.replace(/\.$/, '')}`;
  }

  if (tituloSimples.length > 125) {
    tituloSimples = tituloSimples.slice(0, 122).replace(/\s+\S*$/, '') + '…';
  }

  const tema = classificarTemaLei(`${em} ${tituloSimples}`);
  return {
    tituloSimples,
    autorLimpo,
    projetoOrigem,
    tema,
    oQueMuda: limpo.endsWith('.') ? limpo : `${limpo}.`,
  };
}

function classificarEResumirConexaoDom(ctxLimpo, nomeCredor) {
  const c = ctxLimpo.toUpperCase();
  let tipoAto = 'ATO_OFICIAL';
  if (c.includes('TERMO DE ADITAMENTO') || c.includes('TERMO ADITIVO') || c.includes('ADITAMENTO') || c.includes('PRORROGA')) {
    tipoAto = 'ADITIVO';
  } else if (c.includes('ATA DE REGISTRO DE PRE') || c.includes('DETENTORA')) {
    tipoAto = 'ATA_RP';
  } else if (c.includes('DISPENSA DE LICITA') || c.includes('INEXIGIBILIDADE')) {
    tipoAto = 'DISPENSA';
  } else if (c.includes('HOMOLOGA') || c.includes('ADJUDICA')) {
    tipoAto = 'HOMOLOGACAO';
  } else if (c.includes('UTILIDADE PUBLICA') || c.includes('UTILIDADE PÚBLICA') || c.includes('CONVENIO') || c.includes('CONVÊNIO') || c.includes('COLABORACAO') || c.includes('COLABORAÇÃO') || c.includes('CONTRATO DE GEST')) {
    tipoAto = 'CONVENIO';
  } else if (c.includes('CONTRATADA') || c.includes('CONTRATO N') || c.includes('EXTRATO DE CONTRATO') || c.includes('EXTRATO DO CONTRATO')) {
    tipoAto = 'CONTRATO';
  } else if (c.includes('FISCAL') || c.includes('GESTOR')) {
    tipoAto = 'PORTARIA_FISCAL';
  }

  // Tenta extrair Objeto explícito sem cortar!
  const mObj = /(?:OBJETO|FINALIDADE)\s*:\s*([^]{12,420}?)(?=\.\s*(?:VALOR|PRAZO|VIG[ÊE]NCIA|ASSINATURA|DOTA[ÇC][ÃA]O|DATA|GUARULHOS)|$)/i.exec(ctxLimpo);
  const mRes = /RESOLVE\s*:\s*([^]{15,380}?)(?=\.\s*(?:Art\.|2\.|Publique|Guarulhos)|$)/i.exec(ctxLimpo);
  const mArt1 = /Art\.\s*1[º°]\s*([^]{15,360}?)(?=Art\.\s*2|$)/i.exec(ctxLimpo);

  let resumoSimples = '';
  if (mObj) {
    resumoSimples = mObj[1].trim();
  } else if (mRes) {
    resumoSimples = mRes[1].trim();
  } else if (mArt1) {
    resumoSimples = mArt1[1].trim();
  } else {
    // Remove meia-palavra no começo se começou cortado
    resumoSimples = ctxLimpo.replace(/^[a-záéíóúãõç]{1,12}\s+/, '').trim();
  }

  resumoSimples = resumoSimples.replace(/\s+/g, ' ').trim();
  if (resumoSimples.length > 260) {
    resumoSimples = resumoSimples.slice(0, 257).replace(/\s+\S*$/, '') + '…';
  }

  return { tipoAto, resumoSimples };
}

function main() {
  console.log('[1/4] Lendo os 222 PDFs locais com des-kerning para extrair conteúdo completo...');
  const manifesto = JSON.parse(fs.readFileSync(MANIFESTO_PATH, 'utf8'));
  const decretos = JSON.parse(fs.readFileSync(DECRETOS_JSON_PATH, 'utf8'));
  const conexoes = JSON.parse(fs.readFileSync(CONEXOES_JSON_PATH, 'utf8'));
  const credoresPkg = JSON.parse(fs.readFileSync(CREDORES_JSON_PATH, 'utf8'));

  // Agrupa decretos, leis e conexões por codigoDom para abrir cada PDF uma única vez!
  const decPorDom = new Map();
  for (const d of decretos) {
    const k = d.codigoDom || 0;
    if (!decPorDom.has(k)) decPorDom.set(k, []);
    decPorDom.get(k).push(d);
  }

  const leis = manifesto.leisMunicipaisSancionadas || [];
  const leiPorDom = new Map();
  for (const l of leis) {
    const k = l.codigoDom || 0;
    if (!leiPorDom.has(k)) leiPorDom.set(k, []);
    leiPorDom.get(k).push(l);
  }

  const cxPorDom = new Map();
  for (const cx of conexoes) {
    const k = cx.codigoDom || 0;
    if (!cxPorDom.has(k)) cxPorDom.set(k, []);
    cxPorDom.get(k).push(cx);
  }

  let decEnriquecidos = 0;
  let leisEnriquecidas = 0;
  let cxEnriquecidas = 0;

  for (let i = 0; i < manifesto.executivo.length; i++) {
    const ed = manifesto.executivo[i];
    const decsEd = decPorDom.get(ed.codigoDom) || [];
    const leisEd = leiPorDom.get(ed.codigoDom) || [];
    const cxsEd = cxPorDom.get(ed.codigoDom) || [];
    if (decsEd.length === 0 && leisEd.length === 0 && cxsEd.length === 0) continue;

    // Concatena o texto limpo dos cadernos dessa edição
    const textosCad = [];
    for (const cad of ed.cadernos) {
      if (!cad.arquivoLocal) continue;
      const abs = path.join(ROOT, cad.arquivoLocal);
      if (!fs.existsSync(abs)) continue;
      textosCad.push(extrairTextoCompletoPdf(abs, 800));
    }
    const textoEd = textosCad.join(' \n ');

    // 1A) Enriquece Decretos desta edição (do início exato de DECRETO Nº XXXXX até o próximo DECRETO/PORTARIA/LEI)
    for (const d of decsEd) {
      const numStr = String(d.numero).replace(/\D/g, '');
      const digitosFlex = numStr.split('').join('[.\\s]*');
      const reInicio = new RegExp(`DECRETO\\s+N[º°o.\\s]*${digitosFlex}\\b`, 'i');
      const mIni = reInicio.exec(textoEd);

      let bloco = '';
      if (mIni) {
        const resto = textoEd.slice(mIni.index, mIni.index + 3800);
        const mFim = /Art\.\s*[3456][º°]\s*Este Decreto entra em vigor[^.]*\./i.exec(resto);
        bloco = mFim ? resto.slice(0, mFim.index + mFim[0].length) : resto.slice(0, 2400);
      } else {
        bloco = desfazerKerningPdf(d.trecho || '');
        const idxProprio = bloco.search(/DECRETO\s+N/i);
        if (idxProprio > 0) bloco = bloco.slice(idxProprio);
      }

      const info = parseDecretoEstruturado(bloco, d.modalidade || 'SUPLEMENTAR', d.valorFmt);
      Object.assign(d, info);
      // Substitui trecho antigo poluído pela explicação cristalina!
      d.trecho = info.explicacaoSimples;
      decEnriquecidos++;
    }

    // 1B) Enriquece Leis desta edição
    for (const l of leisEd) {
      const numPuro = String(l.numero).replace(/^LC-/, '');
      const numPont = Number(numPuro).toLocaleString('pt-BR').replace(/\./g, '\\.?');
      const reLei = new RegExp(`LEI\\s+(?:COMPLEMENTAR\\s+)?Nº?\\s*${numPont}\\b`, 'i');
      const ml = reLei.exec(textoEd);

      let textoIntegral = '';
      if (ml) {
        const fatia = textoEd.slice(ml.index, ml.index + 2800);
        const mAss = /Guarulhos,\s*\d{1,2}\s+de\s+[a-zç]+\s+de\s+202[56]/i.exec(fatia);
        textoIntegral = mAss ? fatia.slice(0, mAss.index + mAss[0].length) : fatia.slice(0, 2200);
      }

      const trad = traduzirLeiEmLinguagemSimples(l.ementa, l.autoria);
      l.ementa = desfazerKerningPdf(l.ementa);
      l.autoria = desfazerKerningPdf(l.autoria);
      Object.assign(l, trad, {
        textoIntegral: textoIntegral || `${l.autoria} ${l.ementa}`,
      });
      leisEnriquecidas++;
    }

    // 1C) Enriquece Conexões de Empresas desta edição (com contexto amplo e limpo ao redor do CNPJ)
    for (const cx of cxsEd) {
      const cnpjFmt = cx.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      const idxCnpj = textoEd.indexOf(cnpjFmt);
      let ctxAmplo = desfazerKerningPdf(cx.trecho || '');
      if (idxCnpj >= 0) {
        // Recua até o começo de uma sentença/parágrafo (máx 420 chars antes) e avança até 750 chars depois (pegando OBJETO inteiro!)
        let ini = Math.max(0, idxCnpj - 420);
        const pontoAnt = textoEd.indexOf('. ', ini);
        if (pontoAnt > ini && pontoAnt < idxCnpj - 40) ini = pontoAnt + 2;
        const fim = Math.min(textoEd.length, idxCnpj + 780);
        ctxAmplo = desfazerKerningPdf(textoEd.slice(ini, fim));
      }

      const { tipoAto, resumoSimples } = classificarEResumirConexaoDom(ctxAmplo, cx.credor);
      cx.tipoAto = tipoAto;
      cx.resumoSimples = resumoSimples;
      cx.trecho = resumoSimples;
      cx.textoIntegral = ctxAmplo.slice(0, 1400);
      cxEnriquecidas++;
    }

    if ((i + 1) % 45 === 0) {
      console.log(`  -> Edições processadas: ${i + 1}/${manifesto.executivo.length}`);
    }
  }

  // Fallback para qualquer decreto/lei cujo codigoDom não estivesse no loop
  for (const d of decretos) {
    if (!d.tituloSimples) {
      const info = parseDecretoEstruturado(desfazerKerningPdf(d.trecho), d.modalidade || 'SUPLEMENTAR', d.valorFmt);
      Object.assign(d, info);
      d.trecho = info.explicacaoSimples;
    }
  }
  for (const l of leis) {
    if (!l.tituloSimples) {
      Object.assign(l, traduzirLeiEmLinguagemSimples(l.ementa, l.autoria), {
        textoIntegral: desfazerKerningPdf(`${l.autoria} ${l.ementa}`),
      });
    }
  }

  console.log(`  -> Enriquecidos: ${decEnriquecidos} decretos | ${leisEnriquecidas} leis | ${cxEnriquecidas} conexões DOM!`);

  // ==========================================================================
  // 2. CALCULAR INDICADORES PROFISSIONAIS DE AUDITORIA (PADRÃO TCE-SP / LRF)
  // ==========================================================================
  console.log('[2/4] Calculando indicadores profissionais de auditoria (Curva ABC, Dispensas, Secretarias)...');
  const itensExt = credoresPkg.itens.filter((c) => !c.r);
  const somaTotalExt = itensExt.reduce((s, c) => s + (c.t25 || 0) + (c.t26 || 0), 0);
  const somaTop10 = itensExt.slice(0, 10).reduce((s, c) => s + (c.t25 || 0) + (c.t26 || 0), 0);
  const somaTop50 = itensExt.slice(0, 50).reduce((s, c) => s + (c.t25 || 0) + (c.t26 || 0), 0);

  // Ranking das secretarias que mais receberam suplementação nos 843 decretos
  const mapaDestinosDecretos = new Map();
  const mapaOrigensDecretos = new Map();
  for (const d of decretos) {
    if (d.orgaoDestino) {
      const at = mapaDestinosDecretos.get(d.orgaoDestino) || { orgao: d.orgaoDestino, valor: 0, qtd: 0 };
      at.valor += d.valor;
      at.qtd++;
      mapaDestinosDecretos.set(d.orgaoDestino, at);
    }
    if (d.orgaoOrigem) {
      const at = mapaOrigensDecretos.get(d.orgaoOrigem) || { orgao: d.orgaoOrigem, valor: 0, qtd: 0 };
      at.valor += d.valor;
      at.qtd++;
      mapaOrigensDecretos.set(d.orgaoOrigem, at);
    }
  }

  const topSecretariasSuplementadas = [...mapaDestinosDecretos.values()]
    .map((x) => ({ ...x, valor: Math.round(x.valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  const topSecretariasCedentes = [...mapaOrigensDecretos.values()]
    .map((x) => ({ ...x, valor: Math.round(x.valor * 100) / 100 }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  const tiposAtoContagem = {};
  for (const cx of conexoes) {
    tiposAtoContagem[cx.tipoAto] = (tiposAtoContagem[cx.tipoAto] || 0) + 1;
  }

  // ==========================================================================
  // 3. GRAVAR ARQUIVOS ATUALIZADOS
  // ==========================================================================
  console.log('[3/4] Gravando JSONs enriquecidos e catálogos TypeScript...');
  fs.writeFileSync(DECRETOS_JSON_PATH, JSON.stringify(decretos, null, 2), 'utf8');
  manifesto.leisMunicipaisSancionadas = leis;
  fs.writeFileSync(MANIFESTO_PATH, JSON.stringify(manifesto, null, 2), 'utf8');
  fs.writeFileSync(CONEXOES_JSON_PATH, JSON.stringify(conexoes), 'utf8');

  // Atualiza src/domain/diariosCatalogoReal.ts
  let ts = fs.readFileSync(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), 'utf8');
  const idxDecInterface = ts.indexOf('export interface DecretoSuplementarReal');
  const idxResumoInterface = ts.indexOf('export interface ResumoValidacaoAcervo');
  const novoDecInterface = `export interface DecretoSuplementarReal {
  numero: string;
  modalidade?: ModalidadeDecretoReal;
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
  tituloSimples?: string;
  destinoResumo?: string;
  origemResumo?: string;
  orgaoDestino?: string | null;
  orgaoOrigem?: string | null;
  tipoFonteOrigem?: string;
  processoSei?: string | null;
  explicacaoSimples?: string;
  textoIntegral?: string;
  pdfUrl: string;
}

`;
  ts = ts.slice(0, idxDecInterface) + novoDecInterface + ts.slice(idxResumoInterface);

  const idxLeiInterface = ts.indexOf('export interface LeiMunicipalSancionadaReal');
  const extratosAtuais = manifesto.extratosContratosDom || [];
  ts =
    ts.slice(0, idxLeiInterface) +
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
  tituloSimples?: string;
  autorLimpo?: string;
  projetoOrigem?: string | null;
  tema?: string;
  oQueMuda?: string;
  textoIntegral?: string;
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

/** Leis Municipais (Ordinárias e Complementares) sancionadas em 2025 e 2026 com tradução cidadã */
export const LEIS_MUNICIPAIS_SANCIONADAS_REAIS: LeiMunicipalSancionadaReal[] = ${JSON.stringify(leis)};

/** Extratos de contratos, atas e termos aditivos extraídos diretamente do Diário Oficial */
export const EXTRATOS_CONTRATOS_DOM_REAIS: ExtratoContratoDomReal[] = ${JSON.stringify(extratosAtuais)};

/** Catálogo completo dos 843 Decretos Orçamentários com origem, destino e texto integral */
export const CATALOGO_DECRETOS_SUPLEMENTARES_REAIS: DecretoSuplementarReal[] = ${JSON.stringify(decretos)};
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'domain', 'diariosCatalogoReal.ts'), ts, 'utf8');

  // Atualiza src/database/resumoConexoesOficiais.ts preservando modalidadesLicitacao2026
  const resAntTxt = fs.readFileSync(path.join(ROOT, 'src', 'database', 'resumoConexoesOficiais.ts'), 'utf8');
  const idxObj = resAntTxt.indexOf('export const RESUMO_CONEXOES_OFICIAIS = ');
  const objAnt = JSON.parse(
    resAntTxt
      .slice(idxObj + 'export const RESUMO_CONEXOES_OFICIAIS = '.length)
      .replace(/\s*as const;\s*$/, '')
  );

  const dispensaTotal = (objAnt.modalidadesLicitacao2026 || [])
    .filter((m) => /dispensa|inexig/i.test(m.modalidade))
    .reduce((s, m) => s + m.total, 0);
  const dispensaEmpresas = (objAnt.modalidadesLicitacao2026 || [])
    .filter((m) => /dispensa|inexig/i.test(m.modalidade))
    .reduce((s, m) => s + m.qtdEmpresas, 0);

  const novoResumo = {
    ...objAnt,
    geradoEm: new Date().toISOString(),
    tiposAtoDom: tiposAtoContagem,
    indicadoresAuditoria: {
      totalPagoExternosConsolidado: Math.round(somaTotalExt * 100) / 100,
      top10Valor: Math.round(somaTop10 * 100) / 100,
      top10Percentual: Math.round((somaTop10 / somaTotalExt) * 1000) / 10,
      top50Valor: Math.round(somaTop50 * 100) / 100,
      top50Percentual: Math.round((somaTop50 / somaTotalExt) * 1000) / 10,
      contratacoesDiretas2026Valor: Math.round(dispensaTotal * 100) / 100,
      contratacoesDiretas2026Empresas: dispensaEmpresas,
      totalMovimentadoDecretos: Math.round(decretos.reduce((s, d) => s + d.valor, 0) * 100) / 100,
      topSecretariasSuplementadas,
      topSecretariasCedentes,
    },
  };

  const novoResumoTs = `/**
 * ============================================================================
 * RESUMO INTEGRAL DE EMPRESAS, INDICADORES DE AUDITORIA E CONEXÕES DOM
 * ============================================================================
 */

export interface ResumoModalidadeLicitacao {
  modalidade: string;
  total: number;
  qtdPagamentos: number;
  qtdEmpresas: number;
}

export const RESUMO_CONEXOES_OFICIAIS = ${JSON.stringify(novoResumo, null, 2)} as const;
`;
  fs.writeFileSync(path.join(ROOT, 'src', 'database', 'resumoConexoesOficiais.ts'), novoResumoTs, 'utf8');

  console.log('\n[4/4] AMOSTRA DO NOVO CONTEÚDO CLARO:');
  console.log('  Decreto exemplo:', {
    num: decretos[0].numeroFmt,
    titulo: decretos[0].tituloSimples,
    origem: decretos[0].origemResumo,
    destino: decretos[0].destinoResumo,
    explicacao: decretos[0].explicacaoSimples,
  });
  console.log('  Lei exemplo:', {
    num: leis[3]?.numeroFmt,
    tema: leis[3]?.tema,
    titulo: leis[3]?.tituloSimples,
    autor: leis[3]?.autorLimpo,
  });
  console.log('  Conexão exemplo:', {
    emp: conexoes[0]?.credor,
    tipo: conexoes[0]?.tipoAto,
    resumo: conexoes[0]?.resumoSimples,
  });
  console.log('  Indicadores de Auditoria:', novoResumo.indicadoresAuditoria);
}

main();
