/**
 * ============================================================================
 * ATUALIZADOR DO SNAPSHOT OFICIAL TCE-SP 2026 (JAN–SET) + CORREÇÃO DE ENCODING
 * ============================================================================
 * Lê os pacotes oficiais recém-baixados do TCE-SP:
 *   - TCE-2026/despesas-guarulhos-2026-atualizado.zip
 *   - TCE-2026/receitas-guarulhos-2026-atualizado.zip
 * Decodifica corretamente Windows-1252 / ISO-8859-1 (zero caracteres ''),
 * incorpora o lote completo de Setembro/2026 recém-publicado pelo TCE-SP e
 * regenera src/database/contingenciaOficialGuarulhos.ts mantendo 100% de
 * compatibilidade com despesasRepository.ts e receitasRepository.ts.
 * ============================================================================
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');

const ROOT = process.cwd();
const DIR_TCE26 = path.join(ROOT, 'TCE-2026');

/** Extrai o primeiro arquivo CSV de um pacote .zip padrão PKZIP lendo o Central Directory */
function extrairPrimeiroCsvDoZip(caminhoZip) {
  const buf = fs.readFileSync(caminhoZip);
  // Localiza End of Central Directory (0x06054b50) de trás para frente
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) throw new Error(`EOCD não encontrado em ${caminhoZip}`);

  const cdEntries = buf.readUInt16LE(eocdOffset + 10);
  let ptr = buf.readUInt32LE(eocdOffset + 16);

  for (let e = 0; e < cdEntries; e++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('Assinatura CD inválida');
    const metodo = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localHeaderOffset = buf.readUInt32LE(ptr + 42);
    const fileName = buf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');

    if (fileName.toLowerCase().endsWith('.csv')) {
      if (buf.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
        throw new Error('Local file header inválido');
      }
      const lfNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const lfExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lfNameLen + lfExtraLen;
      const compSlice = buf.subarray(dataStart, dataStart + compSize);
      const rawBuf = metodo === 0 ? compSlice : metodo === 8 ? zlib.inflateRawSync(compSlice) : null;
      if (!rawBuf) throw new Error(`Método de compressão não suportado: ${metodo}`);

      // Testa UTF-8; se houver caractere de substituição U+FFFD, decodifica como Windows-1252
      const utf8 = new TextDecoder('utf-8').decode(rawBuf);
      const texto = utf8.includes('\uFFFD') ? new TextDecoder('windows-1252').decode(rawBuf) : utf8;
      return { fileName, texto, bytesDescompactados: rawBuf.length };
    }

    ptr += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`Nenhum CSV encontrado dentro de ${caminhoZip}`);
}

/** Parser rápido de linha CSV separada por ';' com suporte a aspas */
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

function normalizarSemAcento(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function parseValorBr(s) {
  if (!s) return 0;
  const n = Number(String(s).trim().replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function parseDataBrParaIso(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s ?? '').trim());
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const META_AREAS = {
  'Saúde & Hospitais': {
    icone: '🏥',
    explicacao_pratica:
      'Hospitais municipais (HMU, HMC), UPAs 24h, 69 UBS, SAMU, remédios e contratos de gestão em saúde.',
  },
  'Educação & Creches': {
    icone: '🏫',
    explicacao_pratica:
      'Escolas da Prefeitura (EPGs), creches parceiras, merenda escolar, uniformes e salários do magistério (FUNDEB).',
  },
  'Administração, Finanças & Legislativo': {
    icone: '🏛️',
    explicacao_pratica:
      'Funcionamento das secretarias, Câmara Municipal, tecnologia, encargos gerais e atendimento Fácil.',
  },
  'Limpeza Urbana, Obras & Bairros': {
    icone: '🚧',
    explicacao_pratica:
      'Coleta de lixo, varrição, ecopontos, tapa-buraco, iluminação pública, drenagem e obras viárias.',
  },
  'Previdência Municipal (IPREM)': {
    icone: '👵',
    explicacao_pratica:
      'Pagamento de aposentadorias e pensões dos servidores públicos municipais aposentados pelo IPREM.',
  },
  'Transporte & Trânsito': {
    icone: '🚌',
    explicacao_pratica:
      'Subsídio das linhas municipais de ônibus, manutenção de corredores, semáforos e fiscalização viária.',
  },
  'Assistência Social & Cidadania': {
    icone: '🤝',
    explicacao_pratica:
      'CRAS, CREAS, acolhimento social, proteção à criança/idoso e programas de combate à vulnerabilidade.',
  },
  'Segurança & Guarda Civil (GCM)': {
    icone: '🛡️',
    explicacao_pratica:
      'Guarda Civil Municipal (GCM), patrulhamento, videomonitoramento e defesa civil.',
  },
};

function classificarArea(funcao, subfuncao, orgao, credor) {
  const f = normalizarSemAcento(funcao);
  const sf = normalizarSemAcento(subfuncao);
  const c = normalizarSemAcento(credor);
  const o = normalizarSemAcento(orgao);

  if (f.includes('SAUDE') || c === 'SECRETARIA DA SAUDE') return 'Saúde & Hospitais';
  if (f.includes('EDUCACAO') || f.includes('CULTURA') || f.includes('DESPORTO') || c === 'SECRETARIA DE EDUCACAO') {
    return 'Educação & Creches';
  }
  if (
    f.includes('URBANISMO') ||
    f.includes('HABITACAO') ||
    f.includes('SANEAMENTO') ||
    f.includes('GESTAO AMBIENTAL')
  ) {
    return 'Limpeza Urbana, Obras & Bairros';
  }
  if (f.includes('PREVIDENCIA') || (o.includes('PREVID') && !f.includes('SAUDE'))) {
    return 'Previdência Municipal (IPREM)';
  }
  if (f.includes('TRANSPORTE')) return 'Transporte & Trânsito';
  if (f.includes('ASSISTENCIA SOCIAL') || f.includes('DIREITOS DA CIDADANIA') || f.includes('TRABALHO')) {
    return 'Assistência Social & Cidadania';
  }
  if (f.includes('SEGURANCA PUBLICA') || sf.includes('DEFESA CIVIL')) {
    return 'Segurança & Guarda Civil (GCM)';
  }
  return 'Administração, Finanças & Legislativo';
}

function ehRepasseInterno(cnpj, credor) {
  if (cnpj && (cnpj.startsWith('46319000') || cnpj === '49811037000199' || cnpj === '52373396000116')) {
    return true;
  }
  const c = normalizarSemAcento(credor);
  return (
    c.startsWith('SECRETARIA ') ||
    c.startsWith('PREFEITURA MUNICIPAL DE GUARULHOS') ||
    c.startsWith('CAMARA MUNICIPAL DE GUARULHOS') ||
    c.startsWith('INSTITUTO DE PREVID DOS FUNC PUBL MUN DE GUARULHOS')
  );
}

function chaveCredor(cnpj, tipo, nome) {
  if (cnpj && cnpj.length === 14) return cnpj;
  const hash = crypto.createHash('sha1').update(`${tipo}|${normalizarSemAcento(nome)}`).digest('hex').slice(0, 14);
  return `${(tipo || 'outro').toLowerCase()}-${hash}`;
}

function limparPrefixoCodigo(s) {
  return String(s ?? '').replace(/^\s*[\d.]+\s*-\s*/, '').trim();
}

function main() {
  // Descobre quantos credores o snapshot anterior mantinha para preservar tamanho ideal de bundle
  const snapAntigoTxt = fs.readFileSync(path.join(ROOT, 'src', 'database', 'contingenciaOficialGuarulhos.ts'), 'utf8');
  const idxAnt = snapAntigoTxt.indexOf('export const SNAPSHOT_TCE_GUARULHOS_2026: any = ');
  const objAnt = JSON.parse(snapAntigoTxt.slice(idxAnt + 'export const SNAPSHOT_TCE_GUARULHOS_2026: any = '.length).replace(/;\s*$/, ''));
  const qtdCredoresBundle = Math.max(objAnt.despesas.credores.length, 300);
  console.log(`Credores mantidos no snapshot anterior: ${objAnt.despesas.credores.length} (usaremos top ${qtdCredoresBundle})`);

  // 1. Extrai e processa Despesas 2026 (Jan–Set)
  const zipDesp = path.join(DIR_TCE26, 'despesas-guarulhos-2026-atualizado.zip');
  const { texto: csvDesp, bytesDescompactados: bytesDesp } = extrairPrimeiroCsvDoZip(zipDesp);
  fs.writeFileSync(path.join(DIR_TCE26, 'despesas-guarulhos-2026.csv'), csvDesp, 'utf8');
  console.log(`Despesas 2026 extraídas: ${(bytesDesp / (1024 * 1024)).toFixed(2)} MB (UTF-8 limpo)`);

  const linhasDesp = csvDesp.split(/\r?\n/);
  const cabDesp = parseLinhaCsv(linhasDesp[0].replace(/^\uFEFF/, ''));
  const colD = Object.fromEntries(cabDesp.map((c, i) => [c, i]));

  let totalPagoPositivo = 0;
  let totalEstornos = 0;
  let qtdPagamentos = 0;
  let qtdEstornos = 0;
  let ultimaData = '2026-01-01';

  const porMesMap = new Map();
  const porOrgaoMap = new Map();
  const porAreaMap = new Map();
  const credoresMap = new Map();
  const todosCredoresSet = new Set();

  for (let i = 1; i < linhasDesp.length; i++) {
    const ln = linhasDesp[i];
    if (!ln) continue;
    // Filtro rápido antes do split completo
    if (!ln.includes('Valor Pago') && !ln.includes('Anulação de Pagamento') && !ln.includes('Anulacao de Pagamento')) {
      continue;
    }

    const r = parseLinhaCsv(ln);
    const tp = normalizarSemAcento(r[colD.tp_despesa]);
    if (tp !== 'VALOR PAGO' && tp !== 'ANULACAO DE PAGAMENTO') continue;

    let valor = parseValorBr(r[colD.vl_despesa]);
    if (tp === 'ANULACAO DE PAGAMENTO' && valor > 0) valor = -valor;
    if (valor === 0) continue;

    const dataIso = parseDataBrParaIso(r[colD.dt_emissao_despesa]);
    const mes = Number(r[colD.mes_referencia]) || (dataIso ? Number(dataIso.slice(5, 7)) : 1);
    const orgao = r[colD.ds_orgao] || 'PREFEITURA MUNICIPAL DE GUARULHOS';
    const credor = (r[colD.ds_despesa] || 'CREDOR NÃO INFORMADO').replace(/\s+/g, ' ').trim();
    const idForn = r[colD.identificador_despesa] || '';
    const idNorm = normalizarSemAcento(idForn);
    let tipoCredor = 'OUTRO';
    let cnpj = null;
    if (idNorm.includes('CNPJ') || idNorm.includes('JURIDICA')) {
      tipoCredor = 'PJ';
      const digs = idForn.replace(/\D/g, '');
      cnpj = digs.length >= 14 ? digs.slice(-14) : null;
    } else if (idNorm.includes('FISICA')) {
      tipoCredor = 'PF';
    }

    const chave = chaveCredor(cnpj, tipoCredor, credor);
    todosCredoresSet.add(chave);

    if (valor > 0) {
      totalPagoPositivo += valor;
      qtdPagamentos++;
    } else {
      totalEstornos += valor;
      qtdEstornos++;
    }
    if (dataIso && dataIso > ultimaData) ultimaData = dataIso;

    // Por mês
    const mAt = porMesMap.get(mes) || { mes, exercicio: 2026, total_liquido: 0, qtd: 0 };
    mAt.total_liquido += valor;
    if (valor > 0) mAt.qtd++;
    porMesMap.set(mes, mAt);

    // Por órgão
    const oAt = porOrgaoMap.get(orgao) || { orgao, total_liquido: 0, qtd: 0, credoresSet: new Set() };
    oAt.total_liquido += valor;
    if (valor > 0) oAt.qtd++;
    oAt.credoresSet.add(chave);
    porOrgaoMap.set(orgao, oAt);

    // Por área
    const areaNome = classificarArea(r[colD.ds_funcao_governo], r[colD.ds_subfuncao_governo], orgao, credor);
    const aAt = porAreaMap.get(areaNome) || {
      area: areaNome,
      icone: META_AREAS[areaNome].icone,
      explicacao_pratica: META_AREAS[areaNome].explicacao_pratica,
      total_liquido: 0,
      qtd_pagamentos: 0,
      credoresSet: new Set(),
    };
    aAt.total_liquido += valor;
    if (valor > 0) aAt.qtd_pagamentos++;
    aAt.credoresSet.add(chave);
    porAreaMap.set(areaNome, aAt);

    // Por credor
    let cAt = credoresMap.get(chave);
    if (!cAt) {
      cAt = {
        chave,
        credor,
        cnpj_credor: cnpj,
        tipo_credor: tipoCredor,
        total_liquido: 0,
        qtd: 0,
        primeiro_pagamento: dataIso,
        ultimo_pagamento: dataIso,
        maior_pagamento: 0,
        orgao,
        area: areaNome,
        repasse_interno: ehRepasseInterno(cnpj, credor),
        pags: [],
      };
      credoresMap.set(chave, cAt);
    }
    cAt.total_liquido += valor;
    if (valor > 0) cAt.qtd++;
    if (dataIso && (!cAt.primeiro_pagamento || dataIso < cAt.primeiro_pagamento)) cAt.primeiro_pagamento = dataIso;
    if (dataIso && (!cAt.ultimo_pagamento || dataIso > cAt.ultimo_pagamento)) cAt.ultimo_pagamento = dataIso;
    if (valor > cAt.maior_pagamento) cAt.maior_pagamento = valor;

    // Guarda os pagamentos mais recentes / relevantes (até 10 por credor para manter bundle rápido)
    const hist = (r[colD.historico_despesa] || r[colD.ds_acao] || 'Pagamento liquidado').replace(/\s+/g, ' ').trim();
    const emp = (r[colD.nr_empenho] || '').trim() || null;
    cAt.pags.push({
      data_pagamento: dataIso || `2026-${String(mes).padStart(2, '0')}-28`,
      orgao,
      valor_pago: valor,
      nr_empenho: emp,
      descricao: hist.slice(0, 280),
      fonte_url: 'https://transparencia.tce.sp.gov.br/municipio/guarulhos',
    });
  }

  const porMesDesp = [...porMesMap.values()]
    .map((m) => ({ ...m, total_liquido: Math.round(m.total_liquido * 100) / 100 }))
    .sort((a, b) => a.mes - b.mes);

  const porOrgaoDesp = [...porOrgaoMap.values()]
    .map((o) => ({
      orgao: o.orgao,
      total_liquido: Math.round(o.total_liquido * 100) / 100,
      qtd: o.qtd,
      qtd_credores: o.credoresSet.size,
    }))
    .sort((a, b) => b.total_liquido - a.total_liquido);

  const porAreaDesp = [...porAreaMap.values()]
    .map((a) => ({
      area: a.area,
      icone: a.icone,
      explicacao_pratica: a.explicacao_pratica,
      total_liquido: Math.round(a.total_liquido * 100) / 100,
      qtd_pagamentos: a.qtd_pagamentos,
      qtd_credores: a.credoresSet.size,
    }))
    .sort((a, b) => b.total_liquido - a.total_liquido);

  const credoresOrdenados = [...credoresMap.values()]
    .filter((c) => c.total_liquido > 0)
    .sort((a, b) => b.total_liquido - a.total_liquido)
    .slice(0, qtdCredoresBundle)
    .map((c) => {
      // Ordena pagamentos por data mais recente primeiro e mantém até 10 amostras representativas
      const pagsOrd = c.pags
        .sort((a, b) => b.data_pagamento.localeCompare(a.data_pagamento) || b.valor_pago - a.valor_pago)
        .slice(0, 10)
        .map((p, idx) => ({
          id: `${c.chave}-${idx + 1}`,
          ...p,
        }));
      return {
        chave: c.chave,
        credor: c.credor,
        cnpj_credor: c.cnpj_credor,
        tipo_credor: c.tipo_credor,
        total_liquido: Math.round(c.total_liquido * 100) / 100,
        qtd: c.qtd,
        primeiro_pagamento: c.primeiro_pagamento,
        ultimo_pagamento: c.ultimo_pagamento,
        maior_pagamento: Math.round(c.maior_pagamento * 100) / 100,
        orgao: c.orgao,
        area: c.area,
        repasse_interno: c.repasse_interno,
        pags: pagsOrd,
      };
    });

  const resumoDesp = {
    total_liquido: Math.round((totalPagoPositivo + totalEstornos) * 100) / 100,
    total_pago: Math.round(totalPagoPositivo * 100) / 100,
    total_estornos: Math.round(totalEstornos * 100) / 100,
    qtd_pagamentos: qtdPagamentos,
    qtd_estornos: qtdEstornos,
    qtd_credores: todosCredoresSet.size,
    ultima_data: ultimaData,
    ultima_coleta: `${ultimaData}T18:00:00Z`,
  };

  // 2. Extrai e processa Receitas 2026 (Jan–Set)
  const zipRec = path.join(DIR_TCE26, 'receitas-guarulhos-2026-atualizado.zip');
  const { texto: csvRec, bytesDescompactados: bytesRec } = extrairPrimeiroCsvDoZip(zipRec);
  fs.writeFileSync(path.join(DIR_TCE26, 'receitas-guarulhos-2026.csv'), csvRec, 'utf8');
  console.log(`Receitas 2026 extraídas: ${(bytesRec / (1024 * 1024)).toFixed(2)} MB (UTF-8 limpo)`);

  const linhasRec = csvRec.split(/\r?\n/);
  const cabRec = parseLinhaCsv(linhasRec[0].replace(/^\uFEFF/, ''));
  const colR = Object.fromEntries(cabRec.map((c, i) => [c, i]));

  let totalArrecadado = 0;
  let totalCorrente = 0;
  let totalCapital = 0;
  let totalIntra = 0;
  let qtdLancRec = 0;
  let ultimoMesRec = 1;

  const recMesMap = new Map();
  const recFonteMap = new Map();
  const recArvoreMap = new Map();

  for (let i = 1; i < linhasRec.length; i++) {
    const ln = linhasRec[i];
    if (!ln) continue;
    const r = parseLinhaCsv(ln);
    const val = parseValorBr(r[colR.vl_arrecadacao]);
    if (val === 0) continue;

    const mes = Number(r[colR.mes_referencia]) || 1;
    if (mes > ultimoMesRec) ultimoMesRec = mes;
    qtdLancRec++;
    totalArrecadado += val;

    const catBruta = limparPrefixoCodigo(r[colR.ds_categoria] || 'Receitas Correntes');
    const subBruta = limparPrefixoCodigo(r[colR.ds_subcategoria] || 'Outras Receitas');
    const rubricaBruta = limparPrefixoCodigo(r[colR.ds_d1] || r[colR.ds_fonte] || subBruta);
    const fonteBruta = limparPrefixoCodigo(r[colR.ds_fonte_recurso] || 'TESOURO');

    const catNorm = normalizarSemAcento(catBruta);
    if (catNorm.includes('INTRA')) {
      totalIntra += val;
    } else if (catNorm.includes('CAPITAL')) {
      totalCapital += val;
    } else {
      totalCorrente += val;
    }

    const rm = recMesMap.get(mes) || { mes, exercicio: 2026, total_liquido: 0, qtd: 0 };
    rm.total_liquido += val;
    rm.qtd++;
    recMesMap.set(mes, rm);

    const rf = recFonteMap.get(fonteBruta) || { fonte_recurso: fonteBruta, total: 0, qtd: 0 };
    rf.total += val;
    rf.qtd++;
    recFonteMap.set(fonteBruta, rf);

    const chaveArv = `${catBruta}|${subBruta}|${rubricaBruta}`;
    const ra = recArvoreMap.get(chaveArv) || {
      categoria: catBruta,
      subcategoria: subBruta,
      rubrica: rubricaBruta,
      total: 0,
      qtd: 0,
    };
    ra.total += val;
    ra.qtd++;
    recArvoreMap.set(chaveArv, ra);
  }

  const snapshotNovo = {
    despesas: {
      resumo: resumoDesp,
      porMes: porMesDesp,
      porOrgao: porOrgaoDesp,
      porArea: porAreaDesp,
      credores: credoresOrdenados,
    },
    receitas: {
      resumo: {
        total_arrecadado: Math.round(totalArrecadado * 100) / 100,
        total_corrente: Math.round(totalCorrente * 100) / 100,
        total_capital: Math.round(totalCapital * 100) / 100,
        total_intra: Math.round(totalIntra * 100) / 100,
        qtd_lancamentos: qtdLancRec,
        ultimo_mes: ultimoMesRec,
      },
      porMes: [...recMesMap.values()]
        .map((x) => ({ ...x, total_liquido: Math.round(x.total_liquido * 100) / 100 }))
        .sort((a, b) => a.mes - b.mes),
      porFonte: [...recFonteMap.values()]
        .map((x) => ({ ...x, total: Math.round(x.total * 100) / 100 }))
        .sort((a, b) => b.total - a.total),
      arvore: [...recArvoreMap.values()]
        .map((x) => ({ ...x, total: Math.round(x.total * 100) / 100 }))
        .sort((a, b) => b.total - a.total),
    },
  };

  const outTs = `/**
 * ============================================================================
 * SNAPSHOT OFICIAL DE CONTINGÊNCIA LOCAL (TCE-SP AUDESP 2026 — GUARULHOS)
 * Gerado automaticamente a partir dos pacotes oficiais do TCE-SP (Jan–Set 2026):
 *   - TCE-2026/receitas-guarulhos-2026.csv (${qtdLancRec.toLocaleString('pt-BR')} lançamentos oficiais)
 *   - TCE-2026/despesas-guarulhos-2026.csv (${qtdPagamentos.toLocaleString('pt-BR')} pagamentos liquidados)
 * ============================================================================
 * Garante disponibilidade imediata, acentuação UTF-8 íntegra e zero erros de tela.
 */
export const SNAPSHOT_TCE_GUARULHOS_2026: any = ${JSON.stringify(snapshotNovo)};
`;

  const outPath = path.join(ROOT, 'src', 'database', 'contingenciaOficialGuarulhos.ts');
  fs.writeFileSync(outPath, outTs, 'utf8');

  console.log('\n====================================================================');
  console.log('SNAPSHOT TCE-SP 2026 ATUALIZADO COM SUCESSO (ATÉ SETEMBRO/2026)!');
  console.log('Despesas resumo:', snapshotNovo.despesas.resumo);
  console.log('Despesas porMes:', snapshotNovo.despesas.porMes);
  console.log('Despesas porOrgao:', snapshotNovo.despesas.porOrgao);
  console.log('Receitas resumo:', snapshotNovo.receitas.resumo);
  console.log('Tamanho do arquivo TS:', (fs.statSync(outPath).size / 1024).toFixed(1), 'KB');
  console.log('Contém caractere corrompido U+FFFD?', outTs.includes('\uFFFD'));
  console.log('====================================================================');
}

main();
